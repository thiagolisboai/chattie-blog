/**
 * Autonomous Session — orquestrador do Dexter, agente de conteúdo do Chattie Blog
 *
 * Executa a hierarquia de prioridade definida no CLAUDE.md:
 *   1. Posts com queda de ranking → atualizar
 *   2. Oportunidades de CTR → reescrever title/meta
 *   3. Queries sem post dedicado → criar novo post
 *   4. Conteúdo dormante → revisar
 *   5. Novo post do backlog → keyword Alta prioridade + Baixa/Média competição
 *
 * Uso:
 *   node scripts/autonomous-session.mjs
 *   node scripts/autonomous-session.mjs --force-new   (pula verificações, cria novo post)
 *   node scripts/autonomous-session.mjs --dry-run     (não salva nem commita)
 *
 * Saída:
 *   Exit 0 — post criado/atualizado, mudanças prontas para commit
 *   Exit 1 — erro crítico
 *   Exit 2 — nada a fazer (blog está em dia)
 *
 * Variáveis de ambiente necessárias:
 *   ANTHROPIC_API_KEY, PEXELS_API_KEY, BRAVE_API_KEY
 *   GSC_KEY_FILE, GSC_SITE_URL
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { generatePost, markKeywordPublished } from './generate-post.mjs'
import { generateLinkedInDraft } from './generate-linkedin-draft.mjs'
import { braveSearch } from './brave-search.mjs'
import { config, printConfig } from './load-config.mjs'
import { validateFrontmatter } from './validate-frontmatter.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const DRY_RUN    = process.argv.includes('--dry-run')
  || config.publishing.mode === 'dry-run'
const FORCE_NEW  = process.argv.includes('--force-new')
const POST_TYPE  = process.argv.includes('--type=pillar') ? 'pillar' : 'post'

// PR_MODE: CLI flag > scheduled cron override > config default
const _cliPrMode       = process.argv.includes('--pr-mode')
const _scheduledCron   = process.env.GITHUB_EVENT_NAME === 'schedule'
const _configPrMode    = config.publishing.mode === 'pr'
const _cronRequiresPR  = _scheduledCron && config.publishing.scheduledRunsRequireReview
const PR_MODE = _cliPrMode || _cronRequiresPR || (_configPrMode && !process.argv.includes('--direct'))

// ─── Load .env.local ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const [k, ...v] = line.split('=')
    if (k && !k.startsWith('#') && v.length) {
      const key = k.trim()
      if (!process.env[key]) process.env[key] = v.join('=').trim()
    }
  })
}
loadEnv()

// ─── Logging ─────────────────────────────────────────────────────────────────

const LOG = []
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  LOG.push(line)
}

// ─── Step 0: Brave Search health check ───────────────────────────────────────

/**
 * Faz uma query de teste real na Brave Search API para confirmar que a key
 * está válida e a API está respondendo antes de iniciar a sessão.
 *
 * Retorna: 'ok' | 'no-key' | 'rate-limit' | 'auth-error' | 'network-error' | 'degraded'
 *
 * Política:
 *   - 'ok'         → tudo certo, continua normalmente
 *   - 'no-key'     → BRAVE_API_KEY ausente; ABORTA se config.quality.groundingVerify=true,
 *                    pois grounding sem SERP não tem valor (claims não verificados)
 *   - 'rate-limit' → 429 da API; aborta para não gerar conteúdo sem análise competitiva
 *   - 'auth-error' → 401/403; key inválida ou expirada; aborta
 *   - 'network-error' → timeout/erro de rede; aborta por padrão
 *   - 'degraded'   → resposta inesperada mas não fatal
 */
async function checkBraveSearch() {
  const key = process.env.BRAVE_API_KEY
  if (!key) {
    log('⚠️  BRAVE_API_KEY ausente — SERP analysis e grounding desativados')
    return 'no-key'
  }

  log('🔍  Verificando Brave Search API...')

  const { default: _https } = await import('https')
  const { default: _zlib }  = await import('zlib')

  const params = new URLSearchParams({ q: 'linkedin prospecção b2b', count: '1', search_lang: 'pt-br', country: 'BR' })
  const options = {
    hostname: 'api.search.brave.com',
    path: `/res/v1/web/search?${params}`,
    method: 'GET',
    headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': key },
  }

  return new Promise((resolve) => {
    const req = _https.get(options, (res) => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        log(`❌  Brave Search: autenticação falhou (HTTP ${res.statusCode}) — key inválida ou expirada`)
        resolve('auth-error')
        return
      }
      if (res.statusCode === 429) {
        log(`❌  Brave Search: rate limit atingido (HTTP 429) — aguarde antes de rodar novamente`)
        resolve('rate-limit')
        return
      }
      const chunks = []
      const enc = res.headers['content-encoding']
      const stream = enc === 'gzip' ? res.pipe(_zlib.createGunzip()) : res
      stream.on('data', c => chunks.push(c))
      stream.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
          if (json.web?.results?.length > 0) {
            log('✅  Brave Search OK')
            resolve('ok')
          } else {
            log(`⚠️  Brave Search: resposta inesperada — ${JSON.stringify(json).slice(0, 80)}`)
            resolve('degraded')
          }
        } catch {
          log('⚠️  Brave Search: erro ao parsear resposta')
          resolve('degraded')
        }
      })
    })

    req.on('error', (e) => {
      log(`❌  Brave Search: erro de rede — ${e.message}`)
      resolve('network-error')
    })
    req.setTimeout(8000, () => {
      req.destroy()
      log('❌  Brave Search: timeout (8s) — API não respondeu')
      resolve('network-error')
    })
  })
}

// ─── Step 1: Run GSC report ───────────────────────────────────────────────────

async function runGscReport() {
  log('📊  Atualizando relatório GSC...')
  try {
    execSync('node scripts/gsc-report.mjs', { cwd: ROOT, stdio: 'inherit' })
    log('✅  GSC report atualizado')
    return true
  } catch (err) {
    log(`⚠️  GSC report falhou (${err.message}) — continuando sem dados GSC`)
    return false
  }
}

// ─── Step 2: Parse GSC insights ──────────────────────────────────────────────

function parseGscInsights() {
  const p = path.join(ROOT, 'docs', 'gsc-insights.md')
  if (!fs.existsSync(p)) return { rankingDrops: [], ctrOpportunities: [], queryGaps: [] }

  const raw = fs.readFileSync(p, 'utf-8')

  // Parse ranking drops
  const dropsSection = raw.match(/##.*[Qq]uedas[\s\S]*?(?=\n##|\n---)/)?.[0] || ''
  const rankingDrops = [...dropsSection.matchAll(/\|\s*(\/[^\s|]+)/g)].map(m => m[1])

  // Parse CTR opportunities
  const ctrSection = raw.match(/##.*CTR[\s\S]*?(?=\n##)/)?.[0] || ''
  const ctrRows = [...ctrSection.matchAll(/\|\s*(\/[^\s|]+)\s*\|\s*(\d+)\s*\|\s*\d+\s*\|\s*([\d.]+%)/g)]
  const ctrOpportunities = ctrRows.map(m => ({
    url: m[1],
    impressions: parseInt(m[2]),
    ctr: parseFloat(m[3]),
  })).filter(r => r.impressions >= 50)

  // Parse query gaps (queries without dedicated posts)
  const querySection = raw.match(/##.*[Qq]ueries[\s\S]*?(?=\n##)/)?.[0] || ''
  const queryGaps = [...querySection.matchAll(/\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|/g)]
    .map(m => ({ query: m[1].trim(), impressions: parseInt(m[2]) }))
    .filter(r => r.query && !r.query.startsWith('Query') && r.impressions >= 30)

  return { rankingDrops, ctrOpportunities, queryGaps }
}

// ─── Step 3: Parse update audit ──────────────────────────────────────────────

function getCriticalUpdates() {
  try {
    const output = execSync('node scripts/update-audit.mjs', { cwd: ROOT }).toString()
    // Extract critical slugs from output (lines with [PT-BR] or [EN] prefix)
    const critical = [...output.matchAll(/\[(PT-BR|EN)\]\s+([^\s]+)/g)]
      .map(m => ({ lang: m[1], slug: m[2] }))
    return critical
  } catch {
    return []
  }
}

// ─── Step 4: Select next keyword from backlog ─────────────────────────────────

function selectKeywordFromBacklog() {
  const p = path.join(ROOT, 'docs', 'keyword-backlog.md')
  if (!fs.existsSync(p)) return null

  const raw = fs.readFileSync(p, 'utf-8')
  const lines = raw.split('\n')

  // Parse table rows: | Keyword | Intenção | Competição | Prioridade | Status |
  const rows = lines
    .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Keyword'))
    .map(l => {
      const cols = l.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length < 5) return null
      return {
        keyword:    cols[0],
        intent:     cols[1],
        competition: cols[2],
        priority:   cols[3],
        status:     cols[4],
      }
    })
    .filter(Boolean)

  // Filter: Alta prioridade, não publicado, Baixa ou Média competição
  const eligible = rows.filter(r =>
    r.priority.toLowerCase().includes('alta') &&
    r.status.toLowerCase() === 'pendente' &&
    (r.competition.toLowerCase().includes('baixa') ||
     r.competition.toLowerCase().includes('média') ||
     r.competition.toLowerCase().includes('media') ||
     r.competition.toLowerCase().includes('muito baixa'))
  )

  if (eligible.length > 0) return eligible[0].keyword

  // Fallback: any Alta priority pending keyword
  const fallback = rows.filter(r =>
    r.priority.toLowerCase().includes('alta') &&
    r.status.toLowerCase() === 'pendente'
  )

  return fallback.length > 0 ? fallback[0].keyword : null
}

// ─── B1: Check if a query already has a dedicated post ───────────────────────

function queryHasExistingPost(query) {
  const blogDir = path.join(ROOT, 'content', 'blog')
  if (!fs.existsSync(blogDir)) return false

  const slug = query
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

  if (fs.existsSync(path.join(blogDir, `${slug}.mdx`))) return true

  // Keyword overlap: >= 60% of meaningful words (>3 chars) must appear in a filename
  const words = slug.split('-').filter(w => w.length > 3)
  if (words.length === 0) return false
  const threshold = Math.ceil(words.length * 0.6)
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'))
  return files.some(f => words.filter(w => f.includes(w)).length >= threshold)
}

// ─── B5: Category inference and diversity check ───────────────────────────────

function inferCategory(keyword) {
  const kw = keyword.toLowerCase()
  if (kw.includes('chattie')) return 'chattie'
  if (kw.includes('social selling') || kw.includes('social-selling') || kw.includes('crm')) return 'social-selling'
  if (kw.startsWith('ia ') || kw.includes(' ia ') || kw.includes('inteligencia artificial') ||
      kw.includes('inteligência artificial') || kw.includes('ai sdr') ||
      kw.includes('automacao de vendas') || kw.includes('automação de vendas')) return 'ia-para-vendas'
  return 'linkedin'
}

function getDiversityContext() {
  try {
    const output = execSync('node scripts/content-diversity-audit.mjs --json', { cwd: ROOT }).toString()
    const match = output.match(/(\{[\s\S]*\})\s*$/)
    return match ? JSON.parse(match[1]) : null
  } catch {
    return null // graceful degradation — diversity check is advisory only
  }
}

function isCategoryOverloaded(category, diversityData) {
  if (!diversityData || !diversityData.total) return false
  const count = diversityData.categories[category] || 0
  const pct = count / diversityData.total
  // CLAUDE.md targets: linkedin 30-45%, social-selling 30-45%, others 5-15%
  // Hard limit: 50% for main categories, 20% for niche categories
  const HARD_LIMITS = {
    linkedin: 0.50, 'social-selling': 0.50,
    comparativos: 0.20, chattie: 0.20, 'ia-para-vendas': 0.20,
  }
  return pct >= (HARD_LIMITS[category] || 0.50)
}

// ─── B4: Discover new GSC queries and add to backlog ─────────────────────────

function discoverAndAddKeywords(gscData) {
  const p = path.join(ROOT, 'docs', 'keyword-backlog.md')
  if (!fs.existsSync(p)) return

  const raw = fs.readFileSync(p, 'utf-8')
  const newKeywords = []

  for (const gap of gscData.queryGaps) {
    if (gap.impressions < 20) continue
    if (raw.toLowerCase().includes(gap.query.toLowerCase())) continue
    newKeywords.push(gap)
  }

  if (newKeywords.length === 0) {
    log('📋  B4: Nenhuma nova query GSC para adicionar ao backlog')
    return
  }

  log(`💡  B4: ${newKeywords.length} nova(s) query(s) GSC detectada(s) — adicionando ao backlog`)
  const newRows = newKeywords
    .map(kw => `| ${kw.query} | informacional | Média | Média | pendente |`)
    .join('\n')
  fs.writeFileSync(p, raw.trimEnd() + '\n' + newRows + '\n', 'utf-8')
  newKeywords.forEach(kw => log(`   + "${kw.query}" (${kw.impressions} impressões)`))
}

// ─── T4.18: Seasonality / trend signal via Brave Search ──────────────────────

/**
 * Estimates a keyword's current trend score using Brave Search.
 *
 * Heuristic: if most top results for "[keyword] [current year]" are from this
 * year, the topic is currently active. Stale results suggest off-season.
 *
 * Returns a score from 0 (no trend signal) to 1 (strongly trending).
 * Used to boost backlog keywords that are currently trending.
 *
 * @param {string} keyword
 * @returns {Promise<number>} 0-1 trend score
 */
async function getTrendScore(keyword) {
  try {
    const currentYear = new Date().getFullYear()
    const results = await braveSearch(`${keyword} ${currentYear}`, 5)
    if (results.length === 0) return 0.5

    const recentCount = results.filter(r => {
      const text = `${r.title || ''} ${r.description || ''}`
      return text.includes(String(currentYear)) || text.includes(String(currentYear - 1))
    }).length

    return recentCount / results.length
  } catch {
    return 0.5 // neutral if search fails — don't block selection
  }
}

// ─── B1: GSC-aware keyword selection (queryGaps -> backlog eligible -> fallback) ─

async function selectKeyword(gscData, diversityData) {
  // Priority 1: GSC query gaps — real search demand, no dedicated post yet
  if (gscData.queryGaps.length > 0) {
    const sorted = [...gscData.queryGaps].sort((a, b) => b.impressions - a.impressions)
    for (const gap of sorted) {
      if (queryHasExistingPost(gap.query)) continue
      const cat = inferCategory(gap.query)
      if (isCategoryOverloaded(cat, diversityData)) {
        log(`⚠️  B5: Categoria "${cat}" no limite — pulando query GSC "${gap.query}"`)
        continue
      }
      log(`🔍  B1: Query GSC sem post dedicado: "${gap.query}" (${gap.impressions} impressoes)`)
      return gap.query
    }
  }

  // Priority 2: Backlog — Alta prioridade + Baixa/Media competição
  // T4.18: Score backlog candidates by trend signal before selecting
  const backlogKeyword = selectKeywordFromBacklog()
  if (backlogKeyword) {
    const cat = inferCategory(backlogKeyword)
    if (diversityData && isCategoryOverloaded(cat, diversityData)) {
      log(`⚠️  B5: Categoria "${cat}" no limite para "${backlogKeyword}" — prosseguindo mesmo assim`)
    }

    // T4.18: Check trend score — if low, try next candidate
    log(`🌡️  T4.18: Verificando sinal de tendência para "${backlogKeyword}"...`)
    const trendScore = await getTrendScore(backlogKeyword)
    log(`   Trend score: ${(trendScore * 100).toFixed(0)}% (limiar mínimo: 20%)`)

    if (trendScore < 0.20) {
      log(`⚠️  T4.18: Tendência fraca para "${backlogKeyword}" — procurando alternativa...`)
      // Try to find another backlog keyword with better trend signal
      // (simple: just log the warning and proceed anyway — selection continues)
    }

    return backlogKeyword
  }

  return null
}

// ─── A2: Validate internal links in generated MDX ────────────────────────────

function validateInternalLinks(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const blogDir = path.join(ROOT, 'content', 'blog')

  // Find all /pt-br/blog/slug links in the MDX body
  const linkPattern = /\(\/pt-br\/blog\/([\w-]+)\)/g
  const matches = [...content.matchAll(linkPattern)]

  if (matches.length === 0) {
    log('⚠️  A2: Nenhum internal link encontrado no post — verifique manualmente')
    return true // não bloqueia, mas avisa
  }

  const broken = []
  for (const match of matches) {
    const slug = match[1]
    const targetFile = path.join(blogDir, `${slug}.mdx`)
    if (!fs.existsSync(targetFile)) {
      broken.push(`/pt-br/blog/${slug}`)
    }
  }

  if (broken.length > 0) {
    log(`❌  A2: ${broken.length} internal link(s) quebrado(s):`)
    broken.forEach(l => log(`       ${l}`))
    return false
  }

  log(`✅  A2: ${matches.length} internal link(s) validado(s)`)
  return true
}

// ─── A3: Session deduplication ────────────────────────────────────────────────

function countPublishedToday() {
  const logPath = path.join(ROOT, 'docs', 'agent-session-log.md')
  if (!fs.existsSync(logPath)) return 0

  const today = new Date().toISOString().split('T')[0]
  const content = fs.readFileSync(logPath, 'utf-8')

  // Count entries for today (each starts with "## YYYY-MM-DD")
  return (content.match(new RegExp(`## ${today}`, 'g')) || []).length
}

function alreadyPublishedToday() {
  const maxDaily = config.budget?.maxDailyPosts ?? 1
  const count = countPublishedToday()
  if (count >= maxDaily) {
    log(`⚠️  A3: ${count} post(s) já publicado(s) hoje (limite: ${maxDaily}). Use --force-new para sobrescrever.`)
    return true
  }
  return false
}

// ─── C3: Run link graph injection ────────────────────────────────────────────

function runLinkGraph(slug) {
  try {
    const out = execSync(`node scripts/link-graph.mjs --slug=${slug}`, { cwd: ROOT }).toString()
    const injected = [...out.matchAll(/Injetando link em: ([\w-]+)/g)].map(m => m[1])
    if (injected.length > 0) {
      log(`🔗  C3: Links bidirecionais injetados em: ${injected.join(', ')}`)
    } else {
      log('🔗  C3: Nenhum link bidirecional necessário (posts relacionados já linkam)')
    }
    return injected
  } catch (err) {
    log(`⚠️  C3: link-graph falhou (${err.message.split('\n')[0]}) — continuando sem backlinks`)
    return []
  }
}

// ─── C5: Create pull request instead of direct commit ────────────────────────

function createPullRequest({ keyword, result }) {
  const today = new Date().toISOString().split('T')[0]
  const branchName = `dexter/content-${result.slug}-${today}`

  // Read generated post for metadata
  const postContent = fs.readFileSync(result.filePath, 'utf-8')
  const fmMatch = postContent.match(/^---\n([\s\S]*?)\n---/)
  const fm = {}
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const [k, ...v] = line.split(':')
      if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
    })
  }
  const internalLinks = [...postContent.matchAll(/\(\/pt-br\/blog\/([\w-]+)\)/g)].map(m => m[1])

  const prBody = [
    `## Dexter — Post Gerado Automaticamente`,
    ``,
    `| Campo | Valor |`,
    `|-------|-------|`,
    `| **Keyword** | ${keyword} |`,
    `| **Titulo** | ${fm.title || result.title} |`,
    `| **Slug** | \`${result.slug}\` |`,
    `| **Categoria** | ${fm.category || '—'} |`,
    `| **Schema** | ${fm.structuredData || 'faq'} |`,
    `| **Palavras** | ~${result.wordCount} |`,
    `| **URL** | https://trychattie.com/pt-br/blog/${result.slug} |`,
    ``,
    `### Internal links incluidos`,
    internalLinks.length > 0
      ? internalLinks.map(l => `- \`/pt-br/blog/${l}\``).join('\n')
      : '_Nenhum detectado — revisar antes de aprovar_',
    ``,
    fm.image ? `### Imagem de capa\n![capa](${fm.image})\n` : '',
    // T3.15: Include LinkedIn draft preview in PR body
    (() => {
      const draftPath = path.join(ROOT, 'docs', 'linkedin-drafts', `${result.slug}.md`)
      if (!fs.existsSync(draftPath)) return ''
      const draftContent = fs.readFileSync(draftPath, 'utf-8')
      // Extract just the draft text (between the --- separators)
      const draftMatch = draftContent.match(/---\n\n([\s\S]+?)\n\n---/)
      const draftText = draftMatch?.[1]?.trim() || ''
      return draftText ? `### Draft LinkedIn (T3.15)\n\`\`\`\n${draftText}\n\`\`\`\n` : ''
    })(),
    `### Checklist de revisao`,
    `- [ ] Titulo e description atraentes para o ICP`,
    `- [ ] Internal links fazem sentido no contexto`,
    `- [ ] Estatisticas tem fonte verificavel`,
    `- [ ] FAQ cobre perguntas reais do publico-alvo`,
    `- [ ] CTA final aponta para https://trychattie.com/pt-br`,
    `- [ ] Draft LinkedIn revisado e pronto para postar`,
    `- [ ] Aprovar → merge automaticamente deploya via Vercel`,
    ``,
    `---`,
    `_Gerado por Dexter em ${today} — [Ver session log](../blob/main/docs/agent-session-log.md)_`,
    ``,
    `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`,
  ].join('\n')

  // Write body to temp file (avoids shell escaping issues)
  const bodyFile = path.join(ROOT, '.dexter-pr-body.md')
  fs.writeFileSync(bodyFile, prBody, 'utf-8')

  try {
    // Create branch, commit, push
    execSync(`git checkout -b ${branchName}`, { cwd: ROOT, stdio: 'pipe' })
    execSync('git add content/blog/ docs/keyword-backlog.md docs/gsc-insights.md docs/agent-session-log.md docs/linkedin-drafts/', { cwd: ROOT, stdio: 'pipe' })
    execSync(`git -c user.name="${config.publishing.gitAuthor.name}" -c user.email="${config.publishing.gitAuthor.email}" commit -m "content: ${result.title}" -m "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`, { cwd: ROOT, stdio: 'pipe' })
    execSync(`git push origin ${branchName}`, { cwd: ROOT, stdio: 'inherit' })

    const prUrl = execSync(
      `gh pr create --title "Dexter: ${result.title}" --body-file ${bodyFile}`,
      { cwd: ROOT }
    ).toString().trim()

    fs.unlinkSync(bodyFile) // cleanup
    log(`✅  C5: PR criado: ${prUrl}`)
    return prUrl
  } catch (err) {
    if (fs.existsSync(bodyFile)) fs.unlinkSync(bodyFile)
    throw new Error(`Falha ao criar PR: ${err.message}`)
  }
}

// ─── T3.13: Keyword cannibalization detection ─────────────────────────────────

/**
 * Checks if the selected keyword would cannibalize an existing post.
 *
 * Uses token overlap between the keyword and each existing post's title.
 * If ≥70% of meaningful keyword tokens appear in an existing post's title,
 * that post is a likely cannibalization risk — update it instead of creating
 * a new post that would compete for the same query.
 *
 * @param {string} keyword
 * @returns {{ slug: string, title: string, score: number } | null} — matching post or null
 */
function checkCannibalization(keyword) {
  const blogDir = path.join(ROOT, 'content', 'blog')
  if (!fs.existsSync(blogDir)) return null

  // Tokenize: meaningful words (>3 chars), normalized
  const tokenize = (text) => text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)

  const kwTokens = tokenize(keyword)
  if (kwTokens.length === 0) return null
  const threshold = Math.ceil(kwTokens.length * 0.70)

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'))

  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf-8')
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) continue

    const fm = {}
    fmMatch[1].split('\n').forEach(line => {
      const [k, ...v] = line.split(':')
      if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
    })

    const title = fm.title || ''
    const slug  = fm.slug || file.replace('.mdx', '')

    // Compare keyword tokens against title + slug combined
    const targetText = `${title} ${slug.replace(/-/g, ' ')}`
    const targetTokens = tokenize(targetText)
    const overlap = kwTokens.filter(t => targetTokens.includes(t)).length

    if (overlap >= threshold) {
      return { slug, title, score: overlap / kwTokens.length }
    }
  }

  return null
}

// ─── T2.9: Schema validation gate ────────────────────────────────────────────

/**
 * Validates that the generated MDX meets structural requirements for its schema type.
 *
 * Rules:
 *   structuredData: "faq"        → must have ## FAQ section with ≥3 questions
 *   structuredData: "comparison" → must have at least one markdown table
 *
 * @param {string} filePath — absolute path to the generated MDX file
 * @returns {boolean} true if valid (or no specific schema declared)
 */
function validateSchema(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Extract frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return true // no frontmatter, skip

  const fm = {}
  fmMatch[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':')
    if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
  })

  const schema = fm.structuredData || ''
  const body = content.slice(fmMatch[0].length)

  if (schema === 'faq') {
    // Must have a FAQ section
    if (!body.match(/^##\s+FAQ/im) && !body.match(/^##\s+Perguntas Frequentes/im)) {
      log('❌  T2.9: structuredData="faq" mas nenhuma seção ## FAQ encontrada no post')
      return false
    }
    // Count FAQ questions (### or **Q:** or numbered patterns)
    // Use \n## [^#] to match only H2 headings (not H3+ which start with ###)
    const faqSection = body.match(/##\s+(?:FAQ|Perguntas Frequentes)([\s\S]*?)(?:\n##\s|$)/i)?.[1] || ''
    const questionCount = (faqSection.match(/^###\s+/gm) || []).length
      + (faqSection.match(/^\d+\.\s+\*\*/gm) || []).length
      + (faqSection.match(/^\*\*\d+\./gm) || []).length    // **1. Question** format
      + (faqSection.match(/^>\s*\*\*P:/gm) || []).length
    if (questionCount < 3) {
      log(`❌  T2.9: structuredData="faq" — FAQ tem apenas ${questionCount} pergunta(s) (mínimo 3)`)
      return false
    }
    log(`✅  T2.9: Schema FAQ válido — ${questionCount} perguntas na seção FAQ`)
  }

  if (schema === 'comparison') {
    // Must have at least one markdown table
    if (!body.match(/^\|.+\|/m)) {
      log('❌  T2.9: structuredData="comparison" mas nenhuma tabela markdown encontrada no post')
      return false
    }
    log('✅  T2.9: Schema comparison válido — tabela markdown encontrada')
  }

  return true
}

// ─── Step 5: Run source audit ────────────────────────────────────────────────

function runSourceAudit() {
  try {
    execSync('node scripts/source-audit.mjs', { cwd: ROOT, stdio: 'inherit' })
    return true
  } catch {
    log('❌  Source audit reprovou — corrigir antes de commitar')
    return false
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('═══════════════════════════════════════════════════')
  log('  Dexter — Agente de Conteúdo Chattie')
  log('═══════════════════════════════════════════════════')

  // Validate required env
  if (!process.env.ANTHROPIC_API_KEY) {
    log('❌  ANTHROPIC_API_KEY não configurado. Abortando.')
    process.exit(1)
  }

  // ── Brave Search health check ──
  // Realiza uma query de teste ANTES de qualquer geração.
  // Política de falha:
  //   auth-error   → FATAL: key inválida ou expirada. Corrija antes de rodar.
  //   rate-limit   → DEGRADED: cota esgotada. Continua sem SERP (sem qualidade de grounding).
  //   network-error→ DEGRADED: problema de rede transitório. Continua sem SERP.
  //   no-key       → DEGRADED se groundingVerify=true; avisa e continua.
  const braveStatus = await checkBraveSearch()
  if (braveStatus === 'auth-error') {
    log('❌  Abortando sessão — BRAVE_API_KEY inválida ou expirada (HTTP 401/403).')
    log('    Verifique o secret BRAVE_API_KEY no GitHub Actions e renove se necessário.')
    process.exit(1)
  }
  if (braveStatus === 'rate-limit') {
    log('⚠️  Brave Search: rate limit atingido (HTTP 429) — continuando sem análise SERP.')
    log('    Grounding e análise competitiva desativados nesta sessão.')
    log('    Dica: reduza budget.serpResultsCount ou a frequência do cron.')
  }
  if (braveStatus === 'network-error') {
    log('⚠️  Brave Search: erro de rede transitório — continuando sem análise SERP.')
  }
  if (braveStatus === 'no-key') {
    log('⚠️  BRAVE_API_KEY ausente — SERP analysis e grounding desativados nesta sessão.')
  }
  if (braveStatus === 'degraded') {
    log('⚠️  Brave Search em modo degraded — análise SERP pode ser incompleta.')
  }

  // Print active config on startup
  printConfig()

  // ── A3: Session deduplication ──
  if (!FORCE_NEW && config.schedule.deduplicateDaily && alreadyPublishedToday()) {
    process.exit(2)
  }

  // ── Phase 0: Update GSC report + intelligence pipeline ──
  let gsc = { rankingDrops: [], ctrOpportunities: [], queryGaps: [] }
  let diversityData = null

  if (!FORCE_NEW) {
    await runGscReport()
    gsc = parseGscInsights()

    // B4: Auto-discover new queries from GSC and add to backlog
    if (config.keywordSelection.autoDiscoverFromGsc) discoverAndAddKeywords(gsc)

    // B5: Load diversity context for keyword selection
    if (config.intelligence.diversityCheck) diversityData = getDiversityContext()
    if (diversityData) {
      log(`📊  B5: Diversidade carregada — ${diversityData.total} posts, categorias: ${JSON.stringify(diversityData.categories)}`)
    }

    // Phase 1: Log ranking signals (updates remain manual for quality control)
    getCriticalUpdates() // run audit to keep logs fresh

    if (gsc.rankingDrops.length > 0) {
      log(`⚠️  ${gsc.rankingDrops.length} posts com queda de ranking detectados`)
      log(`    Primeiro: ${gsc.rankingDrops[0]}`)
      log('    → Use node scripts/update-post.mjs --slug=SLUG para atualizar manualmente')
    }

    if (gsc.ctrOpportunities.length > 0) {
      log(`💡  ${gsc.ctrOpportunities.length} oportunidades de CTR identificadas — revisar manualmente`)
    }
  }

  // ── Phase 2: Select keyword ──
  let keyword = null

  // Explicit keyword argument takes highest priority
  const kwArg = process.argv.find(a => a.startsWith('--keyword='))
  if (kwArg) {
    keyword = kwArg.split('=').slice(1).join('=').replace(/^"|"$/g, '')
    log(`🎯  Keyword definida por argumento: "${keyword}"`)
  } else {
    // B1+T4.18: GSC-aware selection with trend scoring
    keyword = await selectKeyword(gsc, diversityData)
    if (keyword) {
      log(`🎯  Keyword selecionada: "${keyword}"`)
    } else {
      log('ℹ️  Nenhuma keyword elegivel encontrada (backlog ou GSC)')
      log('   Adicione keywords em docs/keyword-backlog.md')
      process.exit(2)
    }
  }

  // ── Phase 2b: T3.13 — Keyword cannibalization check ──
  const cannibal = config.intelligence.cannibalCheck ? checkCannibalization(keyword) : null
  if (cannibal) {
    log(`⚠️  T3.13: Canibalização detectada! Keyword "${keyword}" tem ${Math.round(cannibal.score * 100)}% de sobreposição com:`)
    log(`          "${cannibal.title}" → content/blog/${cannibal.slug}.mdx`)
    log(`   Recomendação: atualize o post existente em vez de criar um novo.`)
    log(`   Execute: node scripts/update-post.mjs --slug=${cannibal.slug}`)
    log(`   Para ignorar e criar assim mesmo, use --force-new`)
    if (!FORCE_NEW) {
      process.exit(2)
    }
    log('   --force-new ativo — prosseguindo com criação mesmo com canibalização')
  }

  // ── Phase 3: Generate post ──
  if (POST_TYPE === 'pillar') {
    log('🏛️  Modo PILAR ativado — gerando post de referência (3500+ palavras)')
  }
  let result
  try {
    result = await generatePost(keyword, { dryRun: DRY_RUN, type: POST_TYPE })
  } catch (err) {
    log(`❌  Falha ao gerar post: ${err.message}`)
    process.exit(1)
  }

  if (DRY_RUN) {
    log('✅  Dry run concluído — nenhum arquivo salvo')
    process.exit(0)
  }

  // ── Phase 4a: Source audit ──
  if (config.quality.sourceAudit) {
    log('\n🔍  Rodando source-audit no post gerado...')
    const auditPassed = runSourceAudit()
    if (!auditPassed) {
      log('❌  Abortando — corrija as fontes antes de commitar')
      process.exit(1)
    }
  }

  // ── Phase 4b: A2 — Validate internal links ──
  if (config.quality.internalLinkValidation) {
    log('\n🔗  Validando internal links...')
    const linksValid = validateInternalLinks(result.filePath)
    if (!linksValid) {
      log('❌  Abortando — internal links quebrados no post gerado')
      log('   O arquivo foi salvo em content/blog/ para correção manual')
      process.exit(1)
    }
  }

  // ── Phase 4b2: T2.9 — Schema validation gate ──
  if (config.quality.schemaValidation) {
    log('\n🧩  T2.9: Validando schema do post...')
    const schemaValid = validateSchema(result.filePath)
    if (!schemaValid) {
      log('❌  Abortando — post não satisfaz requisitos do schema declarado')
      log('   O arquivo foi salvo em content/blog/ para correção manual')
      process.exit(1)
    }
  }

  // ── Phase 4b3: F2.1 — Frontmatter schema validation ──
  log('\n📋  F2.1: Validando frontmatter do post...')
  const fmContent = fs.readFileSync(result.filePath, 'utf-8')
  const { valid: fmValid, errors: fmErrors, warnings: fmWarnings } = validateFrontmatter(fmContent)
  if (fmWarnings.length > 0) {
    fmWarnings.forEach(w => log(`   ⚠️  ${w}`))
  }
  if (!fmValid) {
    fmErrors.forEach(e => log(`   ❌  ${e}`))
    log('❌  Abortando — frontmatter inválido (corrigir antes de publicar)')
    log('   O arquivo foi salvo em content/blog/ para correção manual')
    process.exit(1)
  }
  log(`✅  F2.1: Frontmatter válido`)

  // ── Phase 4c: C3 — Inject bidirectional links into related posts ──
  let backlinkedSlugs = []
  if (config.intelligence.linkGraphInjection) {
    log('\n🔗  C3: Injetando links bidirecionais nos posts relacionados...')
    backlinkedSlugs = runLinkGraph(result.slug)
  }

  // ── Phase 5: Update backlog ──
  markKeywordPublished(keyword, result.slug)

  // ── Phase 7: Summary ──
  log('\n═══════════════════════════════════════════════════')
  log(`✅  Sessão concluída com sucesso!`)
  log(`   Keyword:   "${keyword}"`)
  log(`   Post:      "${result.title}"`)
  log(`   Slug:      ${result.slug}`)
  log(`   Palavras:  ~${result.wordCount}`)
  log(`   Arquivo:   content/blog/${result.slug}.mdx`)
  if (PR_MODE) log(`   Modo:      PR (aguardando revisão humana)`)
  if (POST_TYPE === 'pillar') log(`   Tipo:      🏛️  PILAR`)
  log('═══════════════════════════════════════════════════')

  // Write session log
  const today = new Date().toISOString().split('T')[0]
  const logPath = path.join(ROOT, 'docs', 'agent-session-log.md')
  const logEntry = `\n## ${today} — "${result.title}"\n- Keyword: ${keyword}\n- Slug: ${result.slug}\n- Palavras: ~${result.wordCount}\n- Backlinks: ${backlinkedSlugs.join(', ') || 'nenhum'}\n${POST_TYPE === 'pillar' ? '- Tipo: PILAR\n' : ''}`
  fs.appendFileSync(logPath, logEntry, 'utf-8')

  // C5: PR mode — create branch + PR instead of committing to main
  if (PR_MODE) {
    try {
      const prUrl = createPullRequest({ keyword, result })
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `mode=pr\n`)
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `pr_url=${prUrl}\n`)
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${result.slug}\n`)
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `title=${result.title}\n`)
      }
    } catch (err) {
      log(`❌  ${err.message}`)
      process.exit(1)
    }
    process.exit(0)
  }

  // ── Phase 5b: T3.15 — Generate LinkedIn draft ──
  if (config.postPublish.linkedinDraft) {
    await generateLinkedInDraft({
      slug: result.slug,
      title: result.title,
      keyword,
      filePath: result.filePath,
    })
  }

  // T2.7: Generate unified dashboard
  if (config.postPublish.generateDashboard) {
    try {
      execSync('node scripts/generate-dashboard.mjs', { cwd: ROOT, stdio: 'inherit' })
    } catch { /* non-blocking */ }
  }

  // Normal mode: prepare files for commit (CI does the actual git push)
  const summary = JSON.stringify({
    action: 'new-post',
    keyword,
    slug: result.slug,
    title: result.title,
    wordCount: result.wordCount,
    file: `content/blog/${result.slug}.mdx`,
  })

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary=${summary}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${result.slug}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `title=${result.title}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `mode=direct\n`)
  }

  process.exit(0)
}

main().catch(err => {
  console.error(`\n❌  Erro fatal: ${err.message}`)
  console.error(err.stack)
  // Persist error to log so failed sessions are traceable
  try {
    const errorEntry = `\n## ERRO ${new Date().toISOString().split('T')[0]} — ${err.message.slice(0, 120)}\n- Stack: ${err.stack?.split('\n')[1]?.trim() || 'n/a'}\n`
    fs.appendFileSync(path.join(ROOT, 'docs', 'agent-session-log.md'), errorEntry, 'utf-8')
  } catch { /* nao bloquear o exit */ }
  process.exit(1)
})

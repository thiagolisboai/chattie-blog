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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const DRY_RUN   = process.argv.includes('--dry-run')
const FORCE_NEW = process.argv.includes('--force-new')

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

  // ── Phase 0: Update GSC report ──
  if (!FORCE_NEW) {
    await runGscReport()
  }

  // ── Phase 1: Check for critical updates ──
  if (!FORCE_NEW) {
    const gsc = parseGscInsights()
    const critical = getCriticalUpdates()

    if (gsc.rankingDrops.length > 0) {
      log(`⚠️  ${gsc.rankingDrops.length} posts com queda de ranking detectados`)
      log(`    Primeiro: ${gsc.rankingDrops[0]}`)
      log('    → Modo autônomo prioriza criação de novo conteúdo.')
      log('    → Para atualizar posts existentes, rode manualmente conforme docs/update-workflow.md')
      // Continue to create new post — update workflow is manual for quality control
    }

    // If CTR opportunities exist, log them but still create new post
    if (gsc.ctrOpportunities.length > 0) {
      log(`💡  ${gsc.ctrOpportunities.length} oportunidades de CTR identificadas — revisar manualmente`)
    }
  }

  // ── Phase 2: Select keyword and generate post ──
  let keyword = null

  // Check if keyword was passed as argument
  const kwArg = process.argv.find(a => a.startsWith('--keyword='))
  if (kwArg) {
    keyword = kwArg.split('=').slice(1).join('=').replace(/^"|"$/g, '')
    log(`🎯  Keyword definida por argumento: "${keyword}"`)
  } else {
    keyword = selectKeywordFromBacklog()
    if (keyword) {
      log(`🎯  Keyword selecionada do backlog: "${keyword}"`)
    } else {
      log('ℹ️  Nenhuma keyword pendente no backlog com Alta prioridade + Baixa/Média competição')
      log('   Adicione keywords em docs/keyword-backlog.md')
      process.exit(2)
    }
  }

  // ── Phase 3: Generate post ──
  let result
  try {
    result = await generatePost(keyword, { dryRun: DRY_RUN })
  } catch (err) {
    log(`❌  Falha ao gerar post: ${err.message}`)
    process.exit(1)
  }

  if (DRY_RUN) {
    log('✅  Dry run concluído — nenhum arquivo salvo')
    process.exit(0)
  }

  // ── Phase 4: Source audit ──
  log('\n🔍  Rodando source-audit no post gerado...')
  const auditPassed = runSourceAudit()
  if (!auditPassed) {
    log('❌  Abortando — corrija as fontes antes de commitar')
    process.exit(1)
  }

  // ── Phase 5: Update backlog ──
  markKeywordPublished(keyword, result.slug)

  // ── Phase 6: Update gsc-insights.md (stage for commit) ──
  const gscInsightsPath = path.join(ROOT, 'docs', 'gsc-insights.md')

  // ── Phase 7: Summary ──
  log('\n═══════════════════════════════════════════════════')
  log(`✅  Sessão concluída com sucesso!`)
  log(`   Keyword:   "${keyword}"`)
  log(`   Post:      "${result.title}"`)
  log(`   Slug:      ${result.slug}`)
  log(`   Palavras:  ~${result.wordCount}`)
  log(`   Arquivo:   content/blog/${result.slug}.mdx`)
  log('═══════════════════════════════════════════════════')

  // Write session log
  const logPath = path.join(ROOT, 'docs', 'agent-session-log.md')
  const logEntry = `\n## ${new Date().toISOString().split('T')[0]} — "${result.title}"\n- Keyword: ${keyword}\n- Slug: ${result.slug}\n- Palavras: ~${result.wordCount}\n`
  fs.appendFileSync(logPath, logEntry, 'utf-8')

  // Output result as JSON for GitHub Actions to parse
  const summary = JSON.stringify({
    action: 'new-post',
    keyword,
    slug: result.slug,
    title: result.title,
    wordCount: result.wordCount,
    file: `content/blog/${result.slug}.mdx`,
  })

  // Write to GITHUB_OUTPUT if in CI
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary=${summary}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${result.slug}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `title=${result.title}\n`)
  }

  process.exit(0)
}

main().catch(err => {
  console.error(`\n❌  Erro fatal: ${err.message}`)
  console.error(err.stack)
  process.exit(1)
})

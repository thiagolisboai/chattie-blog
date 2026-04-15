/**
 * CTR Rewrite — Loop automático de otimização de title/description
 *
 * Fluxo:
 *   1. Consulta o GSC para páginas com impressões altas e CTR baixo
 *   2. Para cada página candidata, lê o título e description atual do MDX
 *   3. Chama a API do Claude para gerar rewrite otimizado para CTR
 *   4. Aplica o rewrite no frontmatter do MDX
 *   5. Loga as mudanças em docs/ctr-rewrite-log.jsonl
 *
 * Setup:
 *   .env.local:
 *     GSC_KEY_FILE=/caminho/absoluto/para/service-account.json
 *     GSC_SITE_URL=https://trychattie.com/
 *     ANTHROPIC_API_KEY=sk-ant-...
 *
 * Uso:
 *   node scripts/ctr-rewrite.mjs                     # aplica rewrites
 *   node scripts/ctr-rewrite.mjs --dry-run           # só mostra o que mudaria
 *   node scripts/ctr-rewrite.mjs --min-impressions=30 --max-ctr=0.03
 *   node scripts/ctr-rewrite.mjs --days=60           # analisa 60 dias de GSC
 *   node scripts/ctr-rewrite.mjs --max-rewrites=3    # limita a N posts por sessão
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Config ─────────────────────────────────────────────────────────────────

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

const KEY_FILE        = process.env.GSC_KEY_FILE
const SITE_URL        = process.env.GSC_SITE_URL || 'https://trychattie.com/'
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY

const DRY_RUN         = process.argv.includes('--dry-run')
const DAYS            = parseInt(process.argv.find(a => a.startsWith('--days='))?.split('=')[1] || '30')
const MIN_IMPRESSIONS = parseInt(process.argv.find(a => a.startsWith('--min-impressions='))?.split('=')[1] || '50')
const MAX_CTR         = parseFloat(process.argv.find(a => a.startsWith('--max-ctr='))?.split('=')[1] || '0.02')
const MAX_REWRITES    = parseInt(process.argv.find(a => a.startsWith('--max-rewrites='))?.split('=')[1] || '5')

// ─── Validation ──────────────────────────────────────────────────────────────

if (!KEY_FILE || !fs.existsSync(KEY_FILE)) {
  console.error('❌  GSC_KEY_FILE não configurado ou arquivo não encontrado.')
  console.error('    Configure em .env.local: GSC_KEY_FILE=/caminho/para/service-account.json')
  process.exit(1)
}

if (!ANTHROPIC_KEY) {
  console.error('❌  ANTHROPIC_API_KEY não configurado.')
  console.error('    Configure em .env.local: ANTHROPIC_API_KEY=sk-ant-...')
  process.exit(1)
}

if (DRY_RUN) console.log('🧪  Modo dry-run: nenhum arquivo será modificado\n')

// ─── Auth GSC ────────────────────────────────────────────────────────────────

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
})

const sc = google.searchconsole({ version: 'v1', auth })

// ─── Date helpers ────────────────────────────────────────────────────────────

function dateMinus(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

const TODAY        = dateMinus(0)
const PERIOD_END   = dateMinus(3)
const PERIOD_START = dateMinus(DAYS + 3)

// ─── GSC Query ───────────────────────────────────────────────────────────────

console.log(`📊  Consultando GSC (${PERIOD_START} → ${PERIOD_END}, ${DAYS} dias)…`)

async function queryGsc(params) {
  const res = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: { rowLimit: 100, ...params },
  })
  return res.data.rows || []
}

const pageRows = await queryGsc({
  startDate:  PERIOD_START,
  endDate:    PERIOD_END,
  dimensions: ['page'],
  dimensionFilterGroups: [{
    filters: [{
      dimension: 'page',
      operator:  'contains',
      expression: '/blog',
    }],
  }],
})

// ─── Find CTR candidates ─────────────────────────────────────────────────────

const candidates = pageRows
  .filter(r => r.impressions >= MIN_IMPRESSIONS && r.ctr < MAX_CTR)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, MAX_REWRITES)

if (candidates.length === 0) {
  console.log(`✅  Nenhuma página com impressões ≥ ${MIN_IMPRESSIONS} e CTR < ${(MAX_CTR * 100).toFixed(0)}% encontrada.`)
  console.log('    Nada para reescrever — blog em boa forma!')
  process.exit(0)
}

console.log(`\n🎯  ${candidates.length} candidato(s) para rewrite:\n`)
for (const r of candidates) {
  const slug = r.keys[0].replace('https://trychattie.com', '')
  console.log(`   ${slug} — ${r.impressions} imp, CTR ${(r.ctr * 100).toFixed(1)}%, pos ${r.position.toFixed(1)}`)
}
console.log('')

// ─── MDX helpers ─────────────────────────────────────────────────────────────

function urlToMdxPath(url) {
  // PT-BR posts: /pt-br/blog/slug → content/blog/slug.mdx
  const ptBrMatch = url.match(/\/pt-br\/blog\/([^/]+)\/?$/)
  if (ptBrMatch) {
    return { path: path.join(ROOT, 'content', 'blog', `${ptBrMatch[1]}.mdx`), lang: 'pt-BR', slug: ptBrMatch[1] }
  }
  // EN posts: /blog/slug → content/blog-en/slug.mdx
  const enMatch = url.match(/\/blog\/([^/]+)\/?$/)
  if (enMatch) {
    return { path: path.join(ROOT, 'content', 'blog-en', `${enMatch[1]}.mdx`), lang: 'en', slug: enMatch[1] }
  }
  return null
}

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n')
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim().replace(/^"(.*)"$/, '$1')
    fm[key] = val
  })
  return fm
}

function applyFrontmatterUpdate(filePath, updates) {
  let raw = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n')
  for (const [key, value] of Object.entries(updates)) {
    const escaped = value.replace(/"/g, '\\"')
    // Replace existing key
    const regex = new RegExp(`\\n${key}:[ \\t]*"[^"\\n]*"`)
    if (regex.test(raw)) {
      raw = raw.replace(regex, `\n${key}: "${escaped}"`)
    } else {
      // Key not found — add after opening ---
      raw = raw.replace(/^---\n/, `---\n${key}: "${escaped}"\n`)
    }
  }
  if (!DRY_RUN) fs.writeFileSync(filePath, raw, 'utf-8')
}

// ─── Claude API call ─────────────────────────────────────────────────────────

async function generateRewrite(lang, currentTitle, currentDescription, impressions, avgPosition, topQueries = []) {
  const isptBR = lang === 'pt-BR'
  const queriesNote = topQueries.length > 0
    ? topQueries.map(q => `"${q}"`).join(', ')
    : null

  const systemPrompt = isptBR
    ? `Você é um especialista em SEO e copywriting para B2B brasileiro. Você reescreve titles e meta descriptions de posts de blog para maximizar CTR no Google Search.

Regras absolutas:
- Title: máximo 65 caracteres. Incluir 1 número específico se possível. Começar com keyword ou dado concreto.
- Description: máximo 155 caracteres. Terminar com CTA implícita ou benefício claro. Sem reticências.
- CRÍTICO: A página já ranqueia para as queries informadas. O novo title DEVE conter a keyword principal dessas queries. Remover ou substituir a keyword primária destrói o ranqueamento existente.
- Não inventar fatos.
- Tom: direto, técnico, sem floreio, sem motivação vazia.
- Responder APENAS no formato JSON pedido — sem explicações.`
    : `You are an SEO and copywriting specialist for B2B content. You rewrite blog post titles and meta descriptions to maximize CTR on Google Search.

Absolute rules:
- Title: maximum 65 characters. Include 1 specific number if possible. Start with keyword or concrete data.
- Description: maximum 155 characters. End with implicit CTA or clear benefit. No ellipsis.
- CRITICAL: The page already ranks for the queries listed below. The new title MUST contain the primary keyword phrase from those queries. Removing or replacing it destroys existing rankings.
- Do not invent facts.
- Tone: direct, technical, no fluff.
- Respond ONLY in the requested JSON format — no explanations.`

  const userPrompt = isptBR
    ? `Post com CTR abaixo do esperado no Google:
- Impressões: ${impressions}
- Posição média: ${avgPosition.toFixed(1)}
- Queries que já geram ranqueamento: ${queriesNote ?? '(não disponível)'}
- Title atual (${currentTitle.length} chars): "${currentTitle}"
- Description atual (${currentDescription.length} chars): "${currentDescription}"

Reescreva para aumentar o CTR mantendo a keyword principal. Retorne JSON exato:
{"title": "...", "description": "..."}`
    : `Post with below-average CTR on Google:
- Impressions: ${impressions}
- Average position: ${avgPosition.toFixed(1)}
- Queries already driving rankings: ${queriesNote ?? '(not available)'}
- Current title (${currentTitle.length} chars): "${currentTitle}"
- Current description (${currentDescription.length} chars): "${currentDescription}"

Rewrite to increase CTR while preserving the primary keyword. Return exact JSON:
{"title": "...", "description": "..."}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error ${response.status}: ${err.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text?.trim() || ''

  // Extract JSON — handle possible markdown fences
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Unexpected Claude response: ${text.slice(0, 200)}`)

  const result = JSON.parse(jsonMatch[0])
  if (!result.title || !result.description) throw new Error(`Missing title or description in: ${text}`)

  // Enforce length limits
  result.title       = result.title.slice(0, 65)
  result.description = result.description.slice(0, 155)

  return result
}

// ─── Main loop ───────────────────────────────────────────────────────────────

const logPath = path.join(ROOT, 'docs', 'ctr-rewrite-log.jsonl')
const results = []

for (const row of candidates) {
  const url = row.keys[0]
  const meta = urlToMdxPath(url)

  if (!meta) {
    console.log(`⚠️  Não foi possível mapear URL para MDX: ${url}`)
    continue
  }

  if (!fs.existsSync(meta.path)) {
    console.log(`⚠️  Arquivo MDX não encontrado: ${meta.path}`)
    continue
  }

  const fm = parseFrontmatter(meta.path)
  const currentTitle = fm.title || ''
  const currentDesc  = fm.description || ''

  if (!currentTitle || !currentDesc) {
    console.log(`⚠️  Frontmatter incompleto em ${meta.slug} — pulando`)
    continue
  }

  // Get top queries driving impressions for this specific page
  let topQueries = []
  try {
    const pageQueryRows = await queryGsc({
      startDate:  PERIOD_START,
      endDate:    PERIOD_END,
      dimensions: ['query'],
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          operator:  'equals',
          expression: url,
        }],
      }],
    })
    topQueries = pageQueryRows
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 3)
      .map(r => r.keys[0])
  } catch (_) {
    // Non-fatal — continue without query context
  }

  console.log(`\n✏️  Reescrevendo: ${meta.slug}`)
  console.log(`   Title atual: "${currentTitle}"`)
  console.log(`   Desc  atual: "${currentDesc}"`)
  if (topQueries.length > 0) console.log(`   Queries top: ${topQueries.map(q => `"${q}"`).join(', ')}`)

  let rewrite
  try {
    rewrite = await generateRewrite(
      meta.lang,
      currentTitle,
      currentDesc,
      row.impressions,
      row.position,
      topQueries,
    )
  } catch (err) {
    console.error(`   ❌ Erro ao chamar Claude: ${err.message}`)
    continue
  }

  const titleChanged = rewrite.title !== currentTitle
  const descChanged  = rewrite.description !== currentDesc

  if (!titleChanged && !descChanged) {
    console.log('   ℹ️  Sem mudanças — Claude manteve o original.')
    continue
  }

  if (titleChanged) console.log(`   → Title novo: "${rewrite.title}" (${rewrite.title.length} chars)`)
  if (descChanged)  console.log(`   → Desc  nova: "${rewrite.description}" (${rewrite.description.length} chars)`)

  const updates = {}
  if (titleChanged) updates.title       = rewrite.title
  if (descChanged)  updates.description = rewrite.description

  applyFrontmatterUpdate(meta.path, updates)

  if (!DRY_RUN) {
    console.log('   ✅  Arquivo atualizado.')
  } else {
    console.log('   🧪  (dry-run — arquivo não modificado)')
  }

  const logEntry = {
    date:            TODAY,
    slug:            meta.slug,
    lang:            meta.lang,
    impressions:     row.impressions,
    ctr:             parseFloat(row.ctr.toFixed(4)),
    position:        parseFloat(row.position.toFixed(2)),
    before: { title: currentTitle, description: currentDesc },
    after:  { title: rewrite.title, description: rewrite.description },
    dryRun:          DRY_RUN,
  }

  results.push(logEntry)

  if (!DRY_RUN) {
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8')
  }

  // Rate-limit — be kind to the API between calls
  await new Promise(r => setTimeout(r, 800))
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60))
console.log(`\n📋  Resumo: ${results.length} post(s) ${DRY_RUN ? 'analisados' : 'reescritos'}`)

if (results.length > 0 && !DRY_RUN) {
  console.log(`    Log salvo em: docs/ctr-rewrite-log.jsonl`)
  console.log('\n⚠️  Lembre de:')
  console.log('   1. Verificar as mudanças com: git diff content/blog/')
  console.log('   2. Fazer commit com: git commit -m "seo: CTR rewrite automático via ctr-rewrite.mjs"')
  console.log('   3. Medir o impacto no GSC após 30 dias')
}

if (DRY_RUN && results.length > 0) {
  console.log('\n   Para aplicar: node scripts/ctr-rewrite.mjs (sem --dry-run)')
}

console.log('')

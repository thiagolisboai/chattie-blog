/**
 * Feedback Loop — C1 da Fase C de Autonomia Total
 *
 * 30 dias após publicação, o Dexter puxa métricas do post pelo slug via GSC.
 *
 * Regras:
 *   CTR < 2% com > 100 impressões → agenda reescrita de title/description
 *   Posição > 20 com > 50 impressões → agenda expansão de conteúdo
 *   CTR >= 3% e posição <= 10 → marca como "performando bem"
 *
 * Resultado: atualiza docs/feedback-queue.md com ações pendentes
 *
 * Uso:
 *   node scripts/feedback-loop.mjs
 *   node scripts/feedback-loop.mjs --days=45   (janela de dados GSC, padrão: 28)
 *   node scripts/feedback-loop.mjs --min-age=15 (posts mais antigos que X dias, padrão: 30)
 *
 * Requer:
 *   GSC_KEY_FILE, GSC_SITE_URL
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Config ───────────────────────────────────────────────────────────────────

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

const KEY_FILE = process.env.GSC_KEY_FILE
const SITE_URL = process.env.GSC_SITE_URL || 'https://trychattie.com/'
const GSC_DAYS = parseInt(process.argv.find(a => a.startsWith('--days='))?.split('=')[1] || '28')
const MIN_AGE  = parseInt(process.argv.find(a => a.startsWith('--min-age='))?.split('=')[1] || '30')

if (!KEY_FILE || !fs.existsSync(KEY_FILE)) {
  console.error('❌  GSC_KEY_FILE nao configurado. Veja docs/gsc-setup.md')
  process.exit(1)
}

// ─── GSC Auth ─────────────────────────────────────────────────────────────────

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
})
const sc = google.searchconsole({ version: 'v1', auth })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateMinus(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function daysBetween(dateStr) {
  const then = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

// ─── Parse session log to get published posts ─────────────────────────────────

function getPublishedPosts() {
  const logPath = path.join(ROOT, 'docs', 'agent-session-log.md')
  if (!fs.existsSync(logPath)) return []

  const raw = fs.readFileSync(logPath, 'utf-8')
  const posts = []

  // Match: ## YYYY-MM-DD — "Title"
  //        - Slug: my-slug
  const entries = [...raw.matchAll(/## (\d{4}-\d{2}-\d{2}) — "([^"]+)"\n- Keyword: ([^\n]+)\n- Slug: ([\w-]+)/g)]
  for (const m of entries) {
    const publishDate = m[1]
    const title = m[2]
    const keyword = m[3].trim()
    const slug = m[4].trim()
    const ageInDays = daysBetween(publishDate)
    if (ageInDays >= MIN_AGE) {
      posts.push({ publishDate, title, keyword, slug, ageInDays })
    }
  }
  return posts
}

// ─── Query GSC for a single post ──────────────────────────────────────────────

async function queryPostMetrics(slug) {
  const pageUrl = `${SITE_URL.replace(/\/$/, '')}/pt-br/blog/${slug}`
  const endDate = dateMinus(3) // GSC has ~3 day lag
  const startDate = dateMinus(GSC_DAYS + 3)

  try {
    const res = await sc.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 1,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'equals',
            expression: pageUrl,
          }],
        }],
      },
    })

    const rows = res.data.rows || []
    if (rows.length === 0) return null

    const row = rows[0]
    return {
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      period: `${startDate} → ${endDate}`,
    }
  } catch (err) {
    console.warn(`⚠️  GSC query falhou para ${slug}: ${err.message}`)
    return null
  }
}

// ─── Classify action needed ────────────────────────────────────────────────────

function classifyAction(metrics) {
  if (!metrics) return 'sem-dados'

  const { ctr, impressions, position } = metrics

  // CTR opportunity: low CTR despite visibility
  if (ctr < 0.02 && impressions >= 100) return 'reescrever-title'

  // Content gap: ranking but too deep in results
  if (position > 20 && impressions >= 50) return 'expandir-conteudo'

  // Good performer: no action needed
  if (ctr >= 0.03 && position <= 10) return 'performando-bem'

  // Moderate: needs monitoring
  if (impressions < 20) return 'pouco-indexado'

  return 'monitorar'
}

// ─── Load existing feedback queue to avoid duplicates ────────────────────────

function loadFeedbackQueue() {
  const p = path.join(ROOT, 'docs', 'feedback-queue.md')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('📊  C1: Feedback Loop — verificando performance dos posts publicados...')

const posts = getPublishedPosts()
if (posts.length === 0) {
  console.log(`ℹ️  Nenhum post publicado ha mais de ${MIN_AGE} dias no session log.`)
  process.exit(0)
}

console.log(`📋  ${posts.length} post(s) com mais de ${MIN_AGE} dias para verificar`)

const results = []
for (const post of posts) {
  process.stdout.write(`   Verificando ${post.slug} (${post.ageInDays}d atrás)... `)
  const metrics = await queryPostMetrics(post.slug)
  const action = classifyAction(metrics)
  results.push({ ...post, metrics, action })
  console.log(action)
}

// ─── Generate feedback-queue.md ───────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]
const existingQueue = loadFeedbackQueue()

const newEntries = results.filter(r => !['performando-bem', 'sem-dados', 'monitorar'].includes(r.action))
const goodPerformers = results.filter(r => r.action === 'performando-bem')
const noData = results.filter(r => r.action === 'sem-dados')

const lines = [
  `# Feedback Queue — Dexter`,
  ``,
  `> Atualizado em: **${today}** | Posts analisados: **${results.length}** | Janela GSC: **${GSC_DAYS} dias**`,
  ``,
  `---`,
  ``,
]

// Action items
if (newEntries.length > 0) {
  lines.push(`## 🚨 Ações Pendentes (${newEntries.length})`, ``)
  lines.push(`| Slug | Ação | Impressões | CTR | Posição | Publicado |`)
  lines.push(`|------|------|-----------|-----|---------|-----------|`)
  for (const r of newEntries) {
    const m = r.metrics
    const actionLabel = r.action === 'reescrever-title' ? '✏️ Reescrever title/description'
      : r.action === 'expandir-conteudo' ? '📝 Expandir conteudo'
      : r.action === 'pouco-indexado' ? '🔍 Verificar indexacao'
      : r.action
    lines.push(`| \`${r.slug}\` | ${actionLabel} | ${m?.impressions ?? '—'} | ${m ? (m.ctr * 100).toFixed(1) + '%' : '—'} | ${m ? m.position.toFixed(1) : '—'} | ${r.publishDate} |`)
  }

  lines.push(``, `### Como executar as ações`, ``)
  const rewriteSlug = newEntries.find(r => r.action === 'reescrever-title')?.slug
  const expandSlug  = newEntries.find(r => r.action === 'expandir-conteudo')?.slug
  if (rewriteSlug) lines.push(`**Reescrever title/description:**`)
  if (rewriteSlug) lines.push(`\`\`\`bash`, `node scripts/update-post.mjs --slug=${rewriteSlug}`, `\`\`\``, ``)
  if (expandSlug) lines.push(`**Expandir conteudo:**`)
  if (expandSlug) lines.push(`\`\`\`bash`, `node scripts/update-post.mjs --slug=${expandSlug}`, `\`\`\``, ``)
}

// Good performers
if (goodPerformers.length > 0) {
  lines.push(``, `## ✅ Performando Bem (${goodPerformers.length})`, ``)
  lines.push(`| Slug | Cliques | CTR | Posição |`)
  lines.push(`|------|---------|-----|---------|`)
  for (const r of goodPerformers) {
    const m = r.metrics
    lines.push(`| \`${r.slug}\` | ${m?.clicks ?? 0} | ${m ? (m.ctr * 100).toFixed(1) + '%' : '—'} | ${m ? m.position.toFixed(1) : '—'} |`)
  }
}

// No data
if (noData.length > 0) {
  lines.push(``, `## 🔍 Sem Dados GSC (${noData.length})`, ``)
  lines.push(`_Posts muito novos ou ainda nao indexados._`, ``)
  noData.forEach(r => lines.push(`- \`${r.slug}\` (publicado ${r.publishDate}, ${r.ageInDays}d atrás)`))
}

lines.push(``, `---`, `_Gerado por \`scripts/feedback-loop.mjs\` — rode mensalmente_`)

const outPath = path.join(ROOT, 'docs', 'feedback-queue.md')
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')

console.log(`
✅  C1: Feedback Queue atualizada: docs/feedback-queue.md

  Acoes pendentes:    ${newEntries.length}
  Performando bem:    ${goodPerformers.length}
  Sem dados GSC:      ${noData.length}
`)

if (newEntries.length > 0) {
  console.log('Proximos passos:')
  newEntries.forEach(r => console.log(`  → ${r.action}: node scripts/update-post.mjs --slug=${r.slug}`))
}

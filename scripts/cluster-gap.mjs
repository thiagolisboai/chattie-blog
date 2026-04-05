/**
 * Cluster Gap Analysis — C4 da Fase C de Autonomia Total
 *
 * Analisa qual cluster do backlog esta subrepresentado vs. o trafego que gera.
 * Rebalanceia a fila de producao automaticamente ajustando prioridades no backlog.
 *
 * Algoritmo:
 *   1. Agrupa posts existentes por categoria
 *   2. Lê impressões GSC por categoria (inferido por URL/slug)
 *   3. Calcula "densidade de trafego" = impressões / posts publicados
 *   4. Categorias com alta densidade = subrepresentadas → prioridade Alta no backlog
 *   5. Categorias com baixa densidade = saturadas → rebaixar para Media
 *
 * Uso:
 *   node scripts/cluster-gap.mjs
 *   node scripts/cluster-gap.mjs --apply   (aplica mudancas no backlog)
 *   node scripts/cluster-gap.mjs --dry-run (mostra analise sem alterar)
 *
 * Saída: docs/cluster-gap-report.md + (com --apply) atualiza keyword-backlog.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')

const DRY_RUN = !process.argv.includes('--apply')

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

// ─── Category inference ───────────────────────────────────────────────────────

function inferCategory(keyword) {
  const kw = keyword.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (kw.includes('chattie')) return 'chattie'
  if (kw.includes('social selling') || kw.includes('social-selling') || kw.includes('crm')) return 'social-selling'
  if (kw.startsWith('ia ') || kw.includes(' ia ') || kw.includes('inteligencia artificial') ||
      kw.includes('ai sdr') || kw.includes('automacao de vendas')) return 'ia-para-vendas'
  if (kw.includes('comparat') || kw.includes(' vs ')) return 'comparativos'
  return 'linkedin'
}

// ─── Parse frontmatter ────────────────────────────────────────────────────────

function parseFm(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':')
    if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
  })
  return fm
}

// ─── Count published posts per category ──────────────────────────────────────

function getPublishedCountByCategory() {
  if (!fs.existsSync(BLOG_DIR)) return {}
  const counts = {}
  fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx')).forEach(f => {
    const fm = parseFm(path.join(BLOG_DIR, f))
    const cat = fm.category || inferCategory(f.replace('.mdx', '').replace(/-/g, ' '))
    counts[cat] = (counts[cat] || 0) + 1
  })
  return counts
}

// ─── Parse GSC insights for impressions per category ─────────────────────────

function getImpressionsByCategory() {
  const gscPath = path.join(ROOT, 'docs', 'gsc-insights.md')
  if (!fs.existsSync(gscPath)) return {}

  const raw = fs.readFileSync(gscPath, 'utf-8')
  const impressions = {}

  // Parse blog pages table: | /pt-br/blog/slug | clicks | impressions | ...
  const pagePattern = /\|\s*(\/(?:pt-br\/)?blog\/[\w-]+)\s*\|\s*(\d+)\s*\|\s*(\d+)/g
  for (const m of raw.matchAll(pagePattern)) {
    const url = m[1]
    const imp = parseInt(m[3])
    // Infer category from URL slug
    const slug = url.split('/').pop()
    const cat = inferCategory(slug.replace(/-/g, ' '))
    impressions[cat] = (impressions[cat] || 0) + imp
  }

  return impressions
}

// ─── Parse backlog ────────────────────────────────────────────────────────────

function parseBacklog() {
  const p = path.join(ROOT, 'docs', 'keyword-backlog.md')
  if (!fs.existsSync(p)) return { raw: '', rows: [] }

  const raw = fs.readFileSync(p, 'utf-8')
  const rows = raw.split('\n')
    .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Keyword'))
    .map(l => {
      const cols = l.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length < 5) return null
      return {
        keyword: cols[0], intent: cols[1], competition: cols[2],
        priority: cols[3], status: cols[4], original: l,
      }
    })
    .filter(Boolean)

  return { raw, rows }
}

// ─── Main analysis ────────────────────────────────────────────────────────────

console.log('📊  C4: Cluster Gap Analysis...')

const publishedByCategory   = getPublishedCountByCategory()
const impressionsByCategory = getImpressionsByCategory()
const { raw: backlogRaw, rows: backlogRows } = parseBacklog()

// All known categories
const ALL_CATS = [
  ...new Set([
    ...Object.keys(publishedByCategory),
    ...Object.keys(impressionsByCategory),
    'linkedin', 'social-selling', 'ia-para-vendas', 'comparativos', 'chattie',
  ])
]

// Pending keywords per category
const pendingByCategory = {}
backlogRows
  .filter(r => r.status.toLowerCase() === 'pendente')
  .forEach(r => {
    const cat = inferCategory(r.keyword)
    pendingByCategory[cat] = (pendingByCategory[cat] || 0) + 1
  })

// Calculate traffic density and gap score per category
const analysis = ALL_CATS.map(cat => {
  const published  = publishedByCategory[cat] || 0
  const impressions = impressionsByCategory[cat] || 0
  const pending    = pendingByCategory[cat] || 0

  // Density: impressions per published post (higher = more demand per post)
  const density = published > 0 ? Math.round(impressions / published) : 0

  // Gap score: high density + low published count = underrepresented
  const gapScore = published > 0 ? density : (impressions > 0 ? impressions * 2 : 0)

  return { cat, published, impressions, density, pending, gapScore }
}).sort((a, b) => b.gapScore - a.gapScore)

// ─── Determine priority adjustments ──────────────────────────────────────────

const maxGap = Math.max(...analysis.map(a => a.gapScore), 1)

function recommendedPriority(a) {
  const ratio = a.gapScore / maxGap
  if (ratio >= 0.7) return 'Alta'
  if (ratio >= 0.3) return 'Média'
  return 'Baixa'
}

// ─── Generate report ──────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]

const reportLines = [
  `# Cluster Gap Analysis — ${today}`,
  ``,
  `> Identifica clusters subrepresentados vs. trafego gerado.`,
  `> Use para priorizar a fila de producao do Dexter.`,
  ``,
  `---`,
  ``,
  `## Distribuição por Cluster`,
  ``,
  `| Cluster | Posts publicados | Impressoes GSC | Densidade | Keywords pendentes | Recomendacao |`,
  `|---------|-----------------|----------------|-----------|-------------------|--------------|`,
  ...analysis.map(a => {
    const rec = recommendedPriority(a)
    const recIcon = rec === 'Alta' ? '🔥 Alta' : rec === 'Média' ? '📈 Média' : '⬇️ Baixa'
    return `| **${a.cat}** | ${a.published} | ${a.impressions.toLocaleString()} | ${a.density.toLocaleString()} imp/post | ${a.pending} | ${recIcon} |`
  }),
  ``,
  `---`,
  ``,
  `## Insights`,
  ``,
]

const topGaps = analysis.filter(a => recommendedPriority(a) === 'Alta')
const saturated = analysis.filter(a => recommendedPriority(a) === 'Baixa' && a.pending > 0)

if (topGaps.length > 0) {
  reportLines.push(`### 🔥 Clusters subrepresentados (priorizar)`)
  topGaps.forEach(a => reportLines.push(`- **${a.cat}**: ${a.density} impressões/post — ${a.pending} keywords no backlog`))
  reportLines.push(``)
}

if (saturated.length > 0) {
  reportLines.push(`### ⬇️ Clusters saturados (pausar)`)
  saturated.forEach(a => reportLines.push(`- **${a.cat}**: ${a.published} posts, ${a.density} imp/post — ${a.pending} keywords no backlog`))
  reportLines.push(``)
}

reportLines.push(
  `---`,
  `_Gerado por \`scripts/cluster-gap.mjs\` — rode mensalmente ou apos cada sessao GSC_`,
)

const reportPath = path.join(ROOT, 'docs', 'cluster-gap-report.md')
fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf-8')
console.log(`✅  Relatorio salvo: docs/cluster-gap-report.md`)

// ─── Apply priority updates to backlog ────────────────────────────────────────

const priorityMap = {}
analysis.forEach(a => { priorityMap[a.cat] = recommendedPriority(a) })

// Build category→recommended priority lookup
const changes = []
let updatedBacklog = backlogRaw

for (const row of backlogRows) {
  if (row.status.toLowerCase() !== 'pendente') continue

  const cat = inferCategory(row.keyword)
  const recommended = priorityMap[cat]
  if (!recommended || recommended === row.priority) continue

  const newRow = row.original.replace(
    new RegExp(`\\|\\s*${row.priority}\\s*\\|\\s*${row.status}\\s*\\|`),
    `| ${recommended} | ${row.status} |`
  )

  if (newRow !== row.original) {
    changes.push({ keyword: row.keyword, from: row.priority, to: recommended, cat })
    if (!DRY_RUN) {
      updatedBacklog = updatedBacklog.replace(row.original, newRow)
    }
  }
}

if (changes.length > 0) {
  console.log(`\n📋  ${changes.length} ajuste(s) de prioridade identificado(s):`)
  changes.forEach(c => console.log(`   ${c.cat}: "${c.keyword}" — ${c.from} → ${c.to}`))

  if (!DRY_RUN) {
    fs.writeFileSync(path.join(ROOT, 'docs', 'keyword-backlog.md'), updatedBacklog, 'utf-8')
    console.log(`\n✅  Backlog atualizado com novas prioridades.`)
  } else {
    console.log(`\n   [dry-run] Use --apply para atualizar o backlog.`)
  }
} else {
  console.log('\nℹ️  Nenhum ajuste de prioridade necessario.')
}

console.log(`\nDistribuição de gaps:`)
analysis.forEach(a => {
  const bar = '█'.repeat(Math.round(a.gapScore / maxGap * 15))
  console.log(`  ${a.cat.padEnd(18)} ${bar.padEnd(15)} ${recommendedPriority(a)}`)
})

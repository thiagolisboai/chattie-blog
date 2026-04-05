/**
 * Generate Dashboard — T2.7: painel unificado do Dexter
 *
 * Agrega dados de todas as fontes disponíveis e gera docs/dexter-dashboard.md
 * com uma visão consolidada do estado atual do blog e do agente.
 *
 * Fontes:
 *   docs/gsc-history.jsonl     — métricas GSC ao longo do tempo
 *   docs/gsc-insights.md       — dados GSC do último relatório
 *   docs/keyword-backlog.md    — estado do backlog de keywords
 *   docs/agent-session-log.md  — histórico de publicações
 *   docs/cost-log.jsonl        — custo acumulado das chamadas Anthropic
 *   docs/feedback-queue.md     — ações pendentes do feedback-loop
 *
 * Uso:
 *   node scripts/generate-dashboard.mjs
 *
 * Saída:
 *   docs/dexter-dashboard.md — atualizado com snapshot atual
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pct   = (n) => `${(n * 100).toFixed(1)}%`
const pos   = (n) => n?.toFixed(1) ?? '—'
const usd   = (n) => `$${n.toFixed(4)}`
const readFile = (rel) => {
  const p = path.join(ROOT, rel)
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null
}
const readJsonl = (rel) => {
  const raw = readFile(rel)
  if (!raw) return []
  return raw.trim().split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l) } catch { return null }
  }).filter(Boolean)
}

// ─── Read all data sources ────────────────────────────────────────────────────

const gscHistory   = readJsonl('docs/gsc-history.jsonl')
const costLog      = readJsonl('docs/cost-log.jsonl')
const sessionLog   = readFile('docs/agent-session-log.md')
const backlog      = readFile('docs/keyword-backlog.md')
const feedbackQ    = readFile('docs/feedback-queue.md')
const gscInsights  = readFile('docs/gsc-insights.md')
const qualityLog   = readJsonl('docs/quality-ratings.jsonl')
const config       = await import('./load-config.mjs').then(m => m.config).catch(() => null)

// ─── 1. GSC metrics — latest + trend ─────────────────────────────────────────

const latestGsc  = gscHistory.at(-1) || null
const prevGsc    = gscHistory.at(-2) || null
const gscTrend   = (latestGsc && prevGsc) ? {
  clicksDiff:      latestGsc.totals.clicks - prevGsc.totals.clicks,
  impressionsDiff: latestGsc.totals.impressions - prevGsc.totals.impressions,
  ctrDiff:         latestGsc.totals.ctr - prevGsc.totals.ctr,
  positionDiff:    latestGsc.totals.position - prevGsc.totals.position,
} : null

// ─── 2. Publishing stats ──────────────────────────────────────────────────────

const sessionEntries = sessionLog
  ? [...sessionLog.matchAll(/^## (\d{4}-\d{2}-\d{2}) — "(.+)"/gm)].map(m => ({
      date: m[1], title: m[2],
    }))
  : []

const last30Days = new Date()
last30Days.setDate(last30Days.getDate() - 30)
const recentPosts = sessionEntries.filter(e => new Date(e.date) >= last30Days)

// Total published posts (count mdx files)
const blogDir = path.join(ROOT, 'content', 'blog')
const totalPosts = fs.existsSync(blogDir)
  ? fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx')).length
  : 0

// ─── 3. Backlog stats ─────────────────────────────────────────────────────────

let backlogPending = 0
let backlogHigh = 0
let backlogPublished = 0

if (backlog) {
  const rows = backlog.split('\n').filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Keyword'))
  for (const row of rows) {
    const cols = row.split('|').map(c => c.trim()).filter(Boolean)
    if (cols.length < 5) continue
    const priority = cols[3]?.toLowerCase() || ''
    const status   = cols[4]?.toLowerCase() || ''
    if (status === 'pendente') {
      backlogPending++
      if (priority.includes('alta')) backlogHigh++
    }
    if (status.includes('publicado')) backlogPublished++
  }
}

// ─── 4. Cost stats ────────────────────────────────────────────────────────────

const totalCost = costLog.reduce((sum, e) => sum + (e.costUsd || 0), 0)
const last30Cost = costLog
  .filter(e => e.ts && new Date(e.ts) >= last30Days)
  .reduce((sum, e) => sum + (e.costUsd || 0), 0)
const callsByLabel = {}
for (const e of costLog) {
  if (!e.label) continue
  callsByLabel[e.label] = (callsByLabel[e.label] || { calls: 0, cost: 0 })
  callsByLabel[e.label].calls++
  callsByLabel[e.label].cost += e.costUsd || 0
}

// ─── 5. F4.2: Activation readiness ───────────────────────────────────────────

// Count posts with GSC auto-score rating >= 4 (CTR > 3% OR position ≤10)
const highPerformingPosts = qualityLog.filter(e => e.source === 'gsc-auto' && e.rating >= 4).length
const beehiivReady = highPerformingPosts >= 5

// Count total PR sessions as a proxy for "PR mode established"
const prSessions = sessionEntries.length
const linkedinReady = prSessions >= 8

// ─── 6. Feedback queue ────────────────────────────────────────────────────────

let feedbackActions = 0
if (feedbackQ) {
  feedbackActions = (feedbackQ.match(/^\| \/pt-br\/blog\//gm) || []).length
}

// ─── 6. GSC top opportunities (from latest insights) ─────────────────────────

let topCtrOpportunity = null
let topQueryGap = null
if (gscInsights) {
  const ctrMatch = gscInsights.match(/\|\s*(\/[^\s|]+)\s*\|\s*(\d+)\s*\|\s*\d+\s*\|\s*([\d.]+%)\s*\|\s*([\d.]+)\s*\|/)
  if (ctrMatch) topCtrOpportunity = { url: ctrMatch[1], impressions: ctrMatch[2], ctr: ctrMatch[3], pos: ctrMatch[4] }

  const querySection = gscInsights.match(/##.*[Qq]ueries[\s\S]*?(?=\n##)/)?.[0] || ''
  const queryMatch = querySection.match(/\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|/)
  if (queryMatch && !queryMatch[1].startsWith('Query')) {
    topQueryGap = { query: queryMatch[1].trim(), impressions: queryMatch[2] }
  }
}

// ─── Generate markdown ────────────────────────────────────────────────────────

const now = new Date()
const nowStr = now.toISOString().split('T')[0]
const lines = []
const h = (...args) => lines.push(...args, '')

h(
  `# Dexter Dashboard — ${nowStr}`,
  `> Atualizado automaticamente ao final de cada sessão`,
  '',
  '---',
)

// ── Bloco 1: GSC Metrics ──
h('## 📊 Métricas GSC')

if (latestGsc) {
  const trendRow = gscTrend ? [
    `| Cliques | ${latestGsc.totals.clicks} | ${gscTrend.clicksDiff >= 0 ? '+' : ''}${gscTrend.clicksDiff} |`,
    `| Impressões | ${latestGsc.totals.impressions} | ${gscTrend.impressionsDiff >= 0 ? '+' : ''}${gscTrend.impressionsDiff} |`,
    `| CTR médio | ${pct(latestGsc.totals.ctr)} | ${gscTrend.ctrDiff >= 0 ? '+' : ''}${pct(gscTrend.ctrDiff)} |`,
    `| Posição média | ${pos(latestGsc.totals.position)} | ${gscTrend.positionDiff >= 0 ? '+' : ''}${gscTrend.positionDiff.toFixed(2)} |`,
    `| Páginas rastreadas | ${latestGsc.totals.pages} | — |`,
  ] : [
    `| Cliques | ${latestGsc.totals.clicks} | — |`,
    `| Impressões | ${latestGsc.totals.impressions} | — |`,
    `| CTR médio | ${pct(latestGsc.totals.ctr)} | — |`,
    `| Posição média | ${pos(latestGsc.totals.position)} | — |`,
    `| Páginas rastreadas | ${latestGsc.totals.pages} | — |`,
  ]

  h(
    `_Período: ${latestGsc.period.start} → ${latestGsc.period.end} (${latestGsc.period.days} dias)_`,
    '',
    `| Métrica | Valor | vs anterior |`,
    `|---------|-------|------------|`,
    ...trendRow,
  )

  if (gscHistory.length >= 4) {
    const recent4 = gscHistory.slice(-4)
    h(
      '### Evolução de cliques (últimas 4 medições)',
      '',
      `| Data | Cliques | Impressões | CTR |`,
      `|------|---------|-----------|-----|`,
      ...recent4.map(e => `| ${e.date} | ${e.totals.clicks} | ${e.totals.impressions} | ${pct(e.totals.ctr)} |`),
    )
  }
} else {
  h('_Nenhum dado GSC disponível ainda. Execute `node scripts/gsc-report.mjs` para iniciar._')
}

// ── Bloco 2: Publishing Stats ──
h(
  '## 📝 Publicações',
  '',
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Posts publicados (total) | ${totalPosts} |`,
  `| Posts nos últimos 30 dias | ${recentPosts.length} |`,
  `| Cadência média | ${recentPosts.length > 0 ? (recentPosts.length / 4).toFixed(1) + '/semana' : '—'} |`,
)

if (recentPosts.length > 0) {
  h(
    '### Últimas publicações',
    '',
    `| Data | Título |`,
    `|------|--------|`,
    ...recentPosts.slice(-5).reverse().map(e => `| ${e.date} | ${e.title} |`),
  )
}

// ── Bloco 3: Backlog ──
h(
  '## 📋 Backlog de Keywords',
  '',
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Keywords pendentes | ${backlogPending} |`,
  `| Alta prioridade | ${backlogHigh} |`,
  `| Publicadas | ${backlogPublished} |`,
)

// ── Bloco 4: Custos ──
h(
  '## 💰 Custos Anthropic API',
  '',
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Custo total acumulado | ${usd(totalCost)} |`,
  `| Custo últimos 30 dias | ${usd(last30Cost)} |`,
  `| Chamadas totais | ${costLog.length} |`,
)

if (Object.keys(callsByLabel).length > 0) {
  h(
    '### Custo por tipo de chamada',
    '',
    `| Label | Chamadas | Custo |`,
    `|-------|---------|-------|`,
    ...Object.entries(callsByLabel)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([label, d]) => `| ${label} | ${d.calls} | ${usd(d.cost)} |`),
  )
}

// ── Bloco 5: F4.2 — Canais de Distribuição ──
h(
  '## 🚀 Canais de Distribuição',
  '',
  `| Canal | Status | Critério |`,
  `|-------|--------|---------|`,
  `| Email notificação | ${config?.postPublish?.emailNotification ? '✅ Ativo' : '⏸️ Inativo'} | — |`,
  `| Newsletter Beehiiv | ${config?.postPublish?.beehiivDraft ? '✅ Ativo' : beehiivReady ? '🟡 **Pronto para ativar**' : '⏸️ Aguardando'} | ${highPerformingPosts}/5 posts com CTR > 3% ou top-10 |`,
  `| Draft LinkedIn | ${config?.postPublish?.linkedinDraft ? '✅ Ativo' : linkedinReady ? '🟡 **Pronto para ativar**' : '⏸️ Aguardando'} | ${prSessions}/8 sessões publicadas |`,
  `| Google Indexing | ${config?.postPublish?.googleIndexing ? '✅ Ativo' : '⏸️ Inativo'} | — |`,
)

if (beehiivReady && !config?.postPublish?.beehiivDraft) {
  h('> 💡 **Beehiiv pronto para ativar** — defina `postPublish.beehiivDraft: true` em `dexter.config.mjs`')
}
if (linkedinReady && !config?.postPublish?.linkedinDraft) {
  h('> 💡 **LinkedIn draft pronto para ativar** — defina `postPublish.linkedinDraft: true` em `dexter.config.mjs`')
}

// ── Bloco 6: Pending Actions ──
h('## ⚡ Ações Pendentes')

const hasPendingActions = feedbackActions > 0 || topCtrOpportunity || topQueryGap
if (hasPendingActions) {
  if (feedbackActions > 0) {
    h(`- **${feedbackActions} post(s) no feedback-queue** — ver \`docs/feedback-queue.md\``)
  }
  if (topCtrOpportunity) {
    h(`- **Oportunidade de CTR**: \`${topCtrOpportunity.url}\` — ${topCtrOpportunity.impressions} impressões, CTR ${topCtrOpportunity.ctr} (pos. ${topCtrOpportunity.pos})`)
  }
  if (topQueryGap) {
    h(`- **Query sem post**: "${topQueryGap.query}" — ${topQueryGap.impressions} impressões`)
  }
} else {
  h('_Nenhuma ação pendente identificada._')
}

// ── Footer ──
h(
  '---',
  `_Gerado automaticamente por \`scripts/generate-dashboard.mjs\` em ${now.toLocaleString('pt-BR')}_`,
  `_Fontes: ${[
    gscHistory.length > 0 && 'gsc-history.jsonl',
    costLog.length > 0 && 'cost-log.jsonl',
    sessionLog && 'agent-session-log.md',
    backlog && 'keyword-backlog.md',
  ].filter(Boolean).join(', ')}_`,
)

// ─── Write output ─────────────────────────────────────────────────────────────

const outPath = path.join(ROOT, 'docs', 'dexter-dashboard.md')
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')

console.log(`✅  Dashboard gerado: docs/dexter-dashboard.md`)
console.log(`    Posts: ${totalPosts} | Custo total: ${usd(totalCost)} | Backlog: ${backlogPending} pendentes`)
if (latestGsc) {
  console.log(`    GSC (${latestGsc.period.start}→${latestGsc.period.end}): ${latestGsc.totals.clicks} cliques, ${latestGsc.totals.impressions} impressões`)
}

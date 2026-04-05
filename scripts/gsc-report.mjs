/**
 * GSC Report — Fase 1 do Agente de Conteúdo Chattie
 *
 * Puxa dados do Google Search Console e gera docs/gsc-insights.md
 * com insights acionáveis para orientar a próxima sessão de conteúdo.
 *
 * Setup (uma vez):
 *   1. Google Cloud Console → APIs & Services → Enable "Google Search Console API"
 *   2. IAM → Service Accounts → Create → Download JSON key
 *   3. No GSC → Configurações → Usuários e permissões → Adicionar o email da service account
 *   4. No .env.local: GSC_KEY_FILE=/caminho/para/key.json  e  GSC_SITE_URL=https://trychattie.com/
 *
 * Uso:
 *   node scripts/gsc-report.mjs
 *   node scripts/gsc-report.mjs --days=60   (padrão: 30)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Config ────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const [k, ...v] = line.split('=')
    if (k && !k.startsWith('#') && v.length) process.env[k.trim()] = v.join('=').trim()
  })
}
loadEnv()

const KEY_FILE  = process.env.GSC_KEY_FILE
const SITE_URL  = process.env.GSC_SITE_URL || 'https://trychattie.com/'
const DAYS      = parseInt(process.argv.find(a => a.startsWith('--days='))?.split('=')[1] || '30')

if (!KEY_FILE || !fs.existsSync(KEY_FILE)) {
  console.error(`
❌  GSC_KEY_FILE não configurado ou arquivo não encontrado.

Configure em .env.local:
  GSC_KEY_FILE=/caminho/absoluto/para/service-account.json
  GSC_SITE_URL=https://trychattie.com/

Siga o guia de setup em docs/gsc-setup.md
`)
  process.exit(1)
}

// ─── Auth ───────────────────────────────────────────────────────────────────

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
})

const sc = google.searchconsole({ version: 'v1', auth })

// ─── Date helpers ───────────────────────────────────────────────────────────

function dateMinus(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

const TODAY         = dateMinus(0)
const PERIOD_END    = dateMinus(3)          // GSC has ~3 day lag
const PERIOD_START  = dateMinus(DAYS + 3)
const PREV_END      = dateMinus(DAYS + 3)
const PREV_START    = dateMinus(DAYS * 2 + 3)

// ─── API helpers ────────────────────────────────────────────────────────────

async function query(params) {
  const res = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: { rowLimit: 100, ...params },
  })
  return res.data.rows || []
}

// ─── Fetch all data in parallel ─────────────────────────────────────────────

console.log(`📊  Buscando dados GSC (${PERIOD_START} → ${PERIOD_END}) …`)

const [
  pagesCurrent,
  pagesPrev,
  queriesCurrent,
  queryPages,
] = await Promise.all([
  // Pages — current period
  query({
    startDate: PERIOD_START,
    endDate:   PERIOD_END,
    dimensions: ['page'],
  }),
  // Pages — previous period (for delta)
  query({
    startDate: PREV_START,
    endDate:   PREV_END,
    dimensions: ['page'],
  }),
  // Top queries — current period
  query({
    startDate: PERIOD_START,
    endDate:   PERIOD_END,
    dimensions: ['query'],
    rowLimit: 50,
  }),
  // Query + page combos (for CTR analysis)
  query({
    startDate: PERIOD_START,
    endDate:   PERIOD_END,
    dimensions: ['query', 'page'],
    rowLimit: 100,
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'page',
        operator: 'contains',
        expression: '/blog',
      }],
    }],
  }),
])

// ─── Build prev period map ───────────────────────────────────────────────────

const prevMap = {}
for (const row of pagesPrev) {
  prevMap[row.keys[0]] = row
}

// ─── Analysis ───────────────────────────────────────────────────────────────

// 1. All blog pages with metrics
const blogPages = pagesCurrent
  .filter(r => r.keys[0].includes('/blog') || r.keys[0].includes('/pt-br'))
  .map(r => {
    const url     = r.keys[0]
    const prev    = prevMap[url]
    const posDiff = prev ? (prev.position - r.position) : null  // positive = gained positions
    const clickDiff = prev ? (r.clicks - prev.clicks) : null
    return {
      url,
      clicks:      r.clicks,
      impressions: r.impressions,
      ctr:         r.ctr,
      position:    r.position,
      posDiff,
      clickDiff,
    }
  })
  .sort((a, b) => b.impressions - a.impressions)

// 2. CTR opportunities: impressions >= 50, CTR < 4%, position <= 20
const ctrOpportunities = blogPages
  .filter(p => p.impressions >= 50 && p.ctr < 0.04 && p.position <= 20)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 10)

// 3. Ranking gains (biggest position improvements)
const rankGains = blogPages
  .filter(p => p.posDiff !== null && p.posDiff > 1)
  .sort((a, b) => b.posDiff - a.posDiff)
  .slice(0, 5)

// 4. Ranking losses
const rankLosses = blogPages
  .filter(p => p.posDiff !== null && p.posDiff < -1)
  .sort((a, b) => a.posDiff - b.posDiff)
  .slice(0, 5)

// 5. Top performers (by clicks)
const topPages = blogPages
  .filter(p => p.clicks > 0)
  .sort((a, b) => b.clicks - a.clicks)
  .slice(0, 10)

// 6. Pages with zero clicks (dormant content)
const dormant = blogPages
  .filter(p => p.clicks === 0 && p.impressions >= 20)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 10)

// 7. Query opportunities: queries appearing but with no dedicated post
const queryOpportunities = queriesCurrent
  .filter(q => q.impressions >= 30 && q.position > 5)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 15)

// 8. Title suggestions: queries with high impressions but CTR < 2%
const titleOpportunities = queryPages
  .filter(r => r.keys && r.impressions >= 30 && r.ctr < 0.02)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 10)

// ─── Totals ─────────────────────────────────────────────────────────────────

const totalClicks      = blogPages.reduce((s, p) => s + p.clicks, 0)
const totalImpressions = blogPages.reduce((s, p) => s + p.impressions, 0)
const avgCtr           = totalImpressions > 0 ? totalClicks / totalImpressions : 0
const avgPosition      = blogPages.length > 0
  ? blogPages.reduce((s, p) => s + p.position, 0) / blogPages.length
  : 0

// ─── Format helpers ─────────────────────────────────────────────────────────

const pct   = (n) => `${(n * 100).toFixed(1)}%`
const pos   = (n) => n.toFixed(1)
const slug  = (url) => url.replace('https://trychattie.com', '') || '/'
const diff  = (n) => n === null ? '—' : n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1)

// ─── Generate report ────────────────────────────────────────────────────────

const lines = []
const h = (...args) => lines.push(...args, '')

h(
  `# GSC Insights — ${TODAY}`,
  `> Período analisado: **${PERIOD_START} → ${PERIOD_END}** (${DAYS} dias)`,
  `> Comparativo vs período anterior: **${PREV_START} → ${PREV_END}**`,
  '',
  '---',
)

// Overview
h(
  '## Visão Geral do Blog',
  '',
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Total de cliques | ${totalClicks.toLocaleString()} |`,
  `| Total de impressões | ${totalImpressions.toLocaleString()} |`,
  `| CTR médio | ${pct(avgCtr)} |`,
  `| Posição média | ${pos(avgPosition)} |`,
  `| Páginas com dados | ${blogPages.length} |`,
)

// CTR Opportunities
h(
  '## 🎯 Oportunidades de CTR (impressões altas, cliques baixos)',
  '',
  '_Esses posts já aparecem no Google — precisam de title/description mais forte._',
  '',
  `| Página | Impressões | Cliques | CTR | Posição |`,
  `|--------|-----------|---------|-----|---------|`,
  ...ctrOpportunities.map(p =>
    `| ${slug(p.url)} | ${p.impressions} | ${p.clicks} | ${pct(p.ctr)} | ${pos(p.position)} |`
  ),
)

// Query Opportunities
h(
  '## 📝 Queries sem post dedicado (candidatas a novo conteúdo)',
  '',
  '_O domínio aparece nessas buscas mas provavelmente sem post específico._',
  '',
  `| Query | Impressões | Cliques | CTR | Posição |`,
  `|-------|-----------|---------|-----|---------|`,
  ...queryOpportunities.map(r =>
    `| ${r.keys[0]} | ${r.impressions} | ${r.clicks} | ${pct(r.ctr)} | ${pos(r.position)} |`
  ),
)

// Top Pages
h(
  '## 🏆 Top 10 páginas por cliques',
  '',
  `| Página | Cliques | Impressões | CTR | Posição |`,
  `|--------|---------|-----------|-----|---------|`,
  ...topPages.map(p =>
    `| ${slug(p.url)} | ${p.clicks} | ${p.impressions} | ${pct(p.ctr)} | ${pos(p.position)} |`
  ),
)

// Ranking gains
if (rankGains.length) {
  h(
    '## 📈 Maiores subidas de ranking (vs período anterior)',
    '',
    `| Página | Posição atual | Variação |`,
    `|--------|--------------|---------|`,
    ...rankGains.map(p =>
      `| ${slug(p.url)} | ${pos(p.position)} | ${diff(p.posDiff)} posições |`
    ),
  )
}

// Ranking losses
if (rankLosses.length) {
  h(
    '## 📉 Maiores quedas de ranking (precisam de atualização)',
    '',
    `| Página | Posição atual | Variação |`,
    `|--------|--------------|---------|`,
    ...rankLosses.map(p =>
      `| ${slug(p.url)} | ${pos(p.position)} | ${diff(p.posDiff)} posições |`
    ),
  )
}

// Dormant content
if (dormant.length) {
  h(
    '## 💤 Conteúdo dormante (impressões mas zero cliques)',
    '',
    '_Candidatos para reescrita de title, otimização ou remoção._',
    '',
    `| Página | Impressões | Posição |`,
    `|--------|-----------|---------|`,
    ...dormant.map(p =>
      `| ${slug(p.url)} | ${p.impressions} | ${pos(p.position)} |`
    ),
  )
}

// Title optimization
if (titleOpportunities.length) {
  h(
    '## ✏️ Queries com CTR baixo no post (title/meta a revisar)',
    '',
    `| Query | Página | Impressões | CTR |`,
    `|-------|--------|-----------|-----|`,
    ...titleOpportunities.map(r =>
      `| ${r.keys[0]} | ${slug(r.keys[1])} | ${r.impressions} | ${pct(r.ctr)} |`
    ),
  )
}

// Action items
h(
  '---',
  '## ✅ Ações Recomendadas para Esta Sessão',
  '',
  '> Baseado nos dados acima, priorize nesta ordem:',
  '',
  ctrOpportunities.length > 0
    ? `1. **Reescrever title/description** de \`${slug(ctrOpportunities[0].url)}\` — ${ctrOpportunities[0].impressions} impressões com CTR de apenas ${pct(ctrOpportunities[0].ctr)}`
    : '1. Sem oportunidades críticas de CTR no momento.',
  rankLosses.length > 0
    ? `2. **Atualizar** \`${slug(rankLosses[0].url)}\` — caiu ${Math.abs(rankLosses[0].posDiff).toFixed(1)} posições`
    : '2. Sem quedas de ranking significativas.',
  queryOpportunities.length > 0
    ? `3. **Criar post** sobre "${queryOpportunities[0].keys[0]}" — ${queryOpportunities[0].impressions} impressões sem post dedicado`
    : '3. Sem queries sem post identificadas.',
  dormant.length > 0
    ? `4. **Revisar** \`${slug(dormant[0].url)}\` — ${dormant[0].impressions} impressões, 0 cliques`
    : '4. Sem conteúdo dormante crítico.',
)

h(
  '---',
  `_Gerado automaticamente por \`scripts/gsc-report.mjs\` em ${new Date().toLocaleString('pt-BR')}_`,
)

// ─── Write output ────────────────────────────────────────────────────────────

const outPath = path.join(ROOT, 'docs', 'gsc-insights.md')
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')

console.log(`
✅  Relatório gerado: docs/gsc-insights.md

Resumo rápido (${PERIOD_START} → ${PERIOD_END}):
  Cliques:       ${totalClicks.toLocaleString()}
  Impressões:    ${totalImpressions.toLocaleString()}
  CTR médio:     ${pct(avgCtr)}
  Posição média: ${pos(avgPosition)}
  Oport. CTR:    ${ctrOpportunities.length} páginas
  Queries novas: ${queryOpportunities.length} candidatas
  Quedas:        ${rankLosses.length} páginas
`)

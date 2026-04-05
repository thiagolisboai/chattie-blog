/**
 * Keyword Research — T4.16: enriquece o backlog com dados reais de SEO
 *
 * Problema: o backlog atual tem competição e prioridade definidos manualmente,
 * sem dados reais de volume de busca, dificuldade ou CPC.
 *
 * Solução:
 *   1. Lê keywords pendentes do backlog
 *   2. Busca métricas via SEMrush API (primário) ou DataForSEO (alternativo)
 *   3. Atualiza o backlog com volume, dificuldade e CPC reais
 *   4. Gera docs/keyword-research.md com relatório completo
 *
 * Uso:
 *   node scripts/keyword-research.mjs             (todas as pendentes)
 *   node scripts/keyword-research.mjs --limit=10  (máximo 10 keywords)
 *   node scripts/keyword-research.mjs --dry-run   (sem salvar)
 *
 * Requer (pelo menos um):
 *   SEMRUSH_API_KEY   — SEMrush API key (plano básico ~$120/mês, free trial disponível)
 *   DATAFORSEO_LOGIN  — DataForSEO login (alternativa mais barata ~$0.0005/keyword)
 *   DATAFORSEO_PASS   — DataForSEO password
 *
 * Sem nenhuma chave: roda em modo estimativa (usa dados do Brave Search como proxy)
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { braveSearch } from './brave-search.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

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

const SEMRUSH_KEY     = process.env.SEMRUSH_API_KEY
const DFS_LOGIN       = process.env.DATAFORSEO_LOGIN
const DFS_PASS        = process.env.DATAFORSEO_PASS
const DRY_RUN         = process.argv.includes('--dry-run')
const LIMIT           = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '20')

// ─── SEMrush API ──────────────────────────────────────────────────────────────

/**
 * Fetch keyword metrics from SEMrush API.
 * Uses "phrase_this" endpoint — 1 API unit per call.
 * Free trial: 10 units/day. Paid plans start at ~$120/month.
 *
 * @param {string} keyword
 * @param {string} database — 'br' for Brazilian Portuguese
 * @returns {Promise<{volume: number, difficulty: number, cpc: number} | null>}
 */
async function semrushFetch(keyword, database = 'br') {
  const params = new URLSearchParams({
    type: 'phrase_this',
    key: SEMRUSH_KEY,
    phrase: keyword,
    database,
    export_columns: 'Ph,Nq,Cp,Co,Kd',
  })

  return new Promise((resolve) => {
    const req = https.get(
      `https://api.semrush.com/?${params}`,
      (res) => {
        const chunks = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => {
          try {
            const text = Buffer.concat(chunks).toString()
            // Response is CSV: Ph;Nq;Cp;Co;Kd\nkeyword;volume;cpc;comp;difficulty
            const lines = text.trim().split('\n')
            if (lines.length < 2) { resolve(null); return }
            const [ph, nq, cp, co, kd] = lines[1].split(';')
            resolve({
              volume:     parseInt(nq) || 0,
              cpc:        parseFloat(cp) || 0,
              competition: parseFloat(co) || 0,
              difficulty: parseInt(kd) || 0,
              source:     'semrush',
            })
          } catch { resolve(null) }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.setTimeout(10000, () => { req.destroy(); resolve(null) })
  })
}

// ─── DataForSEO API ───────────────────────────────────────────────────────────

/**
 * Fetch keyword metrics from DataForSEO API.
 * Much cheaper than SEMrush: ~$0.0005 per keyword.
 * Endpoint: Keywords Data API → Google → Search Volume
 *
 * @param {string} keyword
 * @returns {Promise<{volume: number, difficulty: number, cpc: number} | null>}
 */
async function dataForSeoFetch(keyword) {
  const auth = Buffer.from(`${DFS_LOGIN}:${DFS_PASS}`).toString('base64')
  const body = JSON.stringify([{
    keywords: [keyword],
    language_name: 'Portuguese',
    location_name: 'Brazil',
  }])

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.dataforseo.com',
      path: '/v3/keywords_data/google_ads/search_volume/live',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          const item = json.tasks?.[0]?.result?.[0]?.items?.[0]
          if (!item) { resolve(null); return }
          resolve({
            volume:     item.search_volume || 0,
            cpc:        item.cpc || 0,
            competition: item.competition || 0,
            difficulty: item.keyword_info?.keyword_difficulty || 0,
            source:     'dataforseo',
          })
        } catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(15000, () => { req.destroy(); resolve(null) })
    req.write(body)
    req.end()
  })
}

// ─── Brave Search estimation (fallback) ───────────────────────────────────────

/**
 * Estimate keyword metrics from Brave Search results when no API is available.
 *
 * Heuristic:
 *   - More results = higher volume (rough proxy)
 *   - More commercial results (ads-like) = higher CPC
 *   - Estimated difficulty based on domain authority of top results
 */
async function braveEstimate(keyword) {
  try {
    const results = await braveSearch(keyword, 5)
    if (results.length === 0) return null

    // Difficulty: if top results are from authority domains (linkedin, hubspot, etc.)
    const authorityDomains = ['linkedin.com', 'hubspot.com', 'salesforce.com', 'forbes.com',
                               'g2.com', 'gartner.com', 'mckinsey.com']
    const authorityCount = results.filter(r =>
      authorityDomains.some(d => r.url?.includes(d))
    ).length

    const difficulty = Math.min(Math.round((authorityCount / results.length) * 80) + 20, 90)

    // Volume estimation: very rough, based on position 1 CTR models
    // Just a placeholder — real volume requires a paid API
    const volumeEstimate = difficulty > 60 ? 500 : difficulty > 40 ? 200 : 100

    return {
      volume:     volumeEstimate,
      cpc:        0,      // cannot estimate without paid API
      competition: 0,
      difficulty,
      source:     'brave-estimate',
    }
  } catch {
    return null
  }
}

// ─── Unified keyword metrics fetch ───────────────────────────────────────────

async function fetchKeywordMetrics(keyword) {
  if (SEMRUSH_KEY) {
    const data = await semrushFetch(keyword)
    if (data) return data
  }

  if (DFS_LOGIN && DFS_PASS) {
    const data = await dataForSeoFetch(keyword)
    if (data) return data
  }

  // Fallback: estimate from Brave Search
  return braveEstimate(keyword)
}

// ─── Difficulty label ─────────────────────────────────────────────────────────

function difficultyLabel(score) {
  if (score >= 70) return 'Alta'
  if (score >= 40) return 'Média'
  return 'Baixa'
}

function volumeLabel(vol) {
  if (vol >= 1000) return 'Alto'
  if (vol >= 200)  return 'Médio'
  return 'Baixo'
}

// ─── Read backlog keywords ────────────────────────────────────────────────────

function readBacklog() {
  const p = path.join(ROOT, 'docs', 'keyword-backlog.md')
  if (!fs.existsSync(p)) return { raw: '', rows: [] }

  const raw = fs.readFileSync(p, 'utf-8')
  const rows = raw.split('\n')
    .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Keyword'))
    .map((l, idx) => {
      const cols = l.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length < 5) return null
      return {
        keyword:    cols[0],
        intent:     cols[1],
        competition: cols[2],
        priority:   cols[3],
        status:     cols[4],
        _line:      l,
        _idx:       idx,
      }
    })
    .filter(Boolean)

  return { raw, rows }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const apiMode = SEMRUSH_KEY ? 'SEMrush' : (DFS_LOGIN ? 'DataForSEO' : 'Brave Search (estimativa)')
console.log(`\n🔍  T4.16: Keyword Research — fonte: ${apiMode}`)
if (!SEMRUSH_KEY && !DFS_LOGIN) {
  console.log('   ⚠️  Nenhuma API key configurada. Usando estimativas via Brave Search.')
  console.log('   Para dados reais: adicione SEMRUSH_API_KEY ou DATAFORSEO_LOGIN em .env.local')
}

const { raw: backlogRaw, rows } = readBacklog()
const pending = rows.filter(r => r.status.toLowerCase() === 'pendente').slice(0, LIMIT)

console.log(`   ${pending.length} keywords pendentes para analisar (máximo: ${LIMIT})`)

if (pending.length === 0) {
  console.log('   Nenhuma keyword pendente no backlog.')
  process.exit(0)
}

const results = []

for (let i = 0; i < pending.length; i++) {
  const kw = pending[i]
  process.stdout.write(`   [${i + 1}/${pending.length}] "${kw.keyword}"... `)

  const metrics = await fetchKeywordMetrics(kw.keyword)

  if (metrics) {
    const volLabel  = volumeLabel(metrics.volume)
    const diffLabel = difficultyLabel(metrics.difficulty)
    console.log(`vol=${metrics.volume} dif=${metrics.difficulty} (${metrics.source})`)

    results.push({
      keyword:    kw.keyword,
      volume:     metrics.volume,
      difficulty: metrics.difficulty,
      cpc:        metrics.cpc,
      competition: metrics.competition,
      source:     metrics.source,
      // Suggested updates based on data
      suggestedCompetition: diffLabel,
      suggestedPriority:    volLabel === 'Alto' && diffLabel === 'Baixa' ? 'Alta'
                          : volLabel === 'Médio' && diffLabel === 'Baixa' ? 'Alta'
                          : volLabel === 'Alto' && diffLabel === 'Média' ? 'Média'
                          : kw.priority, // keep existing
    })
  } else {
    console.log('(sem dados)')
    results.push({ keyword: kw.keyword, volume: null, difficulty: null, source: 'none' })
  }

  // Rate limiting
  if (i < pending.length - 1) await new Promise(r => setTimeout(r, 1200))
}

// ─── Generate report ──────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]
const reportLines = [
  `# Keyword Research Report — ${today}`,
  ``,
  `> Fonte: **${apiMode}** | Analisadas: **${results.length}** keywords`,
  ``,
  `| Keyword | Volume | Dificuldade | CPC (R$) | Prioridade Sugerida | Competição Sugerida |`,
  `|---------|--------|------------|---------|--------------------|--------------------|`,
  ...results.map(r => r.volume !== null
    ? `| ${r.keyword} | ${r.volume.toLocaleString()} | ${r.difficulty} | R$${r.cpc.toFixed(2)} | ${r.suggestedPriority} | ${r.suggestedCompetition} |`
    : `| ${r.keyword} | — | — | — | — | — |`
  ),
  ``,
  `## Oportunidades de ouro (Alto volume + Baixa dificuldade)`,
  ``,
  ...results
    .filter(r => r.volume >= 200 && r.difficulty <= 40)
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .map(r => `- **${r.keyword}** — vol ${r.volume.toLocaleString()}, dif ${r.difficulty}`)
    .concat(results.filter(r => r.volume >= 200 && r.difficulty <= 40).length === 0
      ? ['_Nenhuma oportunidade de ouro identificada nesta rodada_']
      : []),
  ``,
  `---`,
  `_Gerado por \`scripts/keyword-research.mjs\` em ${today}_`,
  `_Para integrar com SEMrush: adicione SEMRUSH_API_KEY em .env.local (Settings > Secrets em CI)_`,
]

if (!DRY_RUN) {
  fs.writeFileSync(path.join(ROOT, 'docs', 'keyword-research.md'), reportLines.join('\n'), 'utf-8')
  console.log(`\n✅  Relatório salvo em: docs/keyword-research.md`)

  // Update backlog competition/priority based on real data (only if not estimate)
  const hasRealData = results.some(r => r.source === 'semrush' || r.source === 'dataforseo')
  if (hasRealData) {
    let updatedRaw = backlogRaw
    let updatesCount = 0
    for (const r of results) {
      if (!r.suggestedCompetition || r.source === 'none') continue
      const originalRow = rows.find(row => row.keyword === r.keyword)
      if (!originalRow) continue
      // Update competition and priority columns
      const newRow = `| ${r.keyword} | ${originalRow.intent} | ${r.suggestedCompetition} | ${r.suggestedPriority} | ${originalRow.status} |`
      if (newRow !== originalRow._line) {
        updatedRaw = updatedRaw.replace(originalRow._line, newRow)
        updatesCount++
      }
    }
    if (updatesCount > 0) {
      fs.writeFileSync(path.join(ROOT, 'docs', 'keyword-backlog.md'), updatedRaw, 'utf-8')
      console.log(`   ${updatesCount} entradas do backlog atualizadas com dados reais`)
    }
  }
} else {
  console.log('\n--- DRY RUN ---')
  console.log(reportLines.join('\n'))
}

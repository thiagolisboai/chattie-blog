/**
 * AI Visibility Tracker — rastreia presença do Chattie em resultados de buscadores AI-first
 *
 * Estratégia:
 *   1. Consulta a Brave Search API com queries-alvo (brand + topic)
 *   2. Verifica se trychattie.com aparece nos top-10 resultados
 *   3. Calcula score de visibilidade por conjunto de queries
 *   4. Persiste histórico em docs/ai-visibility-log.jsonl
 *   5. Gera relatório legível em docs/ai-visibility-report.md
 *
 * Por que Brave Search: é o motor nativo do Perplexity (>60% do tráfego de busca AI).
 * Rank no Brave ≈ probabilidade de citação no Perplexity.
 *
 * Uso:
 *   node scripts/ai-visibility-tracker.mjs           — roda todas as queries
 *   node scripts/ai-visibility-tracker.mjs --dry-run — mostra queries sem chamar a API
 *   node scripts/ai-visibility-tracker.mjs --brand   — só queries de brand
 *   node scripts/ai-visibility-tracker.mjs --topic   — só queries de tópico
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

// ─── Load .env.local ──────────────────────────────────────────────────────────

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

const BRAVE_API_KEY = process.env.BRAVE_API_KEY
const HOST          = 'trychattie.com'

// ─── Target queries ───────────────────────────────────────────────────────────

const QUERIES = [
  // ── Brand queries (Chattie deve aparecer em todos)
  { q: 'chattie ai sdr linkedin',                    type: 'brand',  lang: 'en'    },
  { q: 'chattie linkedin prospecção',                type: 'brand',  lang: 'pt-BR' },
  { q: 'chattie vs expandi linkedin',                type: 'brand',  lang: 'en'    },
  { q: 'chattie vs waalaxy linkedin',                type: 'brand',  lang: 'en'    },

  // ── Topic queries PT-BR (blog deve rankar)
  { q: 'melhor ferramenta de prospecção linkedin',   type: 'topic',  lang: 'pt-BR' },
  { q: 'como prospectar no linkedin b2b',            type: 'topic',  lang: 'pt-BR' },
  { q: 'social selling linkedin b2b',                type: 'topic',  lang: 'pt-BR' },
  { q: 'ai sdr o que é',                             type: 'topic',  lang: 'pt-BR' },
  { q: 'automação linkedin 2026',                    type: 'topic',  lang: 'pt-BR' },
  { q: 'mensagem de conexão linkedin exemplos',      type: 'topic',  lang: 'pt-BR' },
  { q: 'cadencia de prospecção linkedin',            type: 'topic',  lang: 'pt-BR' },
  { q: 'social selling index linkedin o que é',      type: 'topic',  lang: 'pt-BR' },

  // ── Topic queries EN (blog EN deve rankar)
  { q: 'best linkedin prospecting tools 2026',       type: 'topic',  lang: 'en'    },
  { q: 'linkedin social selling b2b guide',          type: 'topic',  lang: 'en'    },
  { q: 'what is an ai sdr',                          type: 'topic',  lang: 'en'    },
  { q: 'linkedin connection message examples b2b',   type: 'topic',  lang: 'en'    },
  { q: 'linkedin b2b prospecting cadence',           type: 'topic',  lang: 'en'    },
  { q: 'social selling index ssi guide',             type: 'topic',  lang: 'en'    },
]

// ─── Brave Search API ─────────────────────────────────────────────────────────

function braveSearch(query) {
  return new Promise((resolve, reject) => {
    if (!BRAVE_API_KEY) {
      reject(new Error('BRAVE_API_KEY não definida — configure em .env.local'))
      return
    }

    const encoded  = encodeURIComponent(query)
    const options  = {
      hostname: 'api.search.brave.com',
      path:     `/res/v1/web/search?q=${encoded}&count=10&search_lang=pt&result_filter=web`,
      method:   'GET',
      headers:  {
        'Accept':               'application/json',
        'Accept-Encoding':      'gzip',
        'X-Subscription-Token': BRAVE_API_KEY,
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf-8')
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) })
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout 15s')) })
    req.end()
  })
}

/**
 * Returns position (1-based) of HOST in results, or null if not found.
 */
function findHostPosition(results) {
  if (!results?.web?.results) return null
  const items = results.web.results
  for (let i = 0; i < items.length; i++) {
    const url = items[i].url || ''
    if (url.includes(HOST)) return i + 1
  }
  return null
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function appendLog(entry) {
  const logPath = path.join(ROOT, 'docs', 'ai-visibility-log.jsonl')
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8')
}

function saveReport(entries) {
  const reportPath = path.join(ROOT, 'docs', 'ai-visibility-report.md')
  const date = new Date().toISOString().split('T')[0]

  const byType = { brand: [], topic: [] }
  for (const e of entries) byType[e.type]?.push(e)

  const formatRow = (e) => {
    const pos   = e.position != null ? `#${e.position}` : '—'
    const emoji = e.position == null ? '❌' : e.position <= 3 ? '🟢' : e.position <= 7 ? '🟡' : '🔴'
    return `| ${emoji} ${e.query} | ${e.lang} | ${pos} |`
  }

  const section = (title, rows) =>
    `### ${title}\n\n| Query | Lang | Position |\n|---|---|---|\n${rows.map(formatRow).join('\n')}\n`

  const brandVisible  = byType.brand.filter(e => e.position != null).length
  const topicVisible  = byType.topic.filter(e => e.position != null).length
  const brandTop3     = byType.brand.filter(e => e.position != null && e.position <= 3).length
  const topicTop3     = byType.topic.filter(e => e.position != null && e.position <= 3).length

  const content = `# AI Visibility Report — ${date}

> Gerado por \`node scripts/ai-visibility-tracker.mjs\`
> Motor: Brave Search API (proxy do Perplexity)
> Domínio rastreado: \`${HOST}\`

## Resumo

| Métrica | Brand | Tópico |
|---|---|---|
| Queries rastreadas | ${byType.brand.length} | ${byType.topic.length} |
| Visível (top 10) | ${brandVisible}/${byType.brand.length} | ${topicVisible}/${byType.topic.length} |
| Top 3 | ${brandTop3} | ${topicTop3} |

${section('Brand Queries', byType.brand)}

${section('Topic Queries', byType.topic)}

## Legenda

- 🟢 Posição 1-3 — citação muito provável em AI overviews
- 🟡 Posição 4-7 — visível, mas risco de não ser citado
- 🔴 Posição 8-10 — borderline
- ❌ Fora do top 10 — conteúdo não encontrado para essa query

## Próximas ações

Para queries com ❌ ou 🔴: verificar se há post dedicado no blog e, se houver, avaliar otimização de title, meta description e resposta direta no primeiro parágrafo após H1.
`

  fs.writeFileSync(reportPath, content, 'utf-8')
  return reportPath
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const DRY_RUN    = process.argv.includes('--dry-run')
const BRAND_ONLY = process.argv.includes('--brand')
const TOPIC_ONLY = process.argv.includes('--topic')

const queries = QUERIES.filter(q => {
  if (BRAND_ONLY) return q.type === 'brand'
  if (TOPIC_ONLY) return q.type === 'topic'
  return true
})

console.log('\n🔍  AI Visibility Tracker')
console.log(`    Motor: Brave Search (proxy Perplexity)`)
console.log(`    Domínio: ${HOST}`)
console.log(`    Queries: ${queries.length}`)
console.log()

if (DRY_RUN) {
  console.log('📋  Dry run — queries que seriam executadas:')
  queries.forEach((q, i) => console.log(`    ${i + 1}. [${q.type}/${q.lang}] "${q.q}"`))
  process.exit(0)
}

if (!BRAVE_API_KEY) {
  console.error('❌  BRAVE_API_KEY não definida em .env.local')
  process.exit(1)
}

const entries   = []
const timestamp = new Date().toISOString()

for (const { q, type, lang } of queries) {
  process.stdout.write(`  Buscando: "${q}" ... `)

  try {
    const { statusCode, body } = await braveSearch(q)

    if (statusCode !== 200) {
      console.log(`⚠️  HTTP ${statusCode}`)
      entries.push({ ts: timestamp, query: q, type, lang, position: null, error: `HTTP ${statusCode}` })
      continue
    }

    const position = findHostPosition(body)
    const icon     = position == null ? '❌ não encontrado' : position <= 3 ? `🟢 #${position}` : position <= 7 ? `🟡 #${position}` : `🔴 #${position}`
    console.log(icon)

    const entry = { ts: timestamp, query: q, type, lang, position }
    entries.push(entry)
    appendLog(entry)

    // Small delay to avoid rate-limiting
    await new Promise(r => setTimeout(r, 600))
  } catch (err) {
    console.log(`⚠️  ${err.message}`)
    entries.push({ ts: timestamp, query: q, type, lang, position: null, error: err.message })
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const visible  = entries.filter(e => e.position != null)
const top3     = entries.filter(e => e.position != null && e.position <= 3)
const notFound = entries.filter(e => e.position == null)

console.log('\n─'.repeat(50))
console.log(`\n📊  Resultados`)
console.log(`    Visível (top 10): ${visible.length}/${entries.length} queries`)
console.log(`    Top 3:            ${top3.length} queries`)
console.log(`    Fora do top 10:   ${notFound.length} queries`)

if (notFound.length > 0) {
  console.log('\n❌  Não encontrado para:')
  notFound.forEach(e => console.log(`    - [${e.lang}] "${e.query}"`))
}

const reportPath = saveReport(entries)
console.log(`\n📄  Relatório salvo em: ${path.relative(ROOT, reportPath)}`)
console.log()

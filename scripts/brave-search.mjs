/**
 * Brave Search — wrapper para pesquisa de SERP
 *
 * Uso (CLI):
 *   node scripts/brave-search.mjs "keyword aqui"
 *   node scripts/brave-search.mjs "keyword" --count=10
 *
 * Uso (módulo):
 *   import { braveSearch } from './brave-search.mjs'
 *   const results = await braveSearch('keyword', 5)
 *
 * Retorna: Array de { title, url, description, position }
 */

import https from 'https'
import zlib from 'zlib'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

// ─── F2.4: In-process cache (lives for the duration of the Node.js process) ───
// Avoids re-fetching the same query twice within a single agent session.
// Key: "query::count" → Value: results array

const _cache = new Map()

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * @param {string} query
 * @param {number} count  Number of results (max 20 per request)
 * @returns {Promise<Array<{title: string, url: string, description: string, position: number}>>}
 */
export async function braveSearch(query, count = 5) {
  const cacheKey = `${query}::${count}`
  if (_cache.has(cacheKey)) {
    console.log(`   🗃️  Brave cache hit: "${query.slice(0, 50)}"`)
    return _cache.get(cacheKey)
  }
  const key = process.env.BRAVE_API_KEY
  if (!key) {
    console.warn('⚠️  BRAVE_API_KEY não configurado — retornando SERP vazia')
    return []
  }

  const params = new URLSearchParams({
    q: query,
    count: String(Math.min(count, 20)),
    search_lang: 'pt-br',
    country: 'BR',
    text_decorations: '0',
    spellcheck: '0',
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.search.brave.com',
      path: `/res/v1/web/search?${params}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': key,
      },
    }

    const req = https.get(options, (res) => {
      const chunks = []
      const encoding = res.headers['content-encoding']
      const stream = encoding === 'gzip' ? res.pipe(zlib.createGunzip())
                   : encoding === 'br'   ? res.pipe(zlib.createBrotliDecompress())
                   : res
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf-8')
          const json = JSON.parse(body)

          if (json.type === 'ErrorResponse' || json.error) {
            console.warn(`⚠️  Brave Search erro: ${json.message || json.error}`)
            resolve([])
            return
          }
          // Check for API-level error responses
          if (!json.web) {
            console.warn(`⚠️  Brave Search: resposta inesperada — ${JSON.stringify(json).slice(0,100)}`)
            resolve([])
            return
          }

          const webResults = json.web?.results || []
          const results = webResults.slice(0, count).map((r, i) => ({
            position: i + 1,
            title: r.title || '',
            url: r.url || '',
            description: r.description || r.extra_snippets?.[0] || '',
          }))

          _cache.set(cacheKey, results)
          resolve(results)
        } catch (e) {
          console.warn(`⚠️  Brave Search parse error: ${e.message}`)
          resolve([])
        }
      })
    })

    req.on('error', (e) => {
      console.warn(`⚠️  Brave Search request error: ${e.message}`)
      resolve([]) // graceful degradation — don't crash the session
    })

    req.setTimeout(10000, () => {
      req.destroy()
      console.warn('⚠️  Brave Search timeout — continuando sem dados SERP')
      resolve([])
    })
  })
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const query = process.argv[2]
  if (!query) {
    console.error('Uso: node scripts/brave-search.mjs "keyword"')
    process.exit(1)
  }

  const countArg = process.argv.find(a => a.startsWith('--count='))
  const count = countArg ? parseInt(countArg.split('=')[1]) : 5

  console.log(`🔍  Pesquisando: "${query}" (${count} resultados)\n`)

  const results = await braveSearch(query, count)

  if (results.length === 0) {
    console.log('Nenhum resultado encontrado (verifique BRAVE_API_KEY).')
    process.exit(0)
  }

  results.forEach((r) => {
    console.log(`${r.position}. ${r.title}`)
    console.log(`   ${r.url}`)
    console.log(`   ${r.description?.slice(0, 120)}`)
    console.log()
  })
}

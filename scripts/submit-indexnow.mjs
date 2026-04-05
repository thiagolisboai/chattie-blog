/**
 * Submit IndexNow — notifica Bing, Yandex e outros motores instantaneamente
 *
 * IndexNow é um protocolo aberto: uma submissão notifica todos os motores participantes.
 * Complementa o Google Indexing API (submit-indexing.mjs) com cobertura de Bing/Yandex.
 *
 * PRÉ-REQUISITO (já feito):
 *   - Arquivo de chave hospedado em: https://trychattie.com/{INDEXNOW_KEY}.txt
 *   - Conteúdo do arquivo: a própria chave (uma linha)
 *
 * Uso (CLI):
 *   node scripts/submit-indexnow.mjs --slug=meu-post-slug
 *   node scripts/submit-indexnow.mjs --slug=meu-slug --lang=en
 *   node scripts/submit-indexnow.mjs --url=https://trychattie.com/pt-br/blog/meu-slug
 *
 * Uso (módulo):
 *   import { submitIndexNow } from './submit-indexnow.mjs'
 *   await submitIndexNow(['https://trychattie.com/pt-br/blog/slug'])
 *
 * Variáveis de ambiente:
 *   INDEXNOW_KEY — chave gerada (obrigatória)
 */

import https from 'https'
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

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'baf709637be156f6ff9c5959bddb4b8d'
const HOST = 'trychattie.com'
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`

// ─── Core submission ──────────────────────────────────────────────────────────

/**
 * Submete uma lista de URLs ao IndexNow (Bing endpoint — propaga para todos os motores).
 * @param {string[]} urls
 * @returns {Promise<'ok' | 'error'>}
 */
export async function submitIndexNow(urls) {
  if (!urls || urls.length === 0) return 'ok'

  const payload = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  })

  return new Promise((resolve) => {
    let settled = false
    const done = (v) => { if (!settled) { settled = true; resolve(v) } }

    const options = {
      hostname: 'api.indexnow.org',
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
      },
    }

    const req = https.request(options, (res) => {
      // HTTP 200 or 202 = accepted
      if (res.statusCode === 200 || res.statusCode === 202) {
        console.log(`✅  IndexNow: ${urls.length} URL(s) submetida(s) (HTTP ${res.statusCode})`)
        urls.forEach(u => console.log(`    - ${u}`))
        logSubmission(urls, 'submitted')
        done('ok')
      } else if (res.statusCode === 400) {
        console.warn(`⚠️  IndexNow: requisição inválida (HTTP 400) — verifique o payload`)
        done('error')
      } else if (res.statusCode === 403) {
        console.warn(`⚠️  IndexNow: chave inválida ou arquivo de chave inacessível (HTTP 403)`)
        console.warn(`   Verifique: ${KEY_LOCATION}`)
        done('error')
      } else if (res.statusCode === 422) {
        console.warn(`⚠️  IndexNow: URLs inválidas na lista (HTTP 422)`)
        done('error')
      } else if (res.statusCode === 429) {
        console.warn(`⚠️  IndexNow: rate limit atingido (HTTP 429) — tente novamente mais tarde`)
        done('error')
      } else {
        console.warn(`⚠️  IndexNow: resposta inesperada HTTP ${res.statusCode}`)
        done('error')
      }
      res.resume() // drain response so connection closes cleanly
    })

    req.on('error', (e) => {
      console.warn(`⚠️  IndexNow: erro de rede — ${e.message}`)
      done('error')
    })

    req.setTimeout(10000, () => {
      if (!settled) {
        req.destroy()
        console.warn('⚠️  IndexNow: timeout (10s)')
        done('error')
      }
    })

    req.write(payload)
    req.end()
  })
}

// ─── Log helper ───────────────────────────────────────────────────────────────

function logSubmission(urls, status) {
  try {
    const entry = { ts: new Date().toISOString(), urls, status }
    const logPath = path.join(ROOT, 'docs', 'indexnow-log.jsonl')
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8')
  } catch { /* nao bloquear */ }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slugArg = process.argv.find(a => a.startsWith('--slug='))
  const urlArg  = process.argv.find(a => a.startsWith('--url='))
  const langArg = process.argv.find(a => a.startsWith('--lang='))
  const lang    = langArg ? langArg.split('=')[1] : 'pt'

  let urls = []

  if (urlArg) {
    urls = [urlArg.split('=').slice(1).join('=')]
  } else if (slugArg) {
    const slug = slugArg.split('=').slice(1).join('=')
    if (lang === 'en') {
      urls = [`https://${HOST}/blog/${slug}`]
    } else {
      urls = [`https://${HOST}/pt-br/blog/${slug}`]
    }
  } else {
    console.error('Uso: node scripts/submit-indexnow.mjs --slug=meu-slug')
    console.error('     node scripts/submit-indexnow.mjs --slug=meu-slug --lang=en')
    console.error('     node scripts/submit-indexnow.mjs --url=https://...')
    process.exit(1)
  }

  console.log(`📡  Submetendo ao IndexNow...`)
  const result = await submitIndexNow(urls)
  process.exit(result === 'ok' ? 0 : 1)
}

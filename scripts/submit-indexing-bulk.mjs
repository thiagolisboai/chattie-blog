/**
 * Submit Indexing Bulk — submete todos os posts PT-BR e EN à Google Indexing API
 *
 * A Indexing API tem limite de 200 requisições/dia por service account.
 * Este script submete com delay de 500ms entre requisições para evitar rate limit.
 *
 * Uso:
 *   node scripts/submit-indexing-bulk.mjs           — todos os posts
 *   node scripts/submit-indexing-bulk.mjs --pt-only — só PT-BR
 *   node scripts/submit-indexing-bulk.mjs --en-only — só EN
 *   node scripts/submit-indexing-bulk.mjs --dry-run — lista URLs sem submeter
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BASE = 'https://trychattie.com'

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

// ─── Args ─────────────────────────────────────────────────────────────────────

const DRY_RUN  = process.argv.includes('--dry-run')
const PT_ONLY  = process.argv.includes('--pt-only')
const EN_ONLY  = process.argv.includes('--en-only')
const KEY_FILE = process.env.GSC_KEY_FILE

// ─── Validate setup ───────────────────────────────────────────────────────────

if (!KEY_FILE || !fs.existsSync(KEY_FILE)) {
  console.warn('⚠️  GSC_KEY_FILE não configurado — pulando indexing bulk submission')
  process.exit(0)
}

// ─── Collect URLs ────────────────────────────────────────────────────────────

function getSlugs(dir) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full)
    .filter(f => f.endsWith('.mdx') && f !== 'teste.mdx')
    .map(f => f.replace('.mdx', ''))
}

const ptSlugs = (!EN_ONLY) ? getSlugs('content/blog')    : []
const enSlugs = (!PT_ONLY) ? getSlugs('content/blog-en') : []

const urls = [
  ...ptSlugs.map(s => `${BASE}/pt-br/blog/${s}`),
  ...enSlugs.map(s => `${BASE}/blog/${s}`),
]

console.log(`🔍  Google Indexing API — Bulk Submission`)
console.log(`    PT-BR: ${ptSlugs.length} posts`)
console.log(`    EN:    ${enSlugs.length} posts`)
console.log(`    Total: ${urls.length} URLs`)
console.log()

if (DRY_RUN) {
  console.log('🔍  Dry run — URLs que seriam submetidas:')
  urls.forEach((u, i) => console.log(`    ${i + 1}. ${u}`))
  process.exit(0)
}

// ─── Submit ──────────────────────────────────────────────────────────────────

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/indexing'],
})

const indexing = google.indexing({ version: 'v3', auth })

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const results = { ok: 0, failed: 0, errors: [] }

for (let i = 0; i < urls.length; i++) {
  const url = urls[i]
  try {
    const res = await indexing.urlNotifications.publish({
      requestBody: { url, type: 'URL_UPDATED' },
    })
    const notifyTime = res.data.urlNotificationMetadata?.latestUpdate?.notifyTime || 'n/a'
    console.log(`  ✅  [${i + 1}/${urls.length}] ${url} — ${notifyTime}`)
    results.ok++

    // Log each successful submission
    const entry = { ts: new Date().toISOString(), url, type: 'URL_UPDATED', status: 'submitted' }
    const logPath = path.join(ROOT, 'docs', 'indexing-log.jsonl')
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8')

    // Delay between requests to avoid rate limit (200 req/day = ~1 req/7.2 min theoretical)
    // In practice, Indexing API allows burst — 500ms is sufficient for CI runs
    if (i < urls.length - 1) await sleep(500)

  } catch (err) {
    const message = err.message || String(err)
    console.warn(`  ⚠️  [${i + 1}/${urls.length}] ${url} — ${message.slice(0, 100)}`)
    results.failed++
    results.errors.push({ url, error: message.slice(0, 200) })

    // Fatal auth errors: stop early (no point continuing if not authorized)
    if (message.includes('403') || message.includes('Forbidden')) {
      console.warn()
      console.warn('⛔  Erro de permissão — interrompendo. Service account precisa ser Proprietária no GSC.')
      break
    }
  }
}

console.log()
console.log(`📊  Resultado: ${results.ok} OK, ${results.failed} falhas`)
if (results.errors.length > 0) {
  console.log('    Falhas:')
  results.errors.forEach(e => console.log(`      - ${e.url}: ${e.error}`))
}

process.exit(results.ok > 0 ? 0 : 1)

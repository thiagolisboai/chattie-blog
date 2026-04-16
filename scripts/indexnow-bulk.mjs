/**
 * IndexNow Bulk — submete todas as URLs do blog PT-BR e EN de uma vez
 *
 * Uso:
 *   node scripts/indexnow-bulk.mjs           — submete todos os posts
 *   node scripts/indexnow-bulk.mjs --pt-only — só PT-BR
 *   node scripts/indexnow-bulk.mjs --en-only — só EN
 *   node scripts/indexnow-bulk.mjs --dry-run — mostra URLs sem submeter
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { submitIndexNow } from './submit-indexnow.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const BASE      = 'https://trychattie.com'

const DRY_RUN  = process.argv.includes('--dry-run')
const PT_ONLY  = process.argv.includes('--pt-only')
const EN_ONLY  = process.argv.includes('--en-only')

// ─── Collect slugs ────────────────────────────────────────────────────────────

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

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log(`📡  IndexNow Bulk Submission`)
console.log(`    PT-BR: ${ptSlugs.length} posts`)
console.log(`    EN:    ${enSlugs.length} posts`)
console.log(`    Total: ${urls.length} URLs`)
console.log()

if (DRY_RUN) {
  console.log('🔍  Dry run — URLs que seriam submetidas:')
  urls.forEach((u, i) => console.log(`    ${i + 1}. ${u}`))
  process.exit(0)
}

const result = await submitIndexNow(urls)
// Never fail the build — IndexNow is best-effort (network hiccup ≠ broken deploy)
if (result !== 'ok') {
  console.warn('⚠️  IndexNow submission failed — deploy will continue. Resubmit manually with: node scripts/indexnow-bulk.mjs')
}
process.exit(0)

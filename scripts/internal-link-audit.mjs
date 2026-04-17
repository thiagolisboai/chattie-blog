/**
 * Internal Link Audit — verifica se cada post tem os 2-3 links internos obrigatórios
 *
 * O CLAUDE.md exige que todo post inclua 2-3 links internos para outros posts do blog.
 * Links internos distribuem autoridade entre posts e ajudam LLMs a entender a estrutura
 * topical do site.
 *
 * Uso:
 *   node scripts/internal-link-audit.mjs            — audita todos os posts
 *   node scripts/internal-link-audit.mjs --pt-only  — só PT-BR
 *   node scripts/internal-link-audit.mjs --en-only  — só EN
 *   node scripts/internal-link-audit.mjs --min=3    — exige mínimo de 3 links (padrão: 2)
 *   node scripts/internal-link-audit.mjs --slug=meu-slug
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

// ─── Config ──────────────────────────────────────────────────────────────────

const minArg    = process.argv.find(a => a.startsWith('--min='))
const MIN_LINKS = minArg ? parseInt(minArg.split('=')[1]) : 2

const slugArg    = process.argv.find(a => a.startsWith('--slug='))
const filterSlug = slugArg ? slugArg.split('=')[1] : null
const PT_ONLY    = process.argv.includes('--pt-only')
const EN_ONLY    = process.argv.includes('--en-only')

const DIRS = [
  ...(EN_ONLY  ? [] : [{ dir: 'content/blog',    lang: 'pt-BR', internalPrefixes: ['/pt-br/blog/'] }]),
  ...(PT_ONLY  ? [] : [{ dir: 'content/blog-en', lang: 'en',   internalPrefixes: ['/blog/']        }]),
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts all markdown links [text](url) from content.
 * Returns only those whose href starts with one of the given prefixes.
 */
function extractInternalLinks(content, prefixes) {
  const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g
  const links   = []
  let match

  while ((match = LINK_RE.exec(content)) !== null) {
    const href = match[2].split('#')[0].split('?')[0].trim()
    if (prefixes.some(p => href.startsWith(p))) {
      links.push({ text: match[1], href })
    }
  }

  // Deduplicate by href
  return [...new Map(links.map(l => [l.href, l])).values()]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

let totalPosts     = 0
let compliantPosts = 0
const underlinked  = []
const stats        = []

for (const { dir, lang, internalPrefixes } of DIRS) {
  const fullDir = path.join(ROOT, dir)
  if (!fs.existsSync(fullDir)) continue

  const files = fs.readdirSync(fullDir)
    .filter(f => f.endsWith('.mdx') && f !== 'teste.mdx')
    .sort()

  for (const file of files) {
    const slug = file.replace('.mdx', '')
    if (filterSlug && slug !== filterSlug) continue

    const raw     = fs.readFileSync(path.join(fullDir, file), 'utf-8').replace(/\r\n/g, '\n')
    const { content } = matter(raw)
    const links   = extractInternalLinks(content, internalPrefixes)

    totalPosts++

    if (links.length >= MIN_LINKS) {
      compliantPosts++
    } else {
      underlinked.push({ slug, lang, count: links.length, links })
    }

    stats.push({ slug, lang, count: links.length })
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const rate = totalPosts > 0 ? Math.round((compliantPosts / totalPosts) * 100) : 0

console.log('\n🔗  Internal Link Audit')
console.log('─'.repeat(60))
console.log(`Mínimo exigido:       ${MIN_LINKS} links internos por post`)
console.log(`Posts auditados:      ${totalPosts}`)
console.log(`Conformes:            ${compliantPosts}  (${rate}%)`)
console.log(`Abaixo do mínimo:     ${underlinked.length}  (${100 - rate}%)`)

if (underlinked.length > 0) {
  console.log('\n⚠️  Posts com links internos insuficientes:\n')

  // Sort: 0 links first, then ascending
  underlinked.sort((a, b) => a.count - b.count)

  for (const { slug, lang, count, links } of underlinked) {
    const icon = count === 0 ? '🔴' : '🟡'
    console.log(`  ${icon} [${lang}] ${slug}`)
    console.log(`     Links internos encontrados: ${count} (mínimo: ${MIN_LINKS})`)
    if (links.length > 0) {
      links.forEach(l => console.log(`     ✓ ${l.href}`))
    } else {
      console.log(`     → Nenhum link interno — adicionar referências a posts relacionados`)
    }
    console.log()
  }

  // Distribution summary
  const dist = { 0: 0, 1: 0, 2: 0, 3: 0, '4+': 0 }
  for (const { count } of stats) {
    if (count === 0) dist[0]++
    else if (count === 1) dist[1]++
    else if (count === 2) dist[2]++
    else if (count === 3) dist[3]++
    else dist['4+']++
  }
  console.log('📊  Distribuição de links internos:')
  console.log(`     0 links:  ${dist[0]} posts`)
  console.log(`     1 link:   ${dist[1]} posts`)
  console.log(`     2 links:  ${dist[2]} posts`)
  console.log(`     3 links:  ${dist[3]} posts`)
  console.log(`     4+ links: ${dist['4+']} posts`)
  console.log()

  process.exit(1)
} else {
  console.log(`\n✅  Todos os posts têm ≥${MIN_LINKS} links internos.\n`)
  process.exit(0)
}

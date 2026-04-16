/**
 * Snippable Answers Audit — verifica se cada H2 abre com resposta direta de ≤50 palavras
 *
 * Padrão AEO: o primeiro parágrafo após cada H2 deve dar a resposta de forma direta
 * antes de desenvolver. LLMs usam esses blocos como fonte de featured snippets.
 *
 * Uso:
 *   node scripts/snippable-audit.mjs            — audita todos os posts
 *   node scripts/snippable-audit.mjs --pt-only  — só PT-BR
 *   node scripts/snippable-audit.mjs --en-only  — só EN
 *   node scripts/snippable-audit.mjs --slug=meu-slug
 *   node scripts/snippable-audit.mjs --threshold=60  — limite customizado de palavras
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Config ──────────────────────────────────────────────────────────────────

const thresholdArg = process.argv.find(a => a.startsWith('--threshold='))
const THRESHOLD    = thresholdArg ? parseInt(thresholdArg.split('=')[1]) : 50

const slugArg    = process.argv.find(a => a.startsWith('--slug='))
const filterSlug = slugArg ? slugArg.split('=')[1] : null
const PT_ONLY    = process.argv.includes('--pt-only')
const EN_ONLY    = process.argv.includes('--en-only')

const DIRS = [
  ...(EN_ONLY  ? [] : [{ dir: 'content/blog',    lang: 'pt-BR', basePath: '/pt-br/blog' }]),
  ...(PT_ONLY  ? [] : [{ dir: 'content/blog-en', lang: 'en',   basePath: '/blog'        }]),
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Returns the first paragraph after each H2 heading.
 * Skips: H3+, code blocks, images, tables, horizontal rules.
 */
function extractFirstParaByH2(content) {
  const sections = []
  const parts = content.split(/^(?=## )/m)

  for (const part of parts) {
    if (!part.startsWith('## ')) continue

    const lines      = part.split('\n')
    const heading    = lines[0].replace(/^## /, '').trim()
    let   firstPara  = ''
    let   inCode     = false

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // Code fence toggle
      if (line.startsWith('```') || line.startsWith('~~~')) {
        inCode = !inCode
        continue
      }
      if (inCode) continue

      // Stop at next heading
      if (/^#{1,6}\s/.test(line)) break

      // Skip structural lines
      if (line.startsWith('![') || line.startsWith('|') || line.startsWith('---')) continue

      if (line.trim() === '') {
        // Blank line ends the first paragraph if we've started one
        if (firstPara) break
        continue
      }

      // Strip inline markdown for word counting
      const clean = line
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // images
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text
        .replace(/[*_`~>#]/g, '')                // formatting chars
        .trim()

      if (clean) firstPara += (firstPara ? ' ' : '') + clean
    }

    if (firstPara) {
      sections.push({
        heading,
        firstPara,
        words: wordCount(firstPara),
      })
    }
  }

  return sections
}

// ─── Main ─────────────────────────────────────────────────────────────────────

let totalH2s     = 0
let compliantH2s = 0
const violations = []

for (const { dir, lang, basePath } of DIRS) {
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
    const sections    = extractFirstParaByH2(content)

    const postViolations = []
    for (const { heading, firstPara, words } of sections) {
      totalH2s++
      if (words <= THRESHOLD) {
        compliantH2s++
      } else {
        postViolations.push({ heading, words, preview: firstPara.slice(0, 100) })
      }
    }

    if (postViolations.length > 0) {
      violations.push({
        slug,
        lang,
        url: `${basePath}/${slug}`,
        issues: postViolations,
      })
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const rate = totalH2s > 0 ? Math.round((compliantH2s / totalH2s) * 100) : 0

console.log('\n📊  Snippable Answers Audit')
console.log('─'.repeat(60))
console.log(`Limite:               ≤${THRESHOLD} palavras`)
console.log(`H2s auditadas:        ${totalH2s}`)
console.log(`Conformes:            ${compliantH2s}  (${rate}%)`)
console.log(`Não conformes:        ${totalH2s - compliantH2s}  (${100 - rate}%)`)
console.log(`Posts com violações:  ${violations.length}`)

if (violations.length > 0) {
  console.log('\n⚠️  Posts com H2s não conformes:\n')
  for (const { slug, url, issues } of violations) {
    console.log(`  📄 ${slug}`)
    console.log(`     ${url}`)
    for (const { heading, words, preview } of issues) {
      console.log(`\n     ## ${heading}`)
      console.log(`     → ${words} palavras (limite: ${THRESHOLD})`)
      console.log(`     → "${preview}${preview.length === 100 ? '...' : ''}"`)
    }
    console.log()
  }

  console.log('💡  Dica: abra o parágrafo com a resposta direta em 1-2 frases antes de desenvolver.')
  console.log()
  process.exit(1)
} else {
  console.log('\n✅  Todos os posts abrem cada H2 com resposta direta de ≤50 palavras.\n')
  process.exit(0)
}

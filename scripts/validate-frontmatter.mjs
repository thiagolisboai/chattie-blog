/**
 * Validate Frontmatter — F2.1: valida o frontmatter do MDX gerado antes do commit
 *
 * Verifica:
 *   - Campos obrigatórios presentes e não-vazios
 *   - Tipos e formatos básicos (slug kebab-case, date ISO, description 120-160 chars)
 *   - Categoria dentro dos valores permitidos
 *   - Campos EEAT presentes (authorTitle, authorBio, authorLinkedIn)
 *
 * Uso (módulo):
 *   import { validateFrontmatter } from './validate-frontmatter.mjs'
 *   const { valid, errors } = validateFrontmatter(mdxContent)
 *
 * Uso (CLI):
 *   node scripts/validate-frontmatter.mjs content/blog/meu-post.mdx
 *   node scripts/validate-frontmatter.mjs --slug=meu-post
 *
 * Exit 0 = válido | Exit 1 = inválido
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Valid values ─────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['social-selling', 'linkedin', 'b2b', 'ia-para-vendas', 'chattie', 'comparativos']
const VALID_STRUCTURED_DATA = ['article', 'faq', 'howto', 'comparison']
const VALID_LANGS = ['pt-BR', 'en']

// ─── Parse frontmatter ────────────────────────────────────────────────────────

function parseFrontmatter(mdxContent) {
  const match = mdxContent.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const fm = {}
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, '')
    if (key) fm[key] = val
  })
  return fm
}

// ─── Validators ───────────────────────────────────────────────────────────────

function isNonEmpty(val) { return typeof val === 'string' && val.trim().length > 0 }
function isIsoDate(val) { return /^\d{4}-\d{2}-\d{2}$/.test(val) }
function isKebabCase(val) { return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(val) }
function isUrl(val) { return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/') }

// ─── Main validation ──────────────────────────────────────────────────────────

/**
 * @param {string} mdxContent — raw MDX string (with frontmatter)
 * @returns {{ valid: boolean, errors: string[], warnings: string[], fm: object }}
 */
export function validateFrontmatter(mdxContent) {
  const errors = []
  const warnings = []

  const fm = parseFrontmatter(mdxContent)
  if (!fm) {
    return { valid: false, errors: ['Frontmatter não encontrado — o post não começa com ---'], warnings, fm: {} }
  }

  // ── Required fields ──
  const required = ['title', 'slug', 'lang', 'date', 'publishedAt', 'description', 'excerpt', 'category', 'image', 'author', 'readTime', 'canonicalUrl']
  for (const field of required) {
    if (!isNonEmpty(fm[field])) {
      errors.push(`Campo obrigatório ausente ou vazio: "${field}"`)
    }
  }

  // ── Format validations ──
  if (fm.slug && !isKebabCase(fm.slug)) {
    errors.push(`slug inválido: "${fm.slug}" — deve ser kebab-case (ex: "como-usar-linkedin")`)
  }
  if (fm.slug && fm.slug.length > 60) {
    errors.push(`slug muito longo: ${fm.slug.length} chars (máx 60)`)
  }
  if (fm.date && !isIsoDate(fm.date)) {
    errors.push(`date inválido: "${fm.date}" — deve ser YYYY-MM-DD`)
  }
  if (fm.dateModified && !isIsoDate(fm.dateModified)) {
    errors.push(`dateModified inválido: "${fm.dateModified}" — deve ser YYYY-MM-DD`)
  }

  // ── Description length (SEO meta) ──
  // Google truncates snippets at ~155-165 chars but does NOT penalize longer descriptions.
  // Error only at >175 to avoid false positives from Claude's natural output variance.
  if (fm.description) {
    const len = fm.description.length
    if (len < 120) {
      warnings.push(`description muito curta: ${len} chars (ideal 120-160) — pode reduzir CTR`)
    } else if (len > 175) {
      errors.push(`description muito longa: ${len} chars (máx 175) — será truncada pelo Google`)
    } else if (len > 160) {
      warnings.push(`description longa: ${len} chars (ideal ≤160) — pode ser truncada no snippet`)
    }
  }

  // ── Excerpt length ──
  if (fm.excerpt && fm.excerpt.length > 120) {
    warnings.push(`excerpt longa: ${fm.excerpt.length} chars (ideal ≤100)`)
  }

  // ── Category ──
  if (fm.category && !VALID_CATEGORIES.includes(fm.category)) {
    errors.push(`category inválida: "${fm.category}" — valores válidos: ${VALID_CATEGORIES.join(', ')}`)
  }

  // ── structuredData ──
  if (fm.structuredData && !VALID_STRUCTURED_DATA.includes(fm.structuredData)) {
    errors.push(`structuredData inválido: "${fm.structuredData}" — valores válidos: ${VALID_STRUCTURED_DATA.join(', ')}`)
  }

  // ── lang ──
  if (fm.lang && !VALID_LANGS.includes(fm.lang)) {
    errors.push(`lang inválido: "${fm.lang}" — valores válidos: ${VALID_LANGS.join(', ')}`)
  }

  // ── canonicalUrl format ──
  if (fm.canonicalUrl && !isUrl(fm.canonicalUrl)) {
    errors.push(`canonicalUrl inválida: "${fm.canonicalUrl}" — deve começar com https://`)
  }

  // ── image ──
  if (fm.image && !isUrl(fm.image)) {
    errors.push(`image inválida: "${fm.image}" — deve ser URL ou caminho absoluto`)
  }

  // ── imageAlt — detect unescaped double-quotes (breaks YAML parser) ──
  // When raw frontmatter is parsed line-by-line, embedded quotes survive as part of the value.
  // Detect by checking the raw line in the source, not the already-parsed fm object.
  const imageAltRawLine = (mdxContent.match(/\nimageAlt:([^\n]*)/) || [])[1] || ''
  const quoteCount = (imageAltRawLine.match(/"/g) || []).length
  if (quoteCount > 2) {
    // More than the opening+closing quotes → embedded quotes present
    errors.push(`imageAlt contém aspas duplas não escapadas — quebra o parser YAML (use single quotes ou remova)`)
  }

  // ── F1.1: EEAT fields ──
  if (!isNonEmpty(fm.authorTitle)) {
    warnings.push('authorTitle ausente — campo EEAT recomendado para autoridade editorial')
  }
  if (!isNonEmpty(fm.authorBio)) {
    warnings.push('authorBio ausente — campo EEAT recomendado para autoridade editorial')
  }
  if (!isNonEmpty(fm.authorLinkedIn)) {
    warnings.push('authorLinkedIn ausente — Person schema sameAs não será gerado')
  }

  // ── dateModified ──
  if (!isNonEmpty(fm.dateModified)) {
    warnings.push('dateModified ausente — o Google valoriza datas de modificação para freshness')
  }

  return { valid: errors.length === 0, errors, warnings, fm }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fileArg = process.argv[2]
  const slugArg = process.argv.find(a => a.startsWith('--slug='))

  let filePath
  if (fileArg && !fileArg.startsWith('--')) {
    filePath = path.resolve(fileArg)
  } else if (slugArg) {
    const slug = slugArg.split('=').slice(1).join('=')
    filePath = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)
  } else {
    console.error('Uso: node scripts/validate-frontmatter.mjs content/blog/meu-post.mdx')
    console.error('     node scripts/validate-frontmatter.mjs --slug=meu-post')
    process.exit(1)
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌  Arquivo não encontrado: ${filePath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const { valid, errors, warnings, fm } = validateFrontmatter(content)

  console.log(`\n📋  Validando: ${path.basename(filePath)}`)
  console.log(`   Slug:     ${fm.slug || '—'}`)
  console.log(`   Title:    ${fm.title?.slice(0, 60) || '—'}`)
  console.log(`   Category: ${fm.category || '—'}`)
  console.log(`   Author:   ${fm.author || '—'}`)
  console.log()

  if (warnings.length > 0) {
    console.log('⚠️  Avisos:')
    warnings.forEach(w => console.log(`   • ${w}`))
    console.log()
  }

  if (errors.length > 0) {
    console.log('❌  Erros:')
    errors.forEach(e => console.log(`   • ${e}`))
    console.log()
    console.log(`❌  Frontmatter inválido (${errors.length} erro(s))`)
    process.exit(1)
  }

  console.log(`✅  Frontmatter válido${warnings.length > 0 ? ` (${warnings.length} aviso(s))` : ''}`)
  process.exit(0)
}

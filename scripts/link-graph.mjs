/**
 * Link Graph — injeta links bidirecionais ao criar post novo
 *
 * Ao publicar um novo post, encontra os posts existentes mais relacionados
 * e injeta um link de volta ao novo post em cada um deles.
 * Mantém o grafo de links saudável sem intervenção manual.
 *
 * Uso:
 *   node scripts/link-graph.mjs --slug=meu-novo-post
 *   node scripts/link-graph.mjs --slug=meu-novo-post --max=3   (padrão: 3)
 *   node scripts/link-graph.mjs --slug=meu-novo-post --dry-run
 *
 * Saída:
 *   Linha "Injetando link em: slug-existente" para cada post modificado
 *   Exit 0 — sempre (falhas são não-bloqueantes)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')

const DRY_RUN = process.argv.includes('--dry-run')
const slugArg = process.argv.find(a => a.startsWith('--slug='))
const maxArg  = process.argv.find(a => a.startsWith('--max='))
const MAX_BACKLINKS = maxArg ? parseInt(maxArg.split('=')[1]) : 3

if (!slugArg) {
  console.error('Uso: node scripts/link-graph.mjs --slug=meu-novo-post')
  process.exit(0) // nao bloqueante
}

const NEW_SLUG = slugArg.split('=').slice(1).join('=')

// ─── Parse frontmatter ────────────────────────────────────────────────────────

function parseFm(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { raw, fm: {}, body: raw }
  const fm = {}
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':')
    if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
  })
  const body = raw.slice(match[0].length).trim()
  return { raw, fm, body, fmBlock: match[0] }
}

// ─── Tokenize a text for relevance scoring ────────────────────────────────────

function tokenize(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(/[\s\-_/]+/)
      .filter(w => w.length > 3)
  )
}

// ─── Compute relevance score between two posts ────────────────────────────────

function computeRelevance(aSlug, aFm, bSlug, bFm) {
  const aWords = tokenize(`${aSlug} ${aFm.title || ''} ${aFm.category || ''} ${(aFm.tags || '').replace(/[\[\]"]/g, '')}`)
  const bWords = tokenize(`${bSlug} ${bFm.title || ''} ${bFm.category || ''} ${(bFm.tags || '').replace(/[\[\]"]/g, '')}`)

  let score = 0
  for (const word of aWords) {
    if (bWords.has(word)) score++
  }

  // Bonus for same category
  if (aFm.category && bFm.category && aFm.category === bFm.category) score += 2

  return score
}

// ─── Check if a post already has a link to target slug ───────────────────────

function hasLinkTo(body, targetSlug) {
  return body.includes(`/pt-br/blog/${targetSlug}`)
}

// ─── Build natural anchor text ────────────────────────────────────────────────

function buildAnchor(newFm) {
  const title = newFm.title || ''
  // Use first 5-7 meaningful words as anchor
  const words = title.split(' ').filter(w => w.length > 2)
  return words.slice(0, 5).join(' ') || title.slice(0, 40)
}

// ─── Inject link into related post body ──────────────────────────────────────

function injectLink(body, newSlug, newFm) {
  const anchor = buildAnchor(newFm)
  const linkMd = `[${anchor}](/pt-br/blog/${newSlug})`

  // Strategy 1: Append to existing "Veja também" / "Leitura relacionada" section
  const vejaPattern = /(\*\*(Veja também|Leitura relacionada|Relacionado):\*\*[^\n]*)/i
  if (vejaPattern.test(body)) {
    return body.replace(vejaPattern, (match) => `${match} | ${linkMd}`)
  }

  // Strategy 2: Insert before ## FAQ / ## Perguntas section
  const faqPattern = /(\n## (FAQ|Perguntas|Questions))/i
  if (faqPattern.test(body)) {
    return body.replace(faqPattern, `\n\n**Veja também:** ${linkMd}$1`)
  }

  // Strategy 3: Insert before ## Conclusão section
  const conclusaoPattern = /(\n## Conclus)/i
  if (conclusaoPattern.test(body)) {
    return body.replace(conclusaoPattern, `\n\n**Veja também:** ${linkMd}$1`)
  }

  // Strategy 4: Append at end of body
  return body + `\n\n**Veja também:** ${linkMd}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// Load new post
const newFilePath = path.join(BLOG_DIR, `${NEW_SLUG}.mdx`)
if (!fs.existsSync(newFilePath)) {
  console.error(`Post nao encontrado: content/blog/${NEW_SLUG}.mdx`)
  process.exit(0)
}

const { fm: newFm } = parseFm(newFilePath)

// Load all other posts
const allFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx') && f !== `${NEW_SLUG}.mdx`)

const candidates = allFiles
  .map(f => {
    const slug = f.replace('.mdx', '')
    const filePath = path.join(BLOG_DIR, f)
    const { fm, body } = parseFm(filePath)
    const score = computeRelevance(NEW_SLUG, newFm, slug, fm)
    return { slug, filePath, fm, body, score }
  })
  .filter(p => p.score >= 2) // minimum relevance threshold
  .sort((a, b) => b.score - a.score)

// Filter: only posts that don't already link to the new post
const targets = candidates
  .filter(p => !hasLinkTo(p.body, NEW_SLUG))
  .slice(0, MAX_BACKLINKS)

if (targets.length === 0) {
  console.log('Nenhum post relacionado encontrado para injetar backlinks.')
  process.exit(0)
}

// ─── F1.4: Update dateModified in frontmatter ────────────────────────────────

function updateDateModified(filePath) {
  const today = new Date().toISOString().split('T')[0]
  let raw = fs.readFileSync(filePath, 'utf-8')
  if (raw.includes('dateModified:')) {
    raw = raw.replace(/dateModified:\s*"[^"]*"/, `dateModified: "${today}"`)
  } else {
    raw = raw.replace(/^(date:\s*"[^"]*")$/m, `$1\ndateModified: "${today}"`)
  }
  fs.writeFileSync(filePath, raw, 'utf-8')
}

// ─── Inject links ─────────────────────────────────────────────────────────────

for (const target of targets) {
  const updatedBody = injectLink(target.body, NEW_SLUG, newFm)

  if (updatedBody === target.body) {
    console.log(`Nenhuma mudanca necessaria em: ${target.slug}`)
    continue
  }

  console.log(`Injetando link em: ${target.slug}`)

  if (!DRY_RUN) {
    // Reconstruct full file (frontmatter + updated body)
    const { raw } = parseFm(target.filePath)
    const fmBlock = raw.match(/^---\n[\s\S]*?\n---/)?.[0] || ''
    const updatedFile = fmBlock + '\n\n' + updatedBody
    fs.writeFileSync(target.filePath, updatedFile, 'utf-8')
    // F1.4: Mark post as recently modified so Google picks up the update
    updateDateModified(target.filePath)
  } else {
    console.log(`  [dry-run] Linkaria: /pt-br/blog/${NEW_SLUG} em ${target.slug}`)
    console.log(`  [dry-run] Atualizaria dateModified em: ${target.slug}`)
  }
}

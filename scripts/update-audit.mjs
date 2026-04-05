/**
 * Update Audit — Fase 6 do Agente de Conteúdo Chattie
 *
 * Identifica posts que precisam de atualização com base em:
 *   - Tempo desde a última modificação (date ou dateModified)
 *   - Referências a anos que ficaram desatualizados no título/description
 *   - Posts sem dateModified (Google não detecta frescor)
 *   - Posts com queda de ranking no GSC (se gsc-insights.md existir)
 *
 * Uso:
 *   node scripts/update-audit.mjs
 *   node scripts/update-audit.mjs --all   (mostra todos, não só os críticos)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SHOW_ALL = process.argv.includes('--all')

const DIRS = {
  'PT-BR': path.join(ROOT, 'content', 'blog'),
  'EN':    path.join(ROOT, 'content', 'blog-en'),
}

const TODAY = new Date()
const STALE_MONTHS = 6   // flag posts older than this

// ─── Parse frontmatter ──────────────────────────────────────────────────────

function parseFm(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  match[1].split('\n').forEach((line) => {
    const [k, ...v] = line.split(':')
    if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
  })
  // Check for stale year in title/description/slug
  const prevYear = (TODAY.getFullYear() - 1).toString()
  fm._staleYear = (
    (fm.title || '').includes(prevYear) ||
    (fm.description || '').includes(prevYear)
  )
  fm._contentRef = raw.split('\n').slice(5).join('\n') // skip frontmatter
    .match(new RegExp(`em ${prevYear}|in ${prevYear}|de ${prevYear}|of ${prevYear}`, 'gi')) || []
  return fm
}

// ─── Age calculation ─────────────────────────────────────────────────────────

function monthsAgo(dateStr) {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  return (TODAY - d) / (1000 * 60 * 60 * 24 * 30)
}

// ─── Load GSC ranking drops ──────────────────────────────────────────────────

function loadGscDrops() {
  const gscPath = path.join(ROOT, 'docs', 'gsc-insights.md')
  if (!fs.existsSync(gscPath)) return new Set()
  const raw = fs.readFileSync(gscPath, 'utf-8')
  const drops = new Set()
  const section = raw.match(/##.*[Qq]uedas[\s\S]*?(?=\n##|\n---)/)?.[0] || ''
  const slugPattern = /\|\s*(\/[^\s|]+)/g
  let m
  while ((m = slugPattern.exec(section)) !== null) {
    drops.add(m[1].replace(/\/$/, ''))
  }
  return drops
}

// ─── Load posts ──────────────────────────────────────────────────────────────

const gscDrops = loadGscDrops()
const posts = []

for (const [lang, dir] of Object.entries(DIRS)) {
  if (!fs.existsSync(dir)) continue
  fs.readdirSync(dir).filter(f => f.endsWith('.mdx')).forEach(f => {
    const fm = parseFm(path.join(dir, f))
    const slug = fm.slug || f.replace('.mdx', '')
    const lastMod = fm.dateModified || fm.date
    const age = monthsAgo(lastMod)
    const canonPath = fm.canonicalUrl?.replace('https://trychattie.com', '') || ''
    const inGscDrop = gscDrops.has(canonPath) || gscDrops.has(`/${slug}`)

    posts.push({
      lang,
      file: f,
      slug,
      title: fm.title,
      date: fm.date,
      dateModified: fm.dateModified || null,
      lastMod,
      age: Math.round(age),
      staleYear: fm._staleYear,
      contentRefs: fm._contentRef.length,
      hasDateModified: !!fm.dateModified,
      inGscDrop,
    })
  })
}

// ─── Classify ────────────────────────────────────────────────────────────────

const critical = posts.filter(p => p.inGscDrop || (p.staleYear && p.age > 3))
const highPriority = posts.filter(p =>
  !critical.includes(p) && (p.age >= STALE_MONTHS || p.staleYear || !p.hasDateModified)
)
const ok = posts.filter(p => !critical.includes(p) && !highPriority.includes(p))

const noDateModified = posts.filter(p => !p.hasDateModified)

// ─── Output ──────────────────────────────────────────────────────────────────

console.log(`
╔══════════════════════════════════════════════════════════╗
║            Update Audit — Chattie Blog                   ║
╚══════════════════════════════════════════════════════════╝
  Data de referência: ${TODAY.toISOString().split('T')[0]}
  Threshold de staleness: ${STALE_MONTHS} meses
`)

if (noDateModified.length > 0) {
  console.log(`⚠️   ${noDateModified.length}/${posts.length} posts sem dateModified — Google não detecta frescor nas atualizações`)
  console.log()
}

if (critical.length > 0) {
  console.log(`🚨  Crítico — atualizar antes de criar novo conteúdo (${critical.length})`)
  console.log()
  critical.forEach(p => {
    const flags = []
    if (p.inGscDrop) flags.push('📉 queda GSC')
    if (p.staleYear) flags.push('📅 ano desatualizado no título')
    console.log(`  [${p.lang}] ${p.slug}`)
    console.log(`    Publicado: ${p.date}  |  Última mod: ${p.lastMod}  |  ${p.age}m atrás`)
    console.log(`    Flags: ${flags.join(', ')}`)
    if (p.title) console.log(`    Título: "${p.title}"`)
    console.log()
  })
}

if (highPriority.length > 0 && SHOW_ALL) {
  console.log(`⚡  Alta prioridade — próximas sessões (${highPriority.length})`)
  console.log()
  highPriority.forEach(p => {
    const flags = []
    if (p.age >= STALE_MONTHS) flags.push(`${p.age}m sem atualização`)
    if (p.staleYear) flags.push('ano desatualizado')
    if (!p.hasDateModified) flags.push('sem dateModified')
    console.log(`  [${p.lang}] ${p.slug.padEnd(48)} ${flags.join(' | ')}`)
  })
  console.log()
}

// Summary
const currentYear = TODAY.getFullYear().toString()
const prevYear = (TODAY.getFullYear() - 1).toString()
const staleInTitle = posts.filter(p => p.staleYear)
const staleInContent = posts.filter(p => p.contentRefs > 0)

console.log(`─────────────────────────────────────────────────────────────────
📊  Resumo
    Posts totais:              ${posts.length}
    Sem dateModified:          ${noDateModified.length}
    Com ano ${prevYear} no título:   ${staleInTitle.length} posts
    Com ref "${prevYear}" no corpo: ${staleInContent.length} posts
    Com queda no GSC:          ${posts.filter(p => p.inGscDrop).length}
    Mais de ${STALE_MONTHS}m sem update:     ${posts.filter(p => p.age >= STALE_MONTHS).length}
─────────────────────────────────────────────────────────────────

💡  Próximas ações:
    1. Atualizar dateModified em posts editados (node scripts/set-date-modified.mjs)
    2. Corrigir títulos com "${prevYear}" → "${currentYear}" nos posts relevantes
    3. Revisar conteúdo dos posts em queda no GSC

    Workflow: docs/update-workflow.md
`)

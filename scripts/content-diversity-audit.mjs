/**
 * Content Diversity Audit — Fase 5 do Agente de Conteúdo Chattie
 *
 * Analisa a distribuição de tipos de conteúdo, schemas e categorias
 * para evitar que o blog fique com 100% de artigos no mesmo formato.
 *
 * Uso:
 *   node scripts/content-diversity-audit.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const DIRS = {
  'PT-BR': path.join(ROOT, 'content', 'blog'),
  'EN':    path.join(ROOT, 'content', 'blog-en'),
}

// Schema types actually rendered (based on json-ld.tsx logic)
const HOWTO_SLUGS = new Set([
  // PT-BR
  'follow-up-linkedin-b2b', 'como-prospectar-clientes-no-linkedin',
  'linkedin-para-gerar-leads-qualificados', 'linkedin-para-vendas',
  'como-otimizar-perfil-linkedin-para-vendas-b2b', 'como-abordar-prospects-no-linkedin',
  'mensagem-de-conexao-linkedin-exemplos', 'pitch-de-prospeccao-linkedin',
  'linkedin-para-prospeccao-b2b-guia-definitivo', 'guia-completo-social-selling-linkedin',
  'social-selling-b2b-metodologia-completa-linkedin-2026', 'cadencia-de-prospeccao-linkedin-b2b',
  'como-qualificar-leads-no-linkedin-com-ia', 'como-personalizar-mensagens-linkedin-em-escala',
  'filtros-avancados-linkedin-sales-navigator', 'como-exportar-leads-sales-navigator',
  // EN
  'linkedin-prospecting-guide', 'linkedin-follow-up-b2b',
  'linkedin-b2b-prospecting-cadence',
])
const DEFINED_TERMS = new Set([
  // PT-BR
  'o-que-e-social-selling', 'o-que-e-um-crm-social', 'o-que-e-um-ai-sdr',
  'icp-linkedin-como-definir-perfil-cliente-ideal',
  // EN
  'what-is-an-ai-sdr', 'what-is-social-selling-and-why-it-matters-in-b2b',
  'what-is-a-social-crm-and-why-it-matters-for-linkedin-b2b',
])
const COMPARISON_SLUGS = new Set([
  // PT-BR
  'chattie-vs-expandi', 'chattie-vs-waalaxy', 'expandi-vs-waalaxy',
  'linkedin-vs-email-prospeccao', 'linkedin-sales-navigator-vs-gratuito',
  'ai-sdr-vs-sdr-humano', 'whatsapp-vs-linkedin-para-prospeccao-b2b',
  'melhores-ferramentas-prospeccao-linkedin-2026',
  // EN
  'ai-sdr-vs-human-sdr', 'expandi-vs-waalaxy',
])

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
  fm._hasFaqSection = /^## .*(FAQ|Perguntas|Questions|Frequently Asked)/im.test(raw)
  fm._wordCount = raw.split(/\s+/).length
  return fm
}

// ─── Load posts ─────────────────────────────────────────────────────────────

const allPosts = []
for (const [lang, dir] of Object.entries(DIRS)) {
  if (!fs.existsSync(dir)) continue
  fs.readdirSync(dir).filter(f => f.endsWith('.mdx')).forEach(f => {
    const fm = parseFm(path.join(dir, f))
    const slug = fm.slug || f.replace('.mdx', '')
    // Determine actual rendered schema types
    const schemas = ['Article', 'BreadcrumbList']
    if (COMPARISON_SLUGS.has(slug)) schemas.push('ItemList')
    if (HOWTO_SLUGS.has(slug))     schemas.push('HowTo')
    if (DEFINED_TERMS.has(slug))   schemas.push('DefinedTerm')
    if (fm._hasFaqSection)         schemas.push('FAQPage')
    allPosts.push({ lang, slug, category: fm.category, structuredData: fm.structuredData, schemas, wordCount: fm._wordCount })
  })
}

// ─── Analytics ──────────────────────────────────────────────────────────────

// Schema type distribution
const schemaCount = {}
allPosts.forEach(p => p.schemas.forEach(s => { schemaCount[s] = (schemaCount[s] || 0) + 1 }))

// Category distribution
const catCount = {}
allPosts.forEach(p => { catCount[p.category] = (catCount[p.category] || 0) + 1 })

// Frontmatter structuredData distribution
const fmSdCount = {}
allPosts.forEach(p => { fmSdCount[p.structuredData || 'none'] = (fmSdCount[p.structuredData || 'none'] || 0) + 1 })

// Posts without FAQ section but with structuredData:"faq"
const faqMismatch = allPosts.filter(p => p.structuredData === 'faq' && !p.schemas.includes('FAQPage'))

// Rich schema coverage (has more than Article + BreadcrumbList)
const richSchema = allPosts.filter(p => p.schemas.length > 2)
const basicOnly  = allPosts.filter(p => p.schemas.length <= 2)

// Word count buckets
const short  = allPosts.filter(p => p.wordCount < 800)
const medium = allPosts.filter(p => p.wordCount >= 800 && p.wordCount < 1500)
const long   = allPosts.filter(p => p.wordCount >= 1500)

// ─── Output ─────────────────────────────────────────────────────────────────

const pct = (n, total) => `${Math.round(n / total * 100)}%`

console.log(`
╔══════════════════════════════════════════════════════════╗
║         Content Diversity Audit — Chattie Blog           ║
╚══════════════════════════════════════════════════════════╝

📊  Visão geral
    Total de posts:    ${allPosts.length} (${allPosts.filter(p=>p.lang==='PT-BR').length} PT-BR, ${allPosts.filter(p=>p.lang==='EN').length} EN)
`)

console.log(`📐  Schemas renderizados (alguns posts têm múltiplos)`)
Object.entries(schemaCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, n]) => {
    const bar = '█'.repeat(Math.round(n / allPosts.length * 20))
    console.log(`    ${s.padEnd(16)} ${String(n).padStart(3)} posts  ${bar}`)
  })

console.log(`
🏷️   Categorias`)
Object.entries(catCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([c, n]) => console.log(`    ${c.padEnd(20)} ${n} posts  (${pct(n, allPosts.length)})`))

console.log(`
🗂️   structuredData no frontmatter`)
Object.entries(fmSdCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, n]) => console.log(`    ${s.padEnd(16)} ${n} posts  (${pct(n, allPosts.length)})`))

console.log(`
✨  Schema rico (além de Article + Breadcrumb): ${richSchema.length}/${allPosts.length} posts (${pct(richSchema.length, allPosts.length)})`)
richSchema.forEach(p => console.log(`    [${p.lang}] ${p.slug.padEnd(45)} ${p.schemas.filter(s => !['Article','BreadcrumbList'].includes(s)).join(', ')}`))

if (basicOnly.length > 0) {
  console.log(`\n⚠️   Só Article + Breadcrumb (sem schema rico): ${basicOnly.length} posts`)
  basicOnly.forEach(p => console.log(`    [${p.lang}] ${p.slug}`))
}

if (faqMismatch.length > 0) {
  console.log(`\n⚠️   structuredData:"faq" mas sem seção FAQ detectada: ${faqMismatch.length} posts`)
  faqMismatch.forEach(p => console.log(`    [${p.lang}] ${p.slug}`))
}

console.log(`
📏  Distribuição por tamanho (words no arquivo, inclui frontmatter)
    < 800w (curto):   ${short.length} posts — ${short.map(p=>p.slug).join(', ') || '—'}
    800–1500w:        ${medium.length} posts
    > 1500w (longo):  ${long.length} posts`)

console.log(`
─────────────────────────────────────────────────────────────────
💡  Meta de diversidade:
    • ≥ 50% dos posts com schema rico (HowTo, FAQ, DefinedTerm ou ItemList)
    • Máximo 80% numa única categoria
    • Pelo menos 1 post de comparação por cluster de ferramentas
─────────────────────────────────────────────────────────────────
`)

// ─── B5: JSON output for programmatic use ────────────────────────────────────

if (process.argv.includes('--json')) {
  const jsonResult = {
    total: allPosts.length,
    categories: catCount,
    schemas: schemaCount,
    structuredData: fmSdCount,
    richSchemaPct: allPosts.length > 0 ? Math.round(richSchema.length / allPosts.length * 100) : 0,
  }
  process.stdout.write('\n' + JSON.stringify(jsonResult) + '\n')
}

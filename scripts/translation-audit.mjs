/**
 * Translation Audit — Fase 3 do Agente de Conteúdo Chattie
 *
 * Escaneia todos os posts PT-BR e EN e reporta:
 *   - Pares completos (enSlug ↔ ptSlug ambos preenchidos e existentes)
 *   - PT-BR sem par EN (candidatos à tradução)
 *   - EN sem par PT-BR (conteúdo EN órfão)
 *   - Links quebrados (slug referenciado não existe)
 *
 * Uso:
 *   node scripts/translation-audit.mjs
 *   node scripts/translation-audit.mjs --json   (output JSON)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const PT_DIR = path.join(ROOT, 'content', 'blog')
const EN_DIR = path.join(ROOT, 'content', 'blog-en')

const JSON_MODE = process.argv.includes('--json')

// ─── Parse frontmatter ──────────────────────────────────────────────────────

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n')
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  match[1].split('\n').forEach((line) => {
    const [k, ...v] = line.split(':')
    if (k && v.length) {
      fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
    }
  })
  return fm
}

// ─── Load all posts ─────────────────────────────────────────────────────────

function loadPosts(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const fm = parseFrontmatter(path.join(dir, f))
      return { file: f, slug: fm.slug || f.replace('.mdx', ''), ...fm }
    })
}

const ptPosts = loadPosts(PT_DIR)
const enPosts = loadPosts(EN_DIR)

const ptSlugs = new Set(ptPosts.map((p) => p.slug))
const enSlugs = new Set(enPosts.map((p) => p.slug))

// ─── Classify ───────────────────────────────────────────────────────────────

const paired = []        // both sides linked correctly
const ptNeedsEn = []     // PT-BR with no EN pair
const enNeedsPt = []     // EN with no PT-BR pair
const brokenLinks = []   // slug reference points to non-existent post

for (const pt of ptPosts) {
  const enSlug = pt.enSlug
  if (!enSlug) {
    ptNeedsEn.push(pt)
  } else if (!enSlugs.has(enSlug)) {
    brokenLinks.push({ post: pt.slug, lang: 'pt-BR', field: 'enSlug', target: enSlug })
  } else {
    // Check reciprocal link
    const enPost = enPosts.find((e) => e.slug === enSlug)
    if (!enPost.ptSlug || enPost.ptSlug !== pt.slug) {
      brokenLinks.push({ post: enSlug, lang: 'en', field: 'ptSlug', expected: pt.slug, found: enPost.ptSlug || '(empty)' })
    } else {
      paired.push({ pt: pt.slug, en: enSlug })
    }
  }
}

for (const en of enPosts) {
  const ptSlug = en.ptSlug
  if (!ptSlug) {
    enNeedsPt.push(en)
  } else if (!ptSlugs.has(ptSlug)) {
    brokenLinks.push({ post: en.slug, lang: 'en', field: 'ptSlug', target: ptSlug })
  }
  // Paired posts already counted above
}

// ─── Translation priority (based on strategic value) ──────────────────────

const PRIORITY = {
  // High: AI/automation topics — zero EN competition, product-aligned
  'o-que-e-um-crm-social':                    { priority: 'Alta',  enSlugSuggested: 'what-is-a-social-crm' },
  'ia-para-vendas-b2b':                       { priority: 'Alta',  enSlugSuggested: 'ai-for-b2b-sales' },
  'automacao-linkedin-o-que-e-permitido':     { priority: 'Alta',  enSlugSuggested: 'linkedin-automation-what-is-allowed' },
  'ferramentas-para-prospeccao-no-linkedin':  { priority: 'Alta',  enSlugSuggested: 'linkedin-prospecting-tools' },
  'chattie-vs-expandi':                       { priority: 'Alta',  enSlugSuggested: 'chattie-vs-expandi' },
  'chattie-vs-waalaxy':                       { priority: 'Alta',  enSlugSuggested: 'chattie-vs-waalaxy' },
  'linkedin-para-vendas-b2b':                 { priority: 'Alta',  enSlugSuggested: 'linkedin-for-b2b-sales' },
  // Medium: Good but competitive in EN
  'o-que-e-social-selling':                   { priority: 'Média', enSlugSuggested: 'what-is-social-selling' },
  'como-otimizar-perfil-linkedin-para-vendas-b2b': { priority: 'Média', enSlugSuggested: 'optimize-linkedin-profile-for-b2b-sales' },
  'crm-para-social-selling':                  { priority: 'Média', enSlugSuggested: 'crm-for-social-selling' },
  'linkedin-para-vendas-consultivas':         { priority: 'Média', enSlugSuggested: 'linkedin-for-consultative-sales' },
  'vender-no-linkedin-sem-estrategia':        { priority: 'Média', enSlugSuggested: 'selling-on-linkedin-without-strategy' },
  'linkedin-para-gerar-leads-qualificados':   { priority: 'Média', enSlugSuggested: 'linkedin-for-qualified-lead-generation' },
  // Low: Too PT-BR / brand-specific for EN
  'como-founders-usam-o-chattie':             { priority: 'Baixa', enSlugSuggested: 'how-founders-use-chattie' },
  'como-o-chattie-se-paga':                   { priority: 'Baixa', enSlugSuggested: 'how-chattie-pays-for-itself' },
  'linkedin-para-vendas':                     { priority: 'Baixa', enSlugSuggested: 'linkedin-for-sales' },
}

// ─── Output ─────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  console.log(JSON.stringify({ paired, ptNeedsEn: ptNeedsEn.map(p => p.slug), enNeedsPt: enNeedsPt.map(p => p.slug), brokenLinks }, null, 2))
  process.exit(0)
}

const total = ptPosts.length + enPosts.length
const pairCoverage = ((paired.length / ptPosts.length) * 100).toFixed(0)

console.log(`
╔══════════════════════════════════════════════════════════╗
║          Translation Audit — Chattie Blog                ║
╚══════════════════════════════════════════════════════════╝

📊  Visão geral
    Posts PT-BR:      ${ptPosts.length}
    Posts EN:         ${enPosts.length}
    Pares completos:  ${paired.length} / ${ptPosts.length} PT-BR posts (${pairCoverage}% cobertura)
`)

if (brokenLinks.length > 0) {
  console.log(`❌  Links quebrados (corrigir primeiro)`)
  brokenLinks.forEach((b) => {
    console.log(`    [${b.lang}] ${b.post} → ${b.field}: "${b.target || b.found}" (esperado: "${b.expected || 'arquivo existente'}")`)
  })
  console.log('')
}

if (paired.length > 0) {
  console.log(`✅  Pares completos`)
  paired.forEach((p) => console.log(`    PT: ${p.pt}  ↔  EN: ${p.en}`))
  console.log('')
}

if (enNeedsPt.length > 0) {
  console.log(`🔴  EN sem par PT-BR`)
  enNeedsPt.forEach((p) => console.log(`    ${p.slug}`))
  console.log('')
}

if (ptNeedsEn.length > 0) {
  console.log(`📝  PT-BR sem par EN (${ptNeedsEn.length} posts)\n`)
  console.log(`    Slug PT-BR                               | Prioridade | EN sugerido`)
  console.log(`    ─────────────────────────────────────────────────────────────────────`)

  const sorted = [...ptNeedsEn].sort((a, b) => {
    const order = { 'Alta': 0, 'Média': 1, 'Baixa': 2, undefined: 3 }
    return order[PRIORITY[a.slug]?.priority] - order[PRIORITY[b.slug]?.priority]
  })

  sorted.forEach((p) => {
    const meta = PRIORITY[p.slug]
    const pri = meta?.priority ?? '—'
    const suggested = meta?.enSlugSuggested ?? '(definir)'
    const slug = p.slug.padEnd(40)
    console.log(`    ${slug} | ${pri.padEnd(10)} | ${suggested}`)
  })
  console.log('')
}

console.log(`─────────────────────────────────────────────────────────────────────
💡  Próxima ação: traduzir um post de prioridade Alta
    Workflow: docs/translation-workflow.md
─────────────────────────────────────────────────────────────────────
`)

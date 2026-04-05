/**
 * Generate Post — gerador de posts via Anthropic API
 *
 * Uso (CLI):
 *   node scripts/generate-post.mjs --keyword="mensagem linkedin sem parecer vendedor"
 *   node scripts/generate-post.mjs --keyword="keyword" --dry-run   (imprime sem salvar)
 *
 * Uso (módulo):
 *   import { generatePost } from './generate-post.mjs'
 *   const result = await generatePost('mensagem linkedin sem parecer vendedor')
 *   // → { slug, filePath, title, wordCount }
 *
 * Requer:
 *   ANTHROPIC_API_KEY — em .env.local ou variável de ambiente
 *   PEXELS_API_KEY    — para buscar imagem de capa (opcional: usa fallback se ausente)
 */

import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { braveSearch } from './brave-search.mjs'
import { callAnthropic } from './anthropic-client.mjs'
import { groundingVerify } from './grounding-verify.mjs'
import { snippetOptimize } from './snippet-optimize.mjs'
import { config } from './load-config.mjs'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0]
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

function countWords(text) {
  return text.replace(/---[\s\S]*?---/, '').trim().split(/\s+/).length
}

function estimateReadTime(wordCount) {
  return `${Math.ceil(wordCount / 200)} min`
}

// ─── Load context files ───────────────────────────────────────────────────────

function loadClaudeMd() {
  const p = path.join(ROOT, 'CLAUDE.md')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
}

/**
 * T2.8: Modular prompt — extracts only the CLAUDE.md sections relevant to
 * a given task, cutting ~1000 tokens per generate-post call.
 *
 * Sections included for 'generate-post':
 *   - Identidade e contexto (ICP, tom, produto)
 *   - FASE 4 — Verificação de fontes (source rules)
 *   - FASE 5 — Diversificação (schema types, distribution targets)
 *   - Criar um post PT-BR (writing rules, structure requirements)
 *   - SEO PT-BR obrigatório
 *   - GEO obrigatório
 *   - Imagens de capa via Pexels
 *   - Proibido (the global prohibition list)
 *
 * Excluded (irrelevant to generation):
 *   - FASE 1 (GSC setup — already loaded separately via loadGscInsights)
 *   - FASE 3 (translation pipeline)
 *   - FASE 6 (update loop)
 *   - Criar um post EN (EN writing rules)
 *   - SEO EN obrigatório
 *   - Workflow de sessão completo (agent orchestration — not needed mid-call)
 *   - Ferramentas MCP disponíveis
 */
function loadPromptContext(task = 'generate-post') {
  const raw = loadClaudeMd()
  if (!raw) return ''

  if (task !== 'generate-post') return raw // full context for other tasks

  // Split into top-level sections (## or # headings)
  const INCLUDE_PATTERNS = [
    /^## Identidade e contexto/m,
    /^## FASE 4/m,
    /^## FASE 5/m,
    /^## Criar um post PT-BR/m,
    /^## SEO PT-BR obrigatório/m,
    /^## GEO obrigatório/m,
    /^## Imagens de capa via Pexels/m,
    /^## Proibido/m,
  ]

  const EXCLUDE_PATTERNS = [
    /^## FASE 1/m,
    /^## FASE 3/m,
    /^## FASE 6/m,
    /^## Criar um post EN/m,
    /^## SEO EN obrigatório/m,
    /^## Workflow de sessão completo/m,
    /^## Ferramentas MCP/m,
  ]

  // Split at ## boundaries, keeping the heading with its content
  const sections = raw.split(/(?=^## )/m)

  const included = sections.filter(section => {
    const isIncluded = INCLUDE_PATTERNS.some(p => p.test(section))
    const isExcluded = EXCLUDE_PATTERNS.some(p => p.test(section))
    // Always include the preamble (before first ##)
    if (!section.startsWith('## ')) return true
    return isIncluded && !isExcluded
  })

  return included.join('\n').trim()
}

function loadPostSchema() {
  const p = path.join(ROOT, 'docs', 'post-schema-pt.md')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
}

function loadGscInsights() {
  const p = path.join(ROOT, 'docs', 'gsc-insights.md')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').slice(0, 2000) : ''
}

/** T4.20: Load prompt refinements derived from human quality ratings */
function loadPromptRefinements() {
  const p = path.join(ROOT, 'docs', 'prompt-refinements.md')
  if (!fs.existsSync(p)) return ''
  const raw = fs.readFileSync(p, 'utf-8')
  // Extract only the anti-patterns and insights sections (skip metadata)
  const antiPatterns = raw.match(/## Anti-padrões[\s\S]*?(?=\n##|$)/)?.[0] || ''
  const insights     = raw.match(/## Análise de Qualidade[\s\S]*?(?=\n##|$)/)?.[0] || ''
  const combined = [antiPatterns, insights].filter(Boolean).join('\n\n').trim()
  return combined ? `## Refinamentos baseados em feedback humano\n\n${combined}` : ''
}

function loadExistingPosts() {
  const dir = path.join(ROOT, 'content', 'blog')
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8')
      const match = raw.match(/^---\n([\s\S]*?)\n---/)
      if (!match) return null
      const fm = {}
      match[1].split('\n').forEach(line => {
        const [k, ...v] = line.split(':')
        if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
      })
      return { slug: fm.slug || f.replace('.mdx', ''), title: fm.title || '', publishedAt: fm.publishedAt || '' }
    })
    .filter(Boolean)
}

/**
 * T3.11: Load few-shot examples from real published posts.
 *
 * Picks the 2 most recent posts with complete frontmatter and extracts:
 *   - Title and description (tone calibration)
 *   - First paragraph before the first H2 (intro style)
 *   - H2 structure (outline pattern)
 *
 * This gives the model a concrete reference for Chattie's writing style,
 * depth, and structure rather than relying solely on textual instructions.
 */
function loadFewShotExamples() {
  const dir = path.join(ROOT, 'content', 'blog')
  if (!fs.existsSync(dir)) return ''

  // T4.20: Load quality ratings to prioritize highly-rated posts as examples
  const ratingsPath = path.join(ROOT, 'docs', 'quality-ratings.jsonl')
  const ratings = {}
  if (fs.existsSync(ratingsPath)) {
    fs.readFileSync(ratingsPath, 'utf-8').trim().split('\n').filter(Boolean).forEach(line => {
      try {
        const e = JSON.parse(line)
        if (e.slug && e.rating) ratings[e.slug] = e.rating
      } catch { /* skip */ }
    })
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8')
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
      if (!fmMatch) return null
      const fm = {}
      fmMatch[1].split('\n').forEach(line => {
        const [k, ...v] = line.split(':')
        if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
      })
      if (!fm.title || !fm.publishedAt) return null
      const slug = fm.slug || f.replace('.mdx', '')
      const body = raw.slice(fmMatch[0].length).trim()
      // T4.20: rating 4-5 → prioritized; no rating → neutral (3); rating 1-2 → excluded
      const rating = ratings[slug] || 3
      return { fm, body, publishedAt: fm.publishedAt, slug, rating }
    })
    .filter(Boolean)
    .filter(f => f.rating >= 3) // T4.20: exclude poorly-rated posts as examples
    .sort((a, b) => {
      // T4.20: Sort by rating first (desc), then by date (desc)
      if (b.rating !== a.rating) return b.rating - a.rating
      return b.publishedAt.localeCompare(a.publishedAt)
    })
    .slice(0, 2)

  if (files.length === 0) return ''

  const examples = files.map((f, i) => {
    // Extract intro: text before the first H2
    const introMatch = f.body.match(/^([\s\S]*?)(?=\n## )/m)
    const intro = (introMatch?.[1] || f.body.slice(0, 400))
      .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
      .trim()
      .slice(0, 350)

    // Extract H2 structure
    const h2s = [...f.body.matchAll(/^## (.+)$/gm)].map(m => m[1]).slice(0, 6)

    return [
      `### Exemplo ${i + 1}: "${f.fm.title}"`,
      `**Description**: ${f.fm.description || '—'}`,
      `**Introdução**:`,
      intro + (intro.length >= 350 ? '...' : ''),
      `**Estrutura de H2s**:`,
      h2s.map(h => `- ${h}`).join('\n'),
    ].join('\n')
  }).join('\n\n---\n\n')

  return `## Exemplos reais de posts publicados (calibração de estilo)\n\nUse estes exemplos como referência de tom, profundidade e estrutura. NÃO copie — apenas calibre.\n\n${examples}`
}

// ─── F3.2: Image alt text generator ──────────────────────────────────────────

/**
 * Generates an SEO-optimized alt text for the cover image based on the keyword.
 * Rule-based (no API call). Combines keyword context with B2B sales framing
 * so alt text is descriptive for both accessibility and image SEO.
 *
 * @param {string} keyword — post keyword in PT-BR
 * @returns {string} alt text in PT-BR (120 chars max)
 */
function generateImageAlt(keyword) {
  const normalized = keyword
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Context suffix based on keyword theme
  let suffix = 'no LinkedIn'
  if (/automa[çc][aã]o|automacao|ia\b|intelig/.test(normalized)) {
    suffix = 'com inteligência artificial'
  } else if (/sdr|prospec|outbound/.test(normalized)) {
    suffix = 'em estratégia de prospecção B2B'
  } else if (/crm|gestao|pipeline|funil/.test(normalized)) {
    suffix = 'em gestão de pipeline de vendas'
  } else if (/mensagem|abordagem|conexao|conex/.test(normalized)) {
    suffix = 'em comunicação comercial no LinkedIn'
  } else if (/perfil|marca|personal|brand/.test(normalized)) {
    suffix = 'em personal branding para vendas B2B'
  } else if (/social.?selling|venda.?social/.test(normalized)) {
    suffix = 'em social selling'
  }

  // Capitalize first letter
  const label = keyword.charAt(0).toUpperCase() + keyword.slice(1)

  return `${label} — profissional de vendas B2B ${suffix}`.slice(0, 120)
}

// ─── Pexels image fetch ───────────────────────────────────────────────────────

async function fetchPexelsImage(keyword) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null

  // Translate keyword to English for better results
  const enKeywords = keyword
    .replace(/linkedin/gi, 'linkedin')
    .replace(/prospec[çc][aã]o/gi, 'prospecting')
    .replace(/mensagem/gi, 'message')
    .replace(/vendas/gi, 'sales')
    .replace(/automa[çc][aã]o/gi, 'automation')
    .replace(/intelig[eê]ncia artificial|ia\b/gi, 'artificial intelligence')
    .replace(/follow.?up/gi, 'follow up')
    .replace(/perfil/gi, 'profile')
    .replace(/qualifica[çc][aã]o/gi, 'qualification')
    .replace(/[^\w\s]/g, ' ').trim()

  const searchQuery = enKeywords.length > 10 ? enKeywords : `${keyword} business professional`
  const params = new URLSearchParams({
    query: searchQuery,
    per_page: '6',
    orientation: 'landscape',
  })

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?${params}`,
      method: 'GET',
      headers: { Authorization: key },
    }

    const req = https.get(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          const photos = json.photos || []
          if (photos.length === 0) { resolve(null); return }

          // Pick photo that isn't already used in blog
          const usedImages = loadExistingPosts()
            .map(p => {
              const raw = fs.readFileSync(path.join(ROOT, 'content', 'blog', `${p.slug}.mdx`), 'utf-8')
              const match = raw.match(/image:\s*"([^"]+)"/)
              return match?.[1] || ''
            })

          const fresh = photos.find(p => !usedImages.some(u => u.includes(String(p.id))))
          const chosen = fresh || photos[0]
          resolve(chosen.src.large2x)
        } catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(8000, () => { req.destroy(); resolve(null) })
  })
}

// ─── B2: Fetch and parse real SERP page content ──────────────────────────────

async function fetchUrlContent(rawUrl) {
  // Node.js v22+ exits with code 13 if top-level awaits are unresolved when event loop
  // drains. Use Promise.race with an explicit JS setTimeout so the event loop stays alive
  // even while the TCP/TLS connection is still being established.
  const TIMEOUT_MS = 8000
  const timeoutPromise = new Promise(resolve => setTimeout(resolve, TIMEOUT_MS, null))

  const fetchPromise = new Promise((resolve) => {
    try {
      const urlObj = new URL(rawUrl)
      const proto = urlObj.protocol === 'https:' ? https : http
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      }
      const req = proto.get(options, (res) => {
        // Follow one level of redirect
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          resolve(fetchUrlContent(res.headers.location))
          return
        }
        if (res.statusCode !== 200) { resolve(null); return }
        const chunks = []
        let size = 0
        res.on('data', c => {
          chunks.push(c)
          size += c.length
          if (size > 150000) req.destroy() // cap at ~150KB
        })
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      })
      req.on('error', () => resolve(null))
      req.setTimeout(6000, () => { req.destroy(); resolve(null) })
    } catch { resolve(null) }
  })

  return Promise.race([fetchPromise, timeoutPromise])
}

/**
 * Fetch top SERP pages and extract H2 headings + word count
 * @param {Array<{url: string, title: string}>} serpResults
 * @returns {Promise<Array<{url: string, title: string, h2s: string[], wordCount: number}>>}
 */
async function fetchSerpContent(serpResults) {
  const targets = serpResults.slice(0, 3)
  const results = []

  for (const result of targets) {
    try {
      const html = await fetchUrlContent(result.url)
      if (!html) continue

      // Extract H2 tags
      const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
        .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
        .filter(h => h.length > 3 && h.length < 200)
        .slice(0, 8)

      // Estimate word count from body text
      const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i)
      const text = (bodyMatch?.[1] || html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const wordCount = text.split(' ').filter(w => w.length > 2).length

      if (h2s.length > 0 || wordCount > 100) {
        results.push({ url: result.url, title: result.title, h2s, wordCount })
      }
    } catch { /* skip */ }
  }
  return results
}

// ─── F3.1: Find cluster posts for pillar generation ──────────────────────────

/**
 * Finds existing posts that are topically related to a pillar keyword.
 * Used to build the `cluster` frontmatter field and inject internal links.
 *
 * Scoring: token overlap between post title/slug/tags and the keyword.
 * Returns up to 8 most relevant slugs (excluding the pillar itself).
 *
 * @param {string} keyword
 * @param {string} category — narrows to same-category posts first
 * @returns {Array<{slug: string, title: string, score: number}>}
 */
function findClusterPosts(keyword, category = '') {
  const blogDir = path.join(ROOT, 'content', 'blog')
  if (!fs.existsSync(blogDir)) return []

  const tokenize = (text) => new Set(
    text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
  )

  const kwTokens = tokenize(keyword)

  return fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => {
      const raw = fs.readFileSync(path.join(blogDir, f), 'utf-8')
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
      if (!fmMatch) return null
      const fm = {}
      fmMatch[1].split('\n').forEach(line => {
        const colonIdx = line.indexOf(':')
        if (colonIdx === -1) return
        fm[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, '')
      })
      const slug = fm.slug || f.replace('.mdx', '')
      const title = fm.title || ''
      const tags  = fm.tags || ''
      const postCat = fm.category || ''

      const postTokens = tokenize(`${slug} ${title} ${tags}`)
      let score = 0
      for (const t of kwTokens) {
        if (postTokens.has(t)) score++
      }
      // Bonus for same category
      if (category && postCat === category) score += 1

      return { slug, title, score, category: postCat }
    })
    .filter(p => p && p.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

// ─── FALLBACK images (already verified working) ──────────────────────────────

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/7651751/pexels-photo-7651751.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
]

// callAnthropic importado de ./anthropic-client.mjs (com retry + cost tracking)

// ─── Parse slug from generated MDX frontmatter ───────────────────────────────

function extractFrontmatter(mdx) {
  const match = mdx.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':')
    if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
  })
  return fm
}

function cleanMdxOutput(raw) {
  // Strip wrapping code blocks if model added them
  let cleaned = raw.trim()
  if (cleaned.startsWith('```mdx')) cleaned = cleaned.slice(6)
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()

  // Strip {#anchor-id} from headings — MDX parses {} as JSX, breaking the build
  cleaned = cleaned.replace(/^(#{1,6}\s+.+?) \{#[^}]+\}$/gm, '$1')

  // Fix model sometimes merging hr separator with heading: "---## Heading" → "---\n\n## Heading"
  cleaned = cleaned.replace(/^---##\s+/gm, '---\n\n## ')

  return cleaned
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * @param {string} keyword  Target keyword in Portuguese
 * @param {object} options
 * @param {boolean} options.dryRun     Don't save to disk
 * @param {string}  options.category   Override category (default: auto)
 * @param {string}  options.type       'post' (default) | 'pillar'
 * @returns {Promise<{slug: string, filePath: string, title: string, wordCount: number, type: string}>}
 */
export async function generatePost(keyword, options = {}) {
  const { dryRun = false, type = 'post' } = options
  const isPillar = type === 'pillar'

  console.log(`\n🤖  Gerando ${isPillar ? 'POST PILAR' : 'post'} para keyword: "${keyword}"`)

  // F3.1: Pre-compute cluster posts for pillar mode
  const clusterPosts = isPillar ? findClusterPosts(keyword) : []
  if (isPillar && clusterPosts.length > 0) {
    console.log(`🏛️  F3.1: ${clusterPosts.length} posts satélites detectados no cluster`)
    clusterPosts.forEach(p => console.log(`   - /pt-br/blog/${p.slug} (score: ${p.score})`))
  }

  // 1. Gather all context in parallel
  console.log('📚  Carregando contexto...')
  const [serpResults, pexelsImage] = await Promise.all([
    braveSearch(keyword, 5),
    fetchPexelsImage(keyword),
  ])

  // T3.11: Load few-shot examples (T4.20: rating-prioritized) — controlled by config
  const fewShotExamples = config.intelligence.fewShotExamples ? loadFewShotExamples() : ''
  if (fewShotExamples) {
    console.log('📖  T3.11+T4.20: Few-shot examples carregados (priorizados por rating)')
  }

  // T4.20: Load prompt refinements — controlled by config
  const promptRefinements = config.intelligence.qualityRefinements ? loadPromptRefinements() : ''
  if (promptRefinements) {
    console.log('⭐  T4.20: Refinamentos de qualidade carregados')
  }

  // B2: Fetch real content from top SERP pages for competitive gap analysis
  console.log('🌐  B2: Analisando conteúdo dos top resultados SERP...')
  const serpContent = await fetchSerpContent(serpResults)
  if (serpContent.length > 0) {
    console.log(`    Analisados: ${serpContent.length} página(s)`)
  } else {
    console.log('    Nenhum conteúdo SERP disponível — continuando sem análise competitiva')
  }

  const claudeMd       = loadPromptContext('generate-post') // T2.8: modular prompt
  const postSchema     = loadPostSchema()
  const gscInsights    = loadGscInsights()
  const existingPosts  = loadExistingPosts()
  const todayDate      = today()
  const imageUrl       = pexelsImage || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
  const imageAlt       = generateImageAlt(keyword) // F3.2

  // F1.1: Author EEAT data from config
  const author = config.author || {}
  const authorName     = author.name     || 'Thiago Lisboa'
  const authorTitle    = author.title    || 'CEO & Co-founder, Chattie'
  const authorBio      = author.bio      || ''
  const authorLinkedIn = author.linkedIn || ''

  // 2. Build SERP summary
  const serpSummary = serpResults.length > 0
    ? serpResults.map(r => `${r.position}. "${r.title}" — ${r.url}\n   ${r.description?.slice(0, 150)}`).join('\n')
    : 'Nenhum dado de SERP disponível — escreva com base no conhecimento do produto.'

  // B2: Build competitive content analysis
  const serpContentSummary = serpContent.length > 0
    ? serpContent.map((s, i) => {
        const h2List = s.h2s.length > 0 ? s.h2s.map(h => `     - ${h}`).join('\n') : '     (H2s não extraídos)'
        return `${i + 1}. "${s.title}" (~${s.wordCount} palavras)\n${h2List}`
      }).join('\n\n')
    : null

  // 3. Build existing posts list for internal linking
  const postsList = existingPosts
    .map(p => `- /pt-br/blog/${p.slug} → "${p.title}"`)
    .join('\n')

  // F3.1: Build cluster links list for pillar mode
  const clusterLinksList = clusterPosts.length > 0
    ? clusterPosts.map(p => `- [${p.title || p.slug}](/pt-br/blog/${p.slug})`).join('\n')
    : ''

  // F3.1: Pillar-mode system addendum
  const pillarSystemAddendum = isPillar ? `
## MODO PILAR — Regras especiais (sobrepõem as regras padrão de tamanho)

Você está criando um POST PILAR — o conteúdo central de um cluster temático.

Regras obrigatórias:
- Mínimo 3500 palavras de conteúdo (sem contar frontmatter)
- Inclua um "## Índice" (Table of Contents) logo após o primeiro parágrafo introdutório
  com links markdown para todas as seções H2 do post
- Cubra TODOS os sub-tópicos relevantes da keyword-tema — o pilar deve ser a referência completa
- Cada seção H2 deve ter pelo menos 300 palavras
- Inclua 5-8 internal links para os posts satélites listados abaixo (linkando naturalmente no texto)
- Frontmatter especial obrigatório:
  type: "pillar"
  cluster: ["slug1", "slug2", "slug3"] ← slugs dos posts satélites que você linkará
- structuredData deve ser "faq" (pilar sempre tem FAQ completo com 5+ perguntas)
` : ''

  // 4. System prompt
  const systemPrompt = `Você é o Dexter, agente de conteúdo autônomo do Chattie Blog. Seu trabalho é criar posts de blog PT-BR de alta qualidade para o Chattie, um AI SDR para LinkedIn.

## Regras e contexto do projeto

${claudeMd}

## Schema obrigatório do frontmatter

${postSchema}

## Posts existentes para links internos

Use estes slugs para links internos naturais (inclua 2-3 no post):
${postsList}

${pillarSystemAddendum}

## Dados do autor (EEAT — injete EXATAMENTE estes valores no frontmatter)

author: "${authorName}"
authorTitle: "${authorTitle}"
authorBio: "${authorBio}"
authorLinkedIn: "${authorLinkedIn}"

Estes campos são obrigatórios no frontmatter. Copie-os exatamente como estão acima.

${fewShotExamples}

${promptRefinements}

## Data de hoje
${todayDate}

## Imagem de capa já definida
URL: ${imageUrl}
Alt text (F3.2 — SEO): "${imageAlt}"
Use este alt text exatamente no campo imageAlt do frontmatter.

## Regras de output

CRÍTICO: Responda APENAS com o conteúdo MDX bruto, começando com --- (frontmatter).
Não inclua explicações, não envolva em code blocks, não adicione texto antes ou depois.
O output deve começar exatamente com:
---
title:`

  // 5. User prompt
  const userPrompt = `Crie um ${isPillar ? 'POST PILAR' : 'post'} PT-BR completo para a keyword: "${keyword}"

## Contexto SERP (top resultados para essa keyword no Google Brasil)

${serpSummary}
${serpContentSummary ? `
## Análise competitiva de conteúdo (B2 — H2s e tamanho dos top concorrentes)

Use para identificar gaps e diferenciar o post — não copie, supere:
${serpContentSummary}

Insights para diferenciação:
- Se concorrentes têm <1500 palavras, escreva mais profundo (≥2000)
- Se todos cobrem os mesmos H2s, adicione ângulos que eles ignoram
- Foque em casos de uso específicos do ICP (founders/SDRs B2B brasileiros)
` : ''}
## Dados do GSC (para contextualizar prioridade)

${gscInsights || 'Blog novo — sem dados históricos ainda.'}

## Instruções específicas para este post

1. Mínimo de ${isPillar ? '3500' : '1800'} palavras de conteúdo (não conte o frontmatter)${isPillar ? ' — cada H2 deve ter pelo menos 300 palavras' : ''}
2. Keyword "${keyword}" no título, description e primeiro parágrafo
3. Estrutura de H2 usando perguntas reais do ICP: founders, consultores e SDRs B2B brasileiros
4. Começar cada H2 com a resposta direta antes de desenvolver
5. Incluir 2-3 internal links naturais usando os slugs da lista acima
6. Seção FAQ ao final com mínimo 4 perguntas relevantes
7. structuredData: "faq" (tem seção FAQ)
8. geoOptimized: true
9. Fontes permitidas APENAS: LinkedIn, McKinsey, HubSpot, Salesforce, Gartner, Forrester, TRA
10. Se não tiver fonte verificável: use "Benchmarks de outbound B2B indicam..." (sem atribuição)
11. CTA final deve linkar para https://trychattie.com/pt-br
12. Tom: direto, técnico, sem floreio, sem motivação vazia
13. category: escolha uma de: social-selling, linkedin, ia-para-vendas, chattie
14. image: "${imageUrl}" — use esta URL exata
15. imageAlt: "${imageAlt}" — use este alt text exato (campo obrigatório para SEO de imagem)
16. author, authorTitle, authorBio, authorLinkedIn: copie EXATAMENTE da seção "Dados do autor" acima
17. Adicione ao final do post uma seção "## Referências" com 3-5 fontes reais consultadas.
    Inclua APENAS fontes aprovadas (LinkedIn, McKinsey, HubSpot, Salesforce, Gartner, Forrester, TRA).
    Use o formato: "- **[Nome da Fonte]** — [breve descrição do dado citado]([URL se disponível])"
    Se não tiver URLs verificáveis, liste apenas o nome da fonte e o dado referenciado.
    Não invente URLs. Se não tiver certeza, escreva: "- **[Fonte]** — [dado citado]"

${isPillar && clusterLinksList ? `## F3.1 — Posts satélites do cluster (link naturalmente no texto do pilar)

Estes posts existentes devem ser referenciados com links internos no corpo do post:
${clusterLinksList}

Inclua também no frontmatter:
cluster: [${clusterPosts.map(p => `"${p.slug}"`).join(', ')}]

` : ''}${config.intelligence.geoInstructions ? `## T3.14 — GEO: Instruções para ser citado por LLMs (ChatGPT, Gemini, Perplexity)

Aplique TODAS as seguintes técnicas GEO neste post:

**Definições explícitas** — defina cada conceito novo em 1 frase clara:
  Ex: "SDR (Sales Development Representative) é o profissional responsável pela prospecção ativa de leads."

**Respostas diretas antes de desenvolver** — cada H2 deve ter uma resposta direta nas primeiras 2 frases antes de elaborar. LLMs usam esses trechos como snippets.

**Listas com labels claros** — em vez de "há três motivos", use:
  - **Motivo 1 — [nome]**: [explicação]
  - **Motivo 2 — [nome]**: [explicação]

**Comparações nomeadas** — ao comparar ferramentas ou abordagens, sempre nomeie os dois lados:
  Ex: "Outbound via LinkedIn converte X% mais que cold email porque..."

**Entidades citáveis** — mencione empresas reais, ferramentas, pessoas e dados que LLMs podem verificar:
  Ex: "Segundo o LinkedIn State of Sales Report 2024...", "Ferramentas como Chattie, Outreach e Apollo..."

**Estrutura de perguntas e respostas** — formule H2s como perguntas reais que o ICP googla:
  Ex: "Como prospectar no LinkedIn sem parecer vendedor?" (não: "Prospecção no LinkedIn")

**Resumo executivo** — inclua um parágrafo de síntese no início do post (após o primeiro parágrafo de contexto) com os principais pontos do artigo em 3-4 bullets.
` : ''}
Responda APENAS com o MDX, começando com --- (frontmatter).`

  // 6. Call Anthropic
  // Pillar posts (3500+ words) need more generation time — use 5 min timeout
  const generateTimeoutMs = isPillar ? 300000 : 180000
  console.log(`🧠  Chamando Anthropic API (${config.budget.anthropicModel})...`)
  const rawOutput = await callAnthropic(systemPrompt, userPrompt, {
    label: 'generate-post',
    model: config.budget.anthropicModel,
    maxTokens: isPillar ? 16000 : 8192,
    timeoutMs: generateTimeoutMs,
  })
  const mdxContent = cleanMdxOutput(rawOutput)

  if (!mdxContent.startsWith('---')) {
    throw new Error(`Output inválido — não começa com frontmatter:\n${mdxContent.slice(0, 200)}`)
  }


  // 7. T1.4: Grounding verification — controlled by config
  let postAfterGrounding = mdxContent
  if (config.quality.groundingVerify) {
    console.log('\n📐  T1.4: Verificando afirmações estatísticas...')
    const groundedMdx = await groundingVerify(mdxContent, keyword)
    postAfterGrounding = groundedMdx !== mdxContent ? groundedMdx : mdxContent
  }

  // 7b. T3.12: Featured snippet optimization — controlled by config
  let finalGroundedMdx = postAfterGrounding
  if (config.quality.snippetOptimize) {
    const snippetMdx = await snippetOptimize(postAfterGrounding, keyword)
    finalGroundedMdx = snippetMdx !== postAfterGrounding ? snippetMdx : postAfterGrounding
  }

  // 8. Extract metadata from generated content
  const fm = extractFrontmatter(finalGroundedMdx)
  const slug = fm.slug || slugify(keyword)
  const title = fm.title || keyword
  const wordCount = countWords(finalGroundedMdx)

  console.log(`📝  Post gerado: "${title}"`)
  console.log(`    Slug: ${slug}`)
  console.log(`    Palavras: ~${wordCount}`)

  // A1: Bloquear post curto — pilar tem mínimo maior
  const MIN_WORDS = isPillar ? 3000 : config.content.minWordCount
  if (wordCount < MIN_WORDS) {
    throw new Error(
      `Post muito curto: ${wordCount} palavras (mínimo ${MIN_WORDS}). ` +
      `O modelo não gerou conteúdo suficiente para a keyword "${keyword}". ` +
      `Tente novamente ou use --keyword diferente.`
    )
  }

  // 9. Ensure image, readTime, dateModified and EEAT author fields are in frontmatter
  let finalMdx = finalGroundedMdx
  if (!finalMdx.includes('image:')) {
    finalMdx = finalMdx.replace(/\nauthor:/, `\nimage: "${imageUrl}"\nauthor:`)
  }
  if (!finalMdx.includes('readTime:')) {
    finalMdx = finalMdx.replace(/\nauthor:/, `\nreadTime: "${estimateReadTime(wordCount)}"\nauthor:`)
  }
  if (!finalMdx.includes('dateModified:')) {
    finalMdx = finalMdx.replace(/\npublishedAt:/, `\ndateModified: "${todayDate}"\npublishedAt:`)
  }

  // F3.2: Inject imageAlt if the model omitted it
  if (!finalMdx.includes('imageAlt:')) {
    finalMdx = finalMdx.replace(/(\nimage:[^\n]+)/, `$1\nimageAlt: "${imageAlt}"`)
  }

  // F1.1: Inject EEAT author fields after `author:` line if the model omitted them (safety net)
  if (authorTitle && !finalMdx.includes('authorTitle:')) {
    finalMdx = finalMdx.replace(/(\nauthor:[^\n]+)/, `$1\nauthorTitle: "${authorTitle}"`)
  }
  if (authorBio && !finalMdx.includes('authorBio:')) {
    finalMdx = finalMdx.replace(/(\nauthor:[^\n]+)/, `$1\nauthorBio: "${authorBio}"`)
  }
  if (authorLinkedIn && !finalMdx.includes('authorLinkedIn:')) {
    finalMdx = finalMdx.replace(/(\nauthor:[^\n]+)/, `$1\nauthorLinkedIn: "${authorLinkedIn}"`)
  }

  // 9. Save to disk
  const filePath = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)

  if (dryRun) {
    console.log('\n--- DRY RUN — conteúdo gerado (não salvo) ---\n')
    console.log(finalMdx.slice(0, 500) + '\n...[truncado]')
  } else {
    // Check if slug already exists
    if (fs.existsSync(filePath)) {
      throw new Error(`Post já existe: ${filePath}. Use um slug diferente.`)
    }
    fs.writeFileSync(filePath, finalMdx, 'utf-8')
    console.log(`✅  Salvo em: content/blog/${slug}.mdx`)
  }

  return { slug, filePath, title, wordCount, type }
}

// ─── Mark keyword as published in backlog ────────────────────────────────────

export function markKeywordPublished(keyword, slug) {
  const backlogPath = path.join(ROOT, 'docs', 'keyword-backlog.md')
  if (!fs.existsSync(backlogPath)) return

  let content = fs.readFileSync(backlogPath, 'utf-8')

  // Find the row with this keyword and update status
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rowPattern = new RegExp(
    `(\\|\\s*${escaped}\\s*\\|[^\\n]+\\|)\\s*pendente\\s*(\\|)`,
    'i'
  )

  if (rowPattern.test(content)) {
    content = content.replace(rowPattern, `$1 publicado (\`/pt-br/blog/${slug}\`) $2`)
    fs.writeFileSync(backlogPath, content, 'utf-8')
    console.log(`📋  Backlog atualizado: "${keyword}" → publicado`)
  } else {
    console.warn(`⚠️  Keyword não encontrada no backlog: "${keyword}"`)
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const kwArg = process.argv.find(a => a.startsWith('--keyword='))
  if (!kwArg) {
    console.error('Uso: node scripts/generate-post.mjs --keyword="keyword aqui"')
    process.exit(1)
  }

  const keyword = kwArg.split('=').slice(1).join('=').replace(/^"|"$/g, '')
  const dryRun = process.argv.includes('--dry-run')

  try {
    const result = await generatePost(keyword, { dryRun })
    if (!dryRun) {
      markKeywordPublished(keyword, result.slug)

      // Run source audit on the new post
      console.log('\n🔍  Rodando source-audit...')
      const { execSync } = await import('child_process')
      try {
        execSync('node scripts/source-audit.mjs', { cwd: ROOT, stdio: 'inherit' })
      } catch {
        console.error('❌  Source audit falhou. Revise o post antes de commitar.')
        process.exit(1)
      }
    }
    console.log('\n✅  Post gerado com sucesso!')
  } catch (err) {
    console.error(`\n❌  Erro: ${err.message}`)
    process.exit(1)
  }
}

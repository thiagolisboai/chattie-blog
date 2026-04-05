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
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { braveSearch } from './brave-search.mjs'

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

function loadPostSchema() {
  const p = path.join(ROOT, 'docs', 'post-schema-pt.md')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
}

function loadGscInsights() {
  const p = path.join(ROOT, 'docs', 'gsc-insights.md')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').slice(0, 2000) : ''
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
      return { slug: fm.slug || f.replace('.mdx', ''), title: fm.title || '' }
    })
    .filter(Boolean)
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

// ─── FALLBACK images (already verified working) ──────────────────────────────

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/7651751/pexels-photo-7651751.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
]

// ─── Anthropic API call ───────────────────────────────────────────────────────

async function callAnthropic(systemPrompt, userPrompt) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurado')

  const body = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          if (json.error) reject(new Error(`Anthropic: ${json.error.message}`))
          else resolve(json.content?.[0]?.text || '')
        } catch (e) { reject(e) }
      })
    })

    req.on('error', reject)
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Anthropic timeout')) })
    req.write(body)
    req.end()
  })
}

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
  return cleaned.trim()
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * @param {string} keyword  Target keyword in Portuguese
 * @param {object} options
 * @param {boolean} options.dryRun     Don't save to disk
 * @param {string}  options.category   Override category (default: auto)
 * @returns {Promise<{slug: string, filePath: string, title: string, wordCount: number}>}
 */
export async function generatePost(keyword, options = {}) {
  const { dryRun = false } = options

  console.log(`\n🤖  Gerando post para keyword: "${keyword}"`)

  // 1. Gather all context in parallel
  console.log('📚  Carregando contexto...')
  const [serpResults, pexelsImage] = await Promise.all([
    braveSearch(keyword, 5),
    fetchPexelsImage(keyword),
  ])

  const claudeMd       = loadClaudeMd()
  const postSchema     = loadPostSchema()
  const gscInsights    = loadGscInsights()
  const existingPosts  = loadExistingPosts()
  const todayDate      = today()
  const imageUrl       = pexelsImage || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]

  // 2. Build SERP summary
  const serpSummary = serpResults.length > 0
    ? serpResults.map(r => `${r.position}. "${r.title}" — ${r.url}\n   ${r.description?.slice(0, 150)}`).join('\n')
    : 'Nenhum dado de SERP disponível — escreva com base no conhecimento do produto.'

  // 3. Build existing posts list for internal linking
  const postsList = existingPosts
    .map(p => `- /pt-br/blog/${p.slug} → "${p.title}"`)
    .join('\n')

  // 4. System prompt
  const systemPrompt = `Você é o Dexter, agente de conteúdo autônomo do Chattie Blog. Seu trabalho é criar posts de blog PT-BR de alta qualidade para o Chattie, um AI SDR para LinkedIn.

## Regras e contexto do projeto

${claudeMd}

## Schema obrigatório do frontmatter

${postSchema}

## Posts existentes para links internos

Use estes slugs para links internos naturais (inclua 2-3 no post):
${postsList}

## Data de hoje
${todayDate}

## Imagem de capa já definida
${imageUrl}

## Regras de output

CRÍTICO: Responda APENAS com o conteúdo MDX bruto, começando com --- (frontmatter).
Não inclua explicações, não envolva em code blocks, não adicione texto antes ou depois.
O output deve começar exatamente com:
---
title:`

  // 5. User prompt
  const userPrompt = `Crie um post PT-BR completo para a keyword: "${keyword}"

## Contexto SERP (top resultados para essa keyword no Google Brasil)

${serpSummary}

## Dados do GSC (para contextualizar prioridade)

${gscInsights || 'Blog novo — sem dados históricos ainda.'}

## Instruções específicas para este post

1. Mínimo de 1800 palavras de conteúdo (não conte o frontmatter)
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
14. Use a imagem: ${imageUrl}

Responda APENAS com o MDX, começando com --- (frontmatter).`

  // 6. Call Anthropic
  console.log('🧠  Chamando Anthropic API (claude-sonnet-4-6)...')
  const rawOutput = await callAnthropic(systemPrompt, userPrompt)
  const mdxContent = cleanMdxOutput(rawOutput)

  if (!mdxContent.startsWith('---')) {
    throw new Error(`Output inválido — não começa com frontmatter:\n${mdxContent.slice(0, 200)}`)
  }

  // 7. Extract metadata from generated content
  const fm = extractFrontmatter(mdxContent)
  const slug = fm.slug || slugify(keyword)
  const title = fm.title || keyword
  const wordCount = countWords(mdxContent)

  console.log(`📝  Post gerado: "${title}"`)
  console.log(`    Slug: ${slug}`)
  console.log(`    Palavras: ~${wordCount}`)

  // A1: Bloquear post curto — mínimo 1600 palavras (tolerância de 200 abaixo dos 1800 do brief)
  const MIN_WORDS = 1600
  if (wordCount < MIN_WORDS) {
    throw new Error(
      `Post muito curto: ${wordCount} palavras (mínimo ${MIN_WORDS}). ` +
      `O modelo não gerou conteúdo suficiente para a keyword "${keyword}". ` +
      `Tente novamente ou use --keyword diferente.`
    )
  }

  // 8. Ensure image and readTime are in frontmatter
  let finalMdx = mdxContent
  if (!finalMdx.includes('image:')) {
    finalMdx = finalMdx.replace(/^---\n/, `---\n`)
      .replace(/\nauthor:/, `\nimage: "${imageUrl}"\nauthor:`)
  }
  if (!finalMdx.includes('readTime:')) {
    finalMdx = finalMdx.replace(/\nauthor:/, `\nreadTime: "${estimateReadTime(wordCount)}"\nauthor:`)
  }
  if (!finalMdx.includes('dateModified:')) {
    finalMdx = finalMdx.replace(/\npublishedAt:/, `\ndateModified: "${todayDate}"\npublishedAt:`)
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

  return { slug, filePath, title, wordCount }
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

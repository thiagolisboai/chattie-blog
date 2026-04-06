/**
 * Generate Post EN — C2 da Fase C de Autonomia Total
 *
 * Após PT-BR atingir > 50 cliques em 45 dias, gera automaticamente o par EN.
 * Adapta (não traduz): exemplos globais, fontes em EN, tom ajustado para audience internacional.
 *
 * Uso:
 *   node scripts/generate-post-en.mjs                    (auto: detecta candidatos via GSC)
 *   node scripts/generate-post-en.mjs --slug=meu-slug    (forçar um slug especifico)
 *   node scripts/generate-post-en.mjs --dry-run
 *
 * Requer:
 *   ANTHROPIC_API_KEY, PEXELS_API_KEY, BRAVE_API_KEY
 *   GSC_KEY_FILE, GSC_SITE_URL
 */

import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'
import { braveSearch } from './brave-search.mjs'
import { callAnthropic } from './anthropic-client.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BLOG_DIR    = path.join(ROOT, 'content', 'blog')
const BLOG_EN_DIR = path.join(ROOT, 'content', 'blog-en')

const DRY_RUN  = process.argv.includes('--dry-run')
const slugArg  = process.argv.find(a => a.startsWith('--slug='))
const FORCE_SLUG = slugArg ? slugArg.split('=').slice(1).join('=') : null

// ── Tier 1: critério ideal (blog maduro, dados GSC disponíveis) ────────────────
const MIN_CLICKS   = 50   // cliques em 45 dias via GSC
const MIN_AGE_DAYS = 45   // dias desde a publicação

// ── Tier 2: fallback para blog novo (sem dados GSC suficientes) ────────────────
// Ativado quando Tier 1 não retorna nenhum candidato.
// Seleciona o post PT-BR mais antigo sem par EN — sem exigir cliques mínimos.
// Garante que o agente sempre entrega ao menos um post EN por execução.
const FALLBACK_MIN_AGE_DAYS = 0   // qualquer post publicado é elegível no fallback
const FALLBACK_MIN_CLICKS   = 0   // sem exigência de cliques no fallback

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

function today() { return new Date().toISOString().split('T')[0] }

function slugify(text) {
  return text.toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60)
}

function dateMinus(days) {
  const d = new Date(); d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function daysBetween(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
}

// ─── Parse frontmatter ────────────────────────────────────────────────────────

function parseFm(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { raw, fm: {} }
  const fm = {}
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':')
    if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
  })
  return { raw, fm }
}

// ─── GSC: Get clicks for a PT-BR post ────────────────────────────────────────

async function getPostClicks(slug) {
  const KEY_FILE = process.env.GSC_KEY_FILE
  const SITE_URL = process.env.GSC_SITE_URL || 'https://trychattie.com/'

  if (!KEY_FILE || !fs.existsSync(KEY_FILE)) return null

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
    const sc = google.searchconsole({ version: 'v1', auth })
    const pageUrl = `${SITE_URL.replace(/\/$/, '')}/pt-br/blog/${slug}`

    const res = await sc.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: dateMinus(MIN_AGE_DAYS + 3),
        endDate: dateMinus(3),
        dimensions: ['page'],
        rowLimit: 1,
        dimensionFilterGroups: [{
          filters: [{ dimension: 'page', operator: 'equals', expression: pageUrl }],
        }],
      },
    })

    const rows = res.data.rows || []
    return rows.length > 0 ? rows[0].clicks : 0
  } catch {
    return null // graceful degradation
  }
}

// ─── Find EN generation candidates ───────────────────────────────────────────

/**
 * Estratégia de dois níveis para blog em qualquer fase de maturidade:
 *
 * Tier 1 — critério ideal (blog maduro):
 *   Post PT-BR publicado há >45 dias E com >50 cliques via GSC.
 *   Garante qualidade máxima: só adapta posts comprovadamente relevantes.
 *
 * Tier 2 — fallback (blog novo / GSC ainda sem dados):
 *   Ativado quando Tier 1 retorna 0 candidatos.
 *   Seleciona o post PT-BR mais antigo sem par EN, sem exigir cliques.
 *   Garante que o agente nunca fica bloqueado esperando dados GSC.
 *
 * Exit 2 só ocorre se não há NENHUM post PT-BR sem par EN (blog 100% traduzido).
 */
async function findCandidates() {
  if (!fs.existsSync(BLOG_DIR)) return { candidates: [], tier: 0 }
  if (!fs.existsSync(BLOG_EN_DIR)) fs.mkdirSync(BLOG_EN_DIR, { recursive: true })

  // Get all EN posts to know which PT-BR posts already have a pair
  const existingEnSlugs = new Set(
    fs.readdirSync(BLOG_EN_DIR)
      .filter(f => f.endsWith('.mdx'))
      .map(f => f.replace('.mdx', ''))
  )

  // Build pool of all PT-BR posts without EN pair
  const pool = []
  for (const file of fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))) {
    const slug = file.replace('.mdx', '')
    const filePath = path.join(BLOG_DIR, file)
    const { fm } = parseFm(filePath)

    // Skip if EN pair already exists
    if (fm.enSlug || existingEnSlugs.has(slug) || existingEnSlugs.has(`${slug}-en`)) continue

    const publishDate = fm.date || fm.publishedAt?.split('T')[0]
    if (!publishDate) continue

    // Check clicks via GSC
    const clicks = await getPostClicks(slug)
    const age = daysBetween(publishDate)
    console.log(`   ${slug}: ${clicks ?? 'n/a'} cliques, ${age} dias`)

    pool.push({ slug, filePath, fm, clicks, publishDate, age })
  }

  if (pool.length === 0) {
    console.log('✅  Todos os posts PT-BR já têm par EN. Nada a fazer.')
    return { candidates: [], tier: 0 }
  }

  // ── Tier 1: critério ideal ─────────────────────────────────────────────────
  const tier1 = pool.filter(p =>
    p.age >= MIN_AGE_DAYS &&
    (p.clicks === null || p.clicks >= MIN_CLICKS) // null = GSC indisponível, não bloqueia
  )

  if (tier1.length > 0) {
    console.log(`\n✅  Tier 1: ${tier1.length} candidato(s) com critério ideal (>=${MIN_AGE_DAYS} dias, >=${MIN_CLICKS} cliques)`)
    return { candidates: tier1, tier: 1 }
  }

  // ── Tier 2: fallback (blog novo / sem dados GSC) ────────────────────────────
  console.log(`\n⚠️  Tier 1: nenhum candidato elegível (critério: >=${MIN_AGE_DAYS} dias + >=${MIN_CLICKS} cliques)`)
  console.log('   → Ativando Tier 2 (fallback): selecionando post mais antigo sem par EN...')

  // Sort by age descending (oldest first) — mais provável de ter recebido alguma indexação
  const tier2 = [...pool].sort((a, b) => b.age - a.age)
  const best = tier2[0]
  console.log(`   → Candidato Tier 2: "${best.slug}" (${best.age} dias, ${best.clicks ?? 'n/a'} cliques)`)

  return { candidates: [best], tier: 2 }
}

// ─── Pexels image fetch (EN keywords) ────────────────────────────────────────

async function fetchPexelsImage(keyword) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null

  const params = new URLSearchParams({ query: keyword, per_page: '5', orientation: 'landscape' })
  return new Promise((resolve) => {
    const req = https.get(
      { hostname: 'api.pexels.com', path: `/v1/search?${params}`, headers: { Authorization: key } },
      (res) => {
        const chunks = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString())
            const photos = json.photos || []
            resolve(photos.length > 0 ? photos[0].src.large2x : null)
          } catch { resolve(null) }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.setTimeout(8000, () => { req.destroy(); resolve(null) })
  })
}

// callAnthropic importado de ./anthropic-client.mjs (com retry + cost tracking)

// ─── Generate EN adaptation ───────────────────────────────────────────────────

async function generateEnPost(ptSlug, ptFilePath, ptFm) {
  const ptContent = fs.readFileSync(ptFilePath, 'utf-8')

  // Get English SERP context
  const enKeyword = ptFm.title
    ?.replace(/PT-BR|português/gi, '')
    .replace(/LinkedIn/i, 'LinkedIn')
    .trim() || ptSlug.replace(/-/g, ' ')

  console.log(`\n🌐  Pesquisando SERP EN para: "${enKeyword}"`)
  const [serpResults, pexelsImage] = await Promise.all([
    braveSearch(enKeyword, 5),
    fetchPexelsImage(enKeyword),
  ])

  const serpSummary = serpResults.length > 0
    ? serpResults.map(r => `${r.position}. "${r.title}" — ${r.url}\n   ${r.description?.slice(0, 150)}`).join('\n')
    : 'No English SERP data available.'

  const imageUrl = pexelsImage || 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'

  const postSchema = fs.existsSync(path.join(ROOT, 'docs', 'post-schema-en.md'))
    ? fs.readFileSync(path.join(ROOT, 'docs', 'post-schema-en.md'), 'utf-8')
    : ''

  // Load existing EN posts for internal linking
  const enPosts = fs.existsSync(BLOG_EN_DIR)
    ? fs.readdirSync(BLOG_EN_DIR).filter(f => f.endsWith('.mdx')).map(f => {
        const fm = parseFm(path.join(BLOG_EN_DIR, f)).fm
        return { slug: f.replace('.mdx', ''), title: fm.title || '' }
      })
    : []

  const enPostsList = enPosts.map(p => `- /blog/${p.slug} → "${p.title}"`).join('\n') || '(no EN posts yet — omit internal links)'

  const systemPrompt = `You are Dexter, Chattie Blog's autonomous content agent. Your task is to create an English-language adaptation of a Portuguese blog post.

KEY RULES:
- ADAPT, do not translate. Replace Brazilian examples with global ones.
- Adjust tone for international B2B audience (slightly more formal than PT-BR)
- Verify all statistics have English-language sources (LinkedIn, McKinsey, HubSpot, Salesforce, Gartner, Forrester)
- If a Brazilian source has no English equivalent, replace with global data or use "Industry benchmarks suggest..."
- lang: "en" is mandatory
- canonicalUrl format: https://trychattie.com/blog/[slug]
- Minimum 1800 words of body content
- Include ptSlug: "${ptSlug}" in frontmatter
- Respond ONLY with the MDX content starting with ---

## Frontmatter schema
${postSchema}

## Existing EN posts for internal linking
${enPostsList}

## Today's date
${today()}`

  const userPrompt = `Adapt this PT-BR blog post into English for Chattie Blog.

## Original PT-BR post
\`\`\`mdx
${ptContent.slice(0, 6000)}${ptContent.length > 6000 ? '\n...[truncated]' : ''}
\`\`\`

## English SERP context for "${enKeyword}"
${serpSummary}

## Adaptation instructions
1. Translate the core insights and structure, not word-for-word
2. Replace Brazilian-specific examples (e.g., "empresa carioca", "mercado BR") with global equivalents
3. Target audience: B2B founders, consultants, and SDRs using LinkedIn internationally
4. Verify all stats have English-language sources — if unsure, use "Industry data suggests..." without attribution
5. Keep the same slug pattern but adapt to English: ${slugify(ptFm.title || enKeyword)}
6. ptSlug: "${ptSlug}"
7. Cover image: ${imageUrl}
8. Include 2-3 internal links to existing EN posts (list above) where relevant
9. Keep FAQ section with 4+ questions — adapt questions to English-speaking ICP
10. CTA should link to https://trychattie.com/en (global homepage)

Respond ONLY with the complete MDX content starting with ---.`

  console.log('🧠  Chamando Anthropic API para gerar adaptação EN...')
  const rawOutput = await callAnthropic(systemPrompt, userPrompt, { label: 'generate-post-en' })

  let mdxContent = rawOutput.trim()
  if (mdxContent.startsWith('```mdx')) mdxContent = mdxContent.slice(6)
  else if (mdxContent.startsWith('```')) mdxContent = mdxContent.slice(3)
  if (mdxContent.endsWith('```')) mdxContent = mdxContent.slice(0, -3)
  mdxContent = mdxContent.trim()

  if (!mdxContent.startsWith('---')) {
    throw new Error(`Invalid output — does not start with frontmatter:\n${mdxContent.slice(0, 200)}`)
  }

  // Extract slug from generated frontmatter
  const fmMatch = mdxContent.match(/^---\n([\s\S]*?)\n---/)
  const enFm = {}
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const [k, ...v] = line.split(':')
      if (k && v.length) enFm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
    })
  }

  const enSlug = enFm.slug || slugify(enKeyword)
  const wordCount = mdxContent.replace(/---[\s\S]*?---/, '').trim().split(/\s+/).length

  console.log(`📝  Adaptação EN gerada: "${enFm.title || enKeyword}"`)
  console.log(`    Slug: ${enSlug}`)
  console.log(`    Palavras: ~${wordCount}`)

  if (wordCount < 1600) {
    throw new Error(`Post EN muito curto: ${wordCount} palavras (mínimo 1600)`)
  }

  return { mdxContent, enSlug, enFm, wordCount }
}

// ─── Update PT-BR post with enSlug ───────────────────────────────────────────

function updatePtEnSlug(ptFilePath, enSlug) {
  const raw = fs.readFileSync(ptFilePath, 'utf-8')
  if (raw.includes('enSlug:')) return // already set

  const updated = raw.replace(/^---\n/, `---\nenSlug: "${enSlug}"\n`)
  if (!DRY_RUN) fs.writeFileSync(ptFilePath, updated, 'utf-8')
  console.log(`🔗  enSlug "${enSlug}" adicionado ao post PT-BR`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Dexter — Geração de Posts EN (C2)')
  console.log('═══════════════════════════════════════════════════')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌  ANTHROPIC_API_KEY nao configurado.')
    process.exit(1)
  }

  // Determine target post
  let target = null

  if (FORCE_SLUG) {
    const filePath = path.join(BLOG_DIR, `${FORCE_SLUG}.mdx`)
    if (!fs.existsSync(filePath)) {
      console.error(`❌  Post nao encontrado: content/blog/${FORCE_SLUG}.mdx`)
      process.exit(1)
    }
    const { fm } = parseFm(filePath)
    target = { slug: FORCE_SLUG, filePath, fm, clicks: '(forçado)' }
    console.log(`🎯  Slug forçado: ${FORCE_SLUG}`)
  } else {
    console.log(`\n🔍  Buscando candidatos (Tier 1: >=${MIN_CLICKS} cliques em >=${MIN_AGE_DAYS} dias)...`)
    const { candidates, tier } = await findCandidates()

    if (candidates.length === 0) {
      console.log(`ℹ️  Todos os posts PT-BR já têm par EN. Nada a fazer.`)
      process.exit(2)
    }

    if (tier === 1) {
      // Tier 1: pick the post with most clicks (proven demand)
      target = candidates.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
      console.log(`🎯  [Tier 1] Candidato selecionado: ${target.slug} (${target.clicks} cliques, ${target.age} dias)`)
    } else {
      // Tier 2 fallback: already pre-selected (oldest without EN pair)
      target = candidates[0]
      console.log(`🎯  [Tier 2 fallback] Candidato selecionado: ${target.slug} (${target.age} dias, ${target.clicks ?? 'n/a'} cliques)`)
    }
  }

  // Check if EN pair already exists
  const { fm: targetFm } = parseFm(target.filePath)
  if (targetFm.enSlug && !FORCE_SLUG) {
    console.log(`ℹ️  Post já tem par EN: ${targetFm.enSlug}`)
    process.exit(2)
  }

  // Generate EN post
  let enResult
  try {
    enResult = await generateEnPost(target.slug, target.filePath, target.fm || targetFm)
  } catch (err) {
    console.error(`\n❌  Falha ao gerar post EN: ${err.message}`)
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log('\n✅  Dry run — nao salvo')
    console.log(enResult.mdxContent.slice(0, 500) + '\n...')
    process.exit(0)
  }

  // Save EN post
  if (!fs.existsSync(BLOG_EN_DIR)) fs.mkdirSync(BLOG_EN_DIR, { recursive: true })
  const enFilePath = path.join(BLOG_EN_DIR, `${enResult.enSlug}.mdx`)

  if (fs.existsSync(enFilePath)) {
    console.error(`❌  Post EN já existe: content/blog-en/${enResult.enSlug}.mdx`)
    process.exit(1)
  }

  fs.writeFileSync(enFilePath, enResult.mdxContent, 'utf-8')
  console.log(`✅  Salvo: content/blog-en/${enResult.enSlug}.mdx`)

  // Update PT-BR post with enSlug
  updatePtEnSlug(target.filePath, enResult.enSlug)

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`✅  Adaptação EN concluída!`)
  console.log(`   PT-BR: /pt-br/blog/${target.slug}`)
  console.log(`   EN:    /blog/${enResult.enSlug}`)
  console.log(`   Palavras: ~${enResult.wordCount}`)
  console.log('═══════════════════════════════════════════════════')

  // Write to GITHUB_OUTPUT if in CI
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `en_slug=${enResult.enSlug}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `pt_slug=${target.slug}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `title=${enResult.enFm.title || ''}\n`)
  }

  process.exit(0)
}

main().catch(err => {
  console.error(`\n❌  Erro fatal: ${err.message}`)
  process.exit(1)
})

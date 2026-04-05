/**
 * Quality Feedback — T4.20: loop de qualidade humano → refinamento do prompt
 *
 * Problema: o Dexter gera posts autonomamente, mas sem feedback humano ele não
 * aprende quais posts performam bem e quais falham em tom, profundidade ou
 * relevância para o ICP. Com o tempo, o prompt pode derivar para padrões ruins.
 *
 * Solução — pipeline em 4 etapas:
 *   1. **Coleta**: humanos avaliam posts em docs/quality-ratings.jsonl (1-5 estrelas + notas)
 *   2. **Análise**: script extrai padrões de posts bons (4-5★) e ruins (1-2★)
 *   3. **Refinamento**: gera docs/prompt-refinements.md com anti-padrões e melhores práticas
 *   4. **Integração**: loadFewShotExamples() prioriza posts 4-5★; prompt inclui anti-padrões
 *
 * Como adicionar avaliações (formato docs/quality-ratings.jsonl):
 *   {"slug": "como-prospectar-linkedin", "rating": 5, "notes": "Tom perfeito, muito prático", "date": "2025-04-01"}
 *   {"slug": "mensagem-linkedin-b2b", "rating": 2, "notes": "Muito genérico, sem exemplos reais", "date": "2025-04-01"}
 *
 * Uso:
 *   node scripts/quality-feedback.mjs             (análise e relatório)
 *   node scripts/quality-feedback.mjs --rate       (modo interativo para avaliar posts)
 *   node scripts/quality-feedback.mjs --export     (exporta insights formatados para o prompt)
 *
 * Saída:
 *   docs/quality-insights.md    — análise legível dos padrões
 *   docs/prompt-refinements.md  — instruções para o modelo (injetadas no prompt)
 *
 * Fine-tuning (futuro):
 *   Quando a Anthropic disponibilizar fine-tuning para Sonnet, os pares
 *   (prompt, post bem avaliado) em docs/quality-ratings.jsonl servirão como
 *   dataset de treinamento. A estrutura foi pensada para isso.
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'
import { callAnthropic } from './anthropic-client.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const RATE_MODE   = process.argv.includes('--rate')
const EXPORT_MODE = process.argv.includes('--export')

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

// ─── Load ratings ─────────────────────────────────────────────────────────────

const RATINGS_PATH = path.join(ROOT, 'docs', 'quality-ratings.jsonl')

function loadRatings() {
  if (!fs.existsSync(RATINGS_PATH)) return []
  return fs.readFileSync(RATINGS_PATH, 'utf-8')
    .trim().split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l) } catch { return null } })
    .filter(Boolean)
}

function saveRating(entry) {
  fs.appendFileSync(RATINGS_PATH, JSON.stringify(entry) + '\n', 'utf-8')
}

// ─── Load post content ────────────────────────────────────────────────────────

function loadPost(slug) {
  const p = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)
  if (!fs.existsSync(p)) return null
  const raw = fs.readFileSync(p, 'utf-8')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
  const fm = {}
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const [k, ...v] = line.split(':')
      if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
    })
  }
  const body = fmMatch ? raw.slice(fmMatch[0].length).trim() : raw
  const h2s = [...body.matchAll(/^## (.+)$/gm)].map(m => m[1])
  const intro = body.match(/^(.+?)(?:\n\n|\n##)/s)?.[1]?.trim().slice(0, 200) || ''
  return { fm, h2s, intro, body: body.slice(0, 3000) }
}

// ─── Interactive rating mode ──────────────────────────────────────────────────

async function interactiveRate() {
  const blogDir = path.join(ROOT, 'content', 'blog')
  const existingRatings = new Set(loadRatings().map(r => r.slug))

  const unrated = fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace('.mdx', ''))
    .filter(slug => !existingRatings.has(slug))

  if (unrated.length === 0) {
    console.log('✅  Todos os posts já foram avaliados!')
    return
  }

  console.log(`\n📋  ${unrated.length} post(s) sem avaliação`)
  console.log('   Avalie cada post de 1-5 (ou Enter para pular):\n')

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q) => new Promise(resolve => rl.question(q, resolve))

  for (const slug of unrated.slice(0, 10)) { // max 10 por sessão
    const post = loadPost(slug)
    if (!post) continue

    console.log(`\n─────────────────────────────────────`)
    console.log(`Post: "${post.fm.title || slug}"`)
    console.log(`Intro: ${post.intro.slice(0, 120)}...`)
    console.log(`H2s: ${post.h2s.slice(0, 3).join(' | ')}`)

    const rating = await ask('\nAvaliação (1-5, Enter=pular, q=sair): ')

    if (rating.toLowerCase() === 'q') break
    if (!rating.trim() || isNaN(parseInt(rating))) continue

    const stars = Math.min(5, Math.max(1, parseInt(rating)))
    const notes = await ask('Notas (opcional, Enter para pular): ')

    saveRating({
      slug,
      rating: stars,
      notes: notes.trim() || '',
      date: new Date().toISOString().split('T')[0],
    })

    console.log(`✅  Avaliação salva: ${slug} → ${stars}★`)
  }

  rl.close()
  console.log('\n✅  Sessão de avaliação concluída')
}

// ─── Analyze patterns via Claude ──────────────────────────────────────────────

async function analyzePatterns(highRated, lowRated) {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (highRated.length === 0 && lowRated.length === 0) return null

  const systemPrompt = `Você é um especialista em qualidade de conteúdo B2B.
Analise posts de blog avaliados por humanos e identifique padrões.
Seja específico e acionável — evite generalidades.
Foco: tom, estrutura, profundidade, relevância para founders/SDRs B2B brasileiros.`

  const highSummary = highRated.slice(0, 5).map(r => {
    const post = loadPost(r.slug)
    return post ? `[${r.rating}★] "${post.fm.title}"\n  Nota: ${r.notes || 'sem nota'}\n  Intro: ${post.intro.slice(0, 150)}\n  H2s: ${post.h2s.slice(0, 4).join(' | ')}` : null
  }).filter(Boolean).join('\n\n')

  const lowSummary = lowRated.slice(0, 5).map(r => {
    const post = loadPost(r.slug)
    return post ? `[${r.rating}★] "${post.fm.title}"\n  Nota: ${r.notes || 'sem nota'}\n  Intro: ${post.intro.slice(0, 150)}\n  H2s: ${post.h2s.slice(0, 4).join(' | ')}` : null
  }).filter(Boolean).join('\n\n')

  const userPrompt = `Analise os posts avaliados abaixo e extraia:
1. **3-5 padrões dos posts bem avaliados** (o que funciona — seja específico)
2. **3-5 anti-padrões dos posts mal avaliados** (o que evitar — seja específico)
3. **3 instruções para melhorar o prompt do gerador** (acionáveis, em formato de regra)

## Posts bem avaliados (4-5★):
${highSummary || '(nenhum ainda)'}

## Posts mal avaliados (1-2★):
${lowSummary || '(nenhum ainda)'}

Responda em formato markdown, direto ao ponto.`

  return callAnthropic(systemPrompt, userPrompt, {
    label: 'quality-analysis',
    maxTokens: 2048,
  })
}

// ─── Generate prompt refinements ──────────────────────────────────────────────

function generatePromptRefinements(highRated, lowRated, analysis) {
  const today = new Date().toISOString().split('T')[0]
  const lines = [
    `# Prompt Refinements — Baseado em Feedback Humano`,
    ``,
    `> Atualizado em ${today} | ${highRated.length + lowRated.length} avaliações processadas`,
    `> Injete este conteúdo no system prompt para incorporar aprendizados.`,
    ``,
    `---`,
    ``,
  ]

  if (analysis) {
    lines.push(
      `## Análise de Qualidade (Claude)`,
      ``,
      analysis,
      ``,
      `---`,
      ``,
    )
  }

  if (highRated.length > 0) {
    lines.push(
      `## Posts de referência (4-5★) — usar como few-shot`,
      ``,
      ...highRated.slice(0, 5).map(r => {
        const post = loadPost(r.slug)
        return post ? `- **${post.fm.title || r.slug}** (${r.rating}★)${r.notes ? ` — "${r.notes}"` : ''}` : null
      }).filter(Boolean),
      ``,
    )
  }

  if (lowRated.length > 0) {
    lines.push(
      `## Anti-padrões detectados (1-2★) — evitar`,
      ``,
      ...lowRated.slice(0, 5).map(r => {
        const post = loadPost(r.slug)
        const note = r.notes || 'avaliação baixa sem nota específica'
        return post ? `- ❌ **${post.fm.title || r.slug}** — ${note}` : null
      }).filter(Boolean),
      ``,
    )
  }

  lines.push(
    `---`,
    `_Gerado automaticamente por \`scripts/quality-feedback.mjs\`_`,
    `_Para adicionar avaliações: edite \`docs/quality-ratings.jsonl\` ou rode com \`--rate\`_`,
  )

  return lines.join('\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (RATE_MODE) {
  await interactiveRate()
  process.exit(0)
}

console.log('\n⭐  T4.20: Quality feedback loop iniciado...')

const ratings  = loadRatings()
const highRated = ratings.filter(r => r.rating >= 4).sort((a, b) => b.rating - a.rating)
const lowRated  = ratings.filter(r => r.rating <= 2).sort((a, b) => a.rating - b.rating)
const midRated  = ratings.filter(r => r.rating === 3)

console.log(`   ${ratings.length} avaliações carregadas:`)
console.log(`   ${highRated.length} excelentes (4-5★) | ${midRated.length} medianos (3★) | ${lowRated.length} ruins (1-2★)`)

if (ratings.length === 0) {
  console.log('\n   ℹ️  Nenhuma avaliação encontrada.')
  console.log('   Para avaliar posts: node scripts/quality-feedback.mjs --rate')
  console.log('   Ou edite manualmente: docs/quality-ratings.jsonl')

  // Create sample file to guide users
  if (!fs.existsSync(RATINGS_PATH)) {
    const sample = [
      '# Formato: {"slug": "post-slug", "rating": 5, "notes": "seu comentário", "date": "YYYY-MM-DD"}',
      '# Ratings: 1=péssimo, 2=ruim, 3=ok, 4=bom, 5=excelente',
      '# Remova estas linhas de comentário antes de usar',
    ].join('\n')
    fs.writeFileSync(RATINGS_PATH, sample, 'utf-8')
    console.log('\n   Arquivo de exemplo criado: docs/quality-ratings.jsonl')
  }
  process.exit(0)
}

// Analyze patterns
let analysis = null
if (highRated.length + lowRated.length >= 3 && process.env.ANTHROPIC_API_KEY) {
  console.log('\n   🧠  Analisando padrões via Claude...')
  analysis = await analyzePatterns(highRated, lowRated)
}

// Generate reports
const today = new Date().toISOString().split('T')[0]
const avgRating = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length

// Quality insights report (human-readable)
const insightsLines = [
  `# Quality Insights — ${today}`,
  ``,
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Posts avaliados | ${ratings.length} |`,
  `| Rating médio | ${avgRating.toFixed(1)}★ |`,
  `| Excelentes (4-5★) | ${highRated.length} |`,
  `| Medianos (3★) | ${midRated.length} |`,
  `| Ruins (1-2★) | ${lowRated.length} |`,
  ``,
  `## Distribuição`,
  ``,
  `| ★★★★★ | ${ratings.filter(r => r.rating === 5).length} posts |`,
  `| ★★★★☆ | ${ratings.filter(r => r.rating === 4).length} posts |`,
  `| ★★★☆☆ | ${ratings.filter(r => r.rating === 3).length} posts |`,
  `| ★★☆☆☆ | ${ratings.filter(r => r.rating === 2).length} posts |`,
  `| ★☆☆☆☆ | ${ratings.filter(r => r.rating === 1).length} posts |`,
  ``,
  `## Posts de destaque`,
  ``,
  ...highRated.slice(0, 5).map(r => {
    const post = loadPost(r.slug)
    return `- **${post?.fm?.title || r.slug}** (${r.rating}★)${r.notes ? ` — "${r.notes}"` : ''}`
  }),
  ``,
  ...(lowRated.length > 0 ? [
    `## Posts para revisar`,
    ``,
    ...lowRated.slice(0, 5).map(r => {
      const post = loadPost(r.slug)
      return `- **${post?.fm?.title || r.slug}** (${r.rating}★)${r.notes ? ` — "${r.notes}"` : ''}`
    }),
    ``,
  ] : []),
  analysis ? `## Análise de padrões\n\n${analysis}\n` : '',
  `---`,
  `_Gerado por \`scripts/quality-feedback.mjs\` em ${today}_`,
  `_Para avaliar posts: \`node scripts/quality-feedback.mjs --rate\`_`,
]

fs.writeFileSync(
  path.join(ROOT, 'docs', 'quality-insights.md'),
  insightsLines.join('\n'),
  'utf-8'
)

// Prompt refinements (injected into generate-post.mjs if EXPORT_MODE)
const promptRefinements = generatePromptRefinements(highRated, lowRated, analysis)
fs.writeFileSync(
  path.join(ROOT, 'docs', 'prompt-refinements.md'),
  promptRefinements,
  'utf-8'
)

console.log(`\n✅  Relatórios gerados:`)
console.log(`   docs/quality-insights.md`)
console.log(`   docs/prompt-refinements.md`)
console.log(`\n   Rating médio atual: ${avgRating.toFixed(1)}★`)

if (EXPORT_MODE) {
  // Print the anti-patterns section for direct inclusion in prompts
  console.log('\n─── Refinamentos para incluir no prompt ───')
  console.log(promptRefinements)
}

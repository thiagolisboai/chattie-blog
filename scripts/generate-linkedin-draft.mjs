/**
 * Generate LinkedIn Draft — T3.15: gera post de LinkedIn paralelo ao blog post
 *
 * Após um post ser gerado, cria automaticamente um rascunho de LinkedIn
 * otimizado para o algoritmo da plataforma, pronto para aprovação humana.
 *
 * Estrutura do post LinkedIn gerado:
 *   - Hook (1ª linha): frase que para o scroll, sem ponto final, sem emoji
 *   - Corpo: 3-4 bullets ou parágrafos curtos com insights acionáveis
 *   - CTA: 1 frase chamando para o post completo
 *   - Hashtags: 4-5 hashtags relevantes (sem bloco separado, na última linha)
 *
 * Uso (módulo):
 *   import { generateLinkedInDraft } from './generate-linkedin-draft.mjs'
 *   await generateLinkedInDraft({ slug, title, keyword, filePath })
 *
 * Uso (CLI):
 *   node scripts/generate-linkedin-draft.mjs --slug=meu-post
 *
 * Saída:
 *   docs/linkedin-drafts/[slug].md — draft pronto para copiar e postar
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { callAnthropic } from './anthropic-client.mjs'

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

// ─── Parse post content ───────────────────────────────────────────────────────

function parsePost(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
  const fm = {}
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const [k, ...v] = line.split(':')
      if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
    })
  }
  const body = fmMatch ? raw.slice(fmMatch[0].length).trim() : raw

  // Extract key elements for the LinkedIn prompt
  const h2s = [...body.matchAll(/^## (.+)$/gm)].map(m => m[1]).slice(0, 5)
  const faqSection = body.match(/^## (?:FAQ|Perguntas Frequentes)([\s\S]*?)(?:\n##|$)/im)?.[1] || ''
  const faqQuestions = [...faqSection.matchAll(/^### (.+)$/gm)].map(m => m[1]).slice(0, 3)

  // First paragraph after frontmatter (intro context for LinkedIn hook)
  const introMatch = body.match(/^(.+?)(?:\n\n|\n##)/s)
  const intro = introMatch?.[1]?.replace(/!\[.*?\]\(.*?\)/g, '').trim().slice(0, 400) || ''

  return { fm, h2s, faqQuestions, intro }
}

// ─── Generate LinkedIn post via Anthropic ─────────────────────────────────────

async function generateLinkedInPost({ slug, title, keyword, filePath }) {
  const { fm, h2s, faqQuestions, intro } = parsePost(filePath)
  const postUrl = `https://trychattie.com/pt-br/blog/${slug}`
  const category = fm.category || 'linkedin'

  const systemPrompt = `Você escreve posts de LinkedIn de alta performance para founders e operadores B2B brasileiros.

O perfil que você representa é o Chattie — AI SDR para LinkedIn. Tom: direto, técnico, sem motivação vazia, sem frases genéricas.

Estrutura obrigatória de um post LinkedIn de alta performance:

1. **Hook** (linha 1): frase que para o scroll. Deve criar tensão, contradição ou curiosidade.
   - NÃO use emojis no hook
   - NÃO termine com ponto final
   - Máximo 12 palavras
   - Deve ser específico, não genérico
   - Bons exemplos: "A maioria dos SDRs está prospectando na hora errada", "Ninguém te contou que CTR ≠ qualidade de lead"
   - Maus exemplos: "Aprenda a prospectar melhor no LinkedIn hoje", "Dicas incríveis para vendas B2B"

2. **Espaço em branco** (linha 2): linha vazia (padrão LinkedIn para expandir o "ver mais")

3. **Corpo** (3-4 bullets ou parágrafos curtos):
   - Cada bullet com um insight acionável ou dado concreto
   - Use → ou • como marcador (não use -)
   - Máximo 2 linhas por bullet
   - Foco em utilidade imediata para o ICP

4. **CTA** (última linha antes das hashtags): 1 frase curta chamando para o artigo completo
   - Ex: "O artigo completo está no link da bio." ou "Detalhes no post 👇"

5. **Hashtags** (na mesma linha do CTA ou linha seguinte): 4-5 hashtags relevantes

Regras adicionais:
- Total: entre 150 e 280 palavras (sem contar hashtags)
- Proibido: "Não perca", "Incrível", "Revolucionário", "Game-changer", adjetivos vazios
- Proibido: emojis em excesso (máximo 2-3 no corpo inteiro, nunca no hook)
- Responda APENAS com o texto do post LinkedIn, pronto para copiar`

  const userPrompt = `Crie um post LinkedIn para promover este artigo do blog Chattie.

**Keyword do artigo**: "${keyword}"
**Título**: ${title}
**URL**: ${postUrl}
**Categoria**: ${category}

**Estrutura do artigo** (H2s principais):
${h2s.map(h => `- ${h}`).join('\n')}

**Perguntas do FAQ** (insights para usar no LinkedIn):
${faqQuestions.length > 0 ? faqQuestions.map(q => `- ${q}`).join('\n') : '(não disponível)'}

**Introdução do artigo** (contexto para o hook):
${intro || '(não disponível)'}

Gere um post LinkedIn otimizado seguindo a estrutura do system prompt.
Foco no hook — é o que define se o post performa ou não.`

  const draft = await callAnthropic(systemPrompt, userPrompt, {
    label: 'linkedin-draft',
    maxTokens: 1024,
  })

  return draft.trim()
}

// ─── Save draft ───────────────────────────────────────────────────────────────

function saveDraft(slug, draft, title) {
  const draftsDir = path.join(ROOT, 'docs', 'linkedin-drafts')
  if (!fs.existsSync(draftsDir)) fs.mkdirSync(draftsDir, { recursive: true })

  const today = new Date().toISOString().split('T')[0]
  const postUrl = `https://trychattie.com/pt-br/blog/${slug}`

  const content = [
    `# LinkedIn Draft — ${title}`,
    ``,
    `> Gerado em ${today} | [Ver post completo](${postUrl})`,
    ``,
    `---`,
    ``,
    draft,
    ``,
    `---`,
    ``,
    `**Instruções de publicação:**`,
    `- Copie o texto acima (sem o cabeçalho desta página)`,
    `- Publique no LinkedIn do Chattie ou do fundador`,
    `- Edite o hook se necessário para o contexto atual`,
    `- Ajuste o CTA para apontar para o link correto na bio`,
    ``,
    `_Gerado automaticamente pelo Dexter (T3.15)_`,
  ].join('\n')

  const filePath = path.join(draftsDir, `${slug}.md`)
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Gera e salva um draft de LinkedIn para um post do blog.
 *
 * @param {object} params
 * @param {string} params.slug     — slug do post
 * @param {string} params.title    — título do post
 * @param {string} params.keyword  — keyword alvo
 * @param {string} params.filePath — caminho absoluto para o arquivo MDX
 * @returns {Promise<string>} — caminho do arquivo salvo
 */
export async function generateLinkedInDraft({ slug, title, keyword, filePath }) {
  console.log(`\n💼  T3.15: Gerando draft de LinkedIn para: "${title}"`)

  try {
    const draft = await generateLinkedInPost({ slug, title, keyword, filePath })
    const savedPath = saveDraft(slug, draft, title)
    console.log(`✅  T3.15: Draft LinkedIn salvo em: docs/linkedin-drafts/${slug}.md`)
    return savedPath
  } catch (err) {
    console.warn(`⚠️  T3.15: Falha ao gerar draft LinkedIn: ${err.message} — continuando`)
    return null
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slugArg = process.argv.find(a => a.startsWith('--slug='))
  if (!slugArg) {
    console.error('Uso: node scripts/generate-linkedin-draft.mjs --slug=meu-post')
    process.exit(1)
  }

  const slug = slugArg.split('=').slice(1).join('=')
  const filePath = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)

  if (!fs.existsSync(filePath)) {
    console.error(`Post não encontrado: content/blog/${slug}.mdx`)
    process.exit(1)
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const fmMatch = raw.match(/title:\s*"?([^"\n]+)"?/)
  const title = fmMatch?.[1] || slug.replace(/-/g, ' ')
  const keyword = slug.replace(/-/g, ' ')

  await generateLinkedInDraft({ slug, title, keyword, filePath })
}

/**
 * Snippet Optimize — T3.12: otimização sistemática para featured snippets
 *
 * Problema: posts podem ter H2s que "enterram a resposta" — dão contexto,
 * storytelling e exemplos ANTES de responder a pergunta do H2. O Google
 * (e LLMs) usam os primeiros 40-60 palavras após um H2 como snippet.
 * Se esse trecho não é uma resposta direta, o post perde o featured snippet.
 *
 * Solução:
 *   1. Extrai cada seção H2 do MDX
 *   2. Verifica se o primeiro parágrafo é uma resposta direta (≤60 palavras,
 *      contém a essência do H2)
 *   3. Seções que falham → reescreve APENAS o primeiro parágrafo via Anthropic
 *      para adicionar uma resposta direta antes do conteúdo existente
 *   4. Seções OK → mantém intactas (zero modificações no resto do post)
 *
 * Uso (módulo):
 *   import { snippetOptimize } from './snippet-optimize.mjs'
 *   const optimizedMdx = await snippetOptimize(mdxContent, keyword)
 *
 * Saída:
 *   - MDX otimizado (H2s com resposta direta no início)
 *   - Log das seções otimizadas vs aprovadas
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { callAnthropic } from './anthropic-client.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Count words in a text string */
function wordCount(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

/** Strip markdown formatting to get plain text */
function plainText(md) {
  return md
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

// ─── Extract H2 sections ──────────────────────────────────────────────────────

/**
 * Splits MDX body into sections, preserving frontmatter.
 * Returns: { frontmatter: string, sections: Array<{heading: string, content: string}> }
 */
function parseSections(mdxContent) {
  const fmMatch = mdxContent.match(/^---\n[\s\S]*?\n---\n/)
  const frontmatter = fmMatch ? fmMatch[0] : ''
  const body = mdxContent.slice(frontmatter.length)

  // Split at H2 boundaries
  const parts = body.split(/(?=^## )/m)
  const preamble = parts[0].startsWith('## ') ? '' : parts.shift()

  const sections = parts.map(part => {
    const headingMatch = part.match(/^## (.+)$/m)
    const heading = headingMatch ? headingMatch[1] : ''
    const content = part
    return { heading, content }
  })

  return { frontmatter, preamble, sections }
}

// ─── Check if section starts with a direct answer ────────────────────────────

/**
 * A section has a "direct answer" if the first non-empty paragraph:
 *   1. Has ≤70 words (concise enough to be a snippet)
 *   2. Contains at least 1 word from the H2 heading (relevant)
 *   3. Is not just a list item (starts with -, *, or number) — lists need intro
 */
function hasDirectAnswer(section) {
  // Get content after the H2 heading line
  const afterHeading = section.content.replace(/^## .+\n/, '').trim()

  // Find first non-empty paragraph
  const paragraphs = afterHeading.split(/\n\n+/).filter(p => p.trim())
  if (paragraphs.length === 0) return true // empty section, skip

  const first = paragraphs[0].trim()

  // Skip if it's a heading, image, or component
  if (first.startsWith('#') || first.startsWith('!') || first.startsWith('<')) return true

  // Immediately skip FAQ — those are Q&A by nature
  if (section.heading.toLowerCase().includes('faq') ||
      section.heading.toLowerCase().includes('perguntas')) return true

  const plain = plainText(first)
  const wc = wordCount(plain)

  // Too long for a snippet
  if (wc > 70) return false

  // Starts with a list — no intro sentence
  if (first.match(/^[-*\d]/m) && !first.match(/^[^-*\d]/m)) return false

  return true
}

// ─── F2.5: Batch rewrite all failing sections in ONE Anthropic call ───────────

/**
 * Rewrites all sections that need direct answers in a single API call.
 * Returns a Map<heading, rewrittenContent>.
 * Falls back to empty map on parse failure (originals are preserved).
 */
async function batchRewriteSections(sections, keyword) {
  // Send only a SHORT PREVIEW of each section for context.
  // The model returns ONLY the direct-answer prefix sentence — the original
  // full section content is preserved by prepending the prefix programmatically.
  // This avoids the truncation bug where slice(0, 600) discards the rest of each section.
  const items = sections.map((s, idx) => ({
    idx,
    heading: s.heading,
    preview: s.content.replace(/^## .+\n/, '').trim().slice(0, 400),
  }))

  const systemPrompt = `Você é um especialista em SEO e otimização de featured snippets.
Para cada seção fornecida, escreva UMA ÚNICA FRASE de resposta direta para adicionar
no INÍCIO da seção (antes de todo o conteúdo existente).

Regras para a frase de resposta direta:
- Entre 20 e 55 palavras
- Responde diretamente ao que o H2 pergunta
- Contém a keyword ou sua variação natural
- É uma frase completa (termina com ponto final)
- NÃO reproduza o conteúdo existente da seção — apenas a frase nova

Responda SOMENTE com um JSON array com esta estrutura exata:
[
  { "heading": "Heading exato da seção", "prefix": "Apenas a frase direta de resposta aqui." },
  ...
]
Nenhum texto antes ou depois do JSON.`

  const userPrompt = `Keyword do post: "${keyword}"

Seções para otimizar (preview para contexto):
${JSON.stringify(items, null, 2)}`

  try {
    const raw = await callAnthropic(systemPrompt, userPrompt, {
      label: 'snippet-optimize-batch',
      maxTokens: 4096,
    })

    // Extract JSON from response (model may wrap in markdown code blocks)
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('JSON array não encontrado na resposta')

    const parsed = JSON.parse(jsonMatch[0])
    const resultMap = new Map()
    for (const item of parsed) {
      if (item.heading && item.prefix) {
        // Find the original section to get full content (not just preview)
        const original = sections.find(s => s.heading === item.heading)
        if (original) {
          const body = original.content.replace(/^## .+\n/, '').trim()
          resultMap.set(item.heading, `## ${item.heading}\n\n${item.prefix.trim()}\n\n${body}`)
        }
      }
    }
    return resultMap
  } catch (err) {
    console.warn(`   ⚠️  Batch rewrite falhou (${err.message}) — mantendo seções originais`)
    return new Map()
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Optimizes all H2 sections in an MDX post for featured snippets.
 * F2.5: Uses a single batched Anthropic call instead of N sequential calls.
 *
 * @param {string} mdxContent — conteúdo MDX do post gerado
 * @param {string} keyword    — keyword do post (para contexto nas reescritas)
 * @returns {Promise<string>} MDX otimizado
 */
export async function snippetOptimize(mdxContent, keyword = '') {
  console.log('\n🎯  T3.12: Featured snippet optimization iniciada...')

  const { frontmatter, preamble, sections } = parseSections(mdxContent)

  if (sections.length === 0) {
    console.log('   ℹ️  Nenhuma seção H2 encontrada — pulando')
    return mdxContent
  }

  const needsOptimization = sections.filter(s => !hasDirectAnswer(s))
  const alreadyGood       = sections.filter(s =>  hasDirectAnswer(s))

  console.log(`   📋  ${sections.length} seções — ${alreadyGood.length} OK, ${needsOptimization.length} a otimizar`)

  if (needsOptimization.length === 0) {
    console.log('✅  T3.12: Todas as seções já têm resposta direta')
    return mdxContent
  }

  // F2.5: Single batched call for all sections that need optimization
  console.log(`   📦  Otimizando ${needsOptimization.length} seção(ões) em 1 chamada à API...`)
  const rewrites = await batchRewriteSections(needsOptimization, keyword)

  // Apply rewrites (sections not in map keep their original content)
  const optimizedSections = sections.map(s => {
    if (rewrites.has(s.heading)) {
      return { ...s, content: rewrites.get(s.heading) }
    }
    return s
  })

  const optimizedBody = preamble + optimizedSections.map(s => s.content).join('')
  const result = frontmatter + optimizedBody

  console.log(`✅  T3.12: ${needsOptimization.length} seção(ões) otimizadas para featured snippet`)

  // Log
  try {
    const logEntry = {
      ts: new Date().toISOString(),
      keyword,
      total: sections.length,
      optimized: needsOptimization.length,
      sections: needsOptimization.map(s => s.heading),
    }
    const logPath = path.join(ROOT, 'docs', 'snippet-log.jsonl')
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8')
  } catch { /* nao bloquear */ }

  return result
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slugArg = process.argv.find(a => a.startsWith('--slug='))
  const fileArg = process.argv.find(a => a.startsWith('--file='))

  let content, keyword

  if (fileArg) {
    const filePath = fileArg.split('=').slice(1).join('=')
    content = fs.readFileSync(filePath, 'utf-8')
    keyword = path.basename(filePath, '.mdx').replace(/-/g, ' ')
  } else if (slugArg) {
    const slug = slugArg.split('=').slice(1).join('=')
    const filePath = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)
    content = fs.readFileSync(filePath, 'utf-8')
    keyword = slug.replace(/-/g, ' ')
  } else {
    console.error('Uso: node scripts/snippet-optimize.mjs --slug=meu-post')
    console.error('     node scripts/snippet-optimize.mjs --file=content/blog/meu-post.mdx')
    process.exit(1)
  }

  const optimized = await snippetOptimize(content, keyword)

  if (optimized !== content) {
    if (slugArg) {
      const slug = slugArg.split('=').slice(1).join('=')
      const filePath = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)
      fs.writeFileSync(filePath, optimized, 'utf-8')
      console.log(`   Salvo em: content/blog/${slug}.mdx`)
    } else {
      console.log('\n⚠️  Post otimizado — use --slug= para salvar automaticamente')
    }
  }
}

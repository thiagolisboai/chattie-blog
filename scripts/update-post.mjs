/**
 * Update Post — atualizacao autonoma de posts existentes via Anthropic API
 *
 * Uso:
 *   node scripts/update-post.mjs --slug=follow-up-linkedin-b2b
 *   node scripts/update-post.mjs --slug=follow-up-linkedin-b2b --dry-run
 *   node scripts/update-post.mjs --auto   (escolhe o post com maior queda de ranking)
 *
 * O que faz:
 *   1. Le o post existente (frontmatter + conteudo)
 *   2. Pesquisa SERP atual com Brave Search
 *   3. Analisa conteudo dos top concorrentes (B2)
 *   4. Usa Anthropic API para identificar secoes desatualizadas e reescrever
 *   5. Preserva frontmatter exceto dateModified (atualizado para hoje)
 *   6. Salva o post atualizado
 *
 * Saida:
 *   Exit 0 — post atualizado com sucesso
 *   Exit 1 — erro critico
 *   Exit 2 — nada a atualizar
 */

import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { braveSearch } from './brave-search.mjs'
import { callAnthropic } from './anthropic-client.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const AUTO    = process.argv.includes('--auto')

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0]
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

// ─── Parse frontmatter ────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { fm: {}, body: raw, fmRaw: '' }

  const fmRaw = match[1]
  const fm = {}
  fmRaw.split('\n').forEach(line => {
    const [k, ...v] = line.split(':')
    if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
  })

  const body = raw.slice(match[0].length).trim()
  return { fm, body, fmRaw }
}

// ─── Fetch URL content (same as generate-post.mjs B2) ────────────────────────

async function fetchUrlContent(rawUrl) {
  return new Promise((resolve) => {
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
          if (size > 150000) req.destroy()
        })
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      })
      req.on('error', () => resolve(null))
      req.setTimeout(6000, () => { req.destroy(); resolve(null) })
    } catch { resolve(null) }
  })
}

async function fetchSerpContent(serpResults) {
  const results = []
  for (const result of serpResults.slice(0, 3)) {
    try {
      const html = await fetchUrlContent(result.url)
      if (!html) continue
      const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
        .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
        .filter(h => h.length > 3 && h.length < 200)
        .slice(0, 8)
      const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i)
      const text = (bodyMatch?.[1] || html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const wordCount = text.split(' ').filter(w => w.length > 2).length
      if (h2s.length > 0 || wordCount > 100) {
        results.push({ url: result.url, title: result.title, h2s, wordCount })
      }
    } catch { /* skip */ }
  }
  return results
}

// callAnthropic importado de ./anthropic-client.mjs (com retry + cost tracking)

// ─── Select slug to update ────────────────────────────────────────────────────

function selectSlugFromRankingDrops() {
  const gscPath = path.join(ROOT, 'docs', 'gsc-insights.md')
  if (!fs.existsSync(gscPath)) return null

  const raw = fs.readFileSync(gscPath, 'utf-8')
  const dropsSection = raw.match(/##.*[Qq]uedas[\s\S]*?(?=\n##|\n---)/)?.[0] || ''
  const drops = [...dropsSection.matchAll(/\|\s*(\/[^\s|]+)/g)].map(m => m[1])

  // Extract slug from URL paths like /pt-br/blog/my-slug
  for (const url of drops) {
    const m = url.match(/\/blog\/([^/\s]+)/)
    if (m) return m[1]
  }
  return null
}

// ─── Main update logic ────────────────────────────────────────────────────────

async function updatePost(slug) {
  const filePath = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post nao encontrado: content/blog/${slug}.mdx`)
  }

  log(`📖  Lendo post: content/blog/${slug}.mdx`)
  const original = fs.readFileSync(filePath, 'utf-8')
  const { fm, body, fmRaw } = parseFrontmatter(original)

  const keyword = fm.title || slug.replace(/-/g, ' ')
  log(`🔍  Keyword inferida: "${keyword}"`)

  // Research current SERP
  log('🌐  Pesquisando SERP atual...')
  const serpResults = await braveSearch(keyword, 5)
  const serpContent = await fetchSerpContent(serpResults)

  const serpSummary = serpResults.length > 0
    ? serpResults.map(r => `${r.position}. "${r.title}" — ${r.url}\n   ${r.description?.slice(0, 150)}`).join('\n')
    : 'Sem dados SERP disponíveis.'

  const serpContentSummary = serpContent.length > 0
    ? serpContent.map((s, i) => {
        const h2List = s.h2s.map(h => `     - ${h}`).join('\n') || '     (H2s nao extraidos)'
        return `${i + 1}. "${s.title}" (~${s.wordCount} palavras)\n${h2List}`
      }).join('\n\n')
    : 'Conteudo SERP nao disponivel.'

  // Build update prompt
  const systemPrompt = `Voce e o Dexter, agente de conteudo do Chattie Blog. Sua tarefa e atualizar um post existente para melhorar seu ranking no Google.

Regras:
- Manter o frontmatter EXATAMENTE igual, exceto dateModified (atualizar para hoje: ${today()})
- Preservar o slug e canonicalUrl originais
- Nao mudar o tom geral — direto, tecnico, sem floreio
- Corrigir secoes desatualizadas com dados mais recentes
- Adicionar secoes que faltam em relacao aos concorrentes
- Aprofundar secoes superficiais
- Minimo 1800 palavras de conteudo (nao conte o frontmatter)
- Responda APENAS com o MDX completo atualizado, comecando com ---`

  const userPrompt = `Atualize este post para melhorar seu ranking no Google.

## Post atual

\`\`\`mdx
${original.slice(0, 8000)}${original.length > 8000 ? '\n...[truncado]' : ''}
\`\`\`

## SERP atual para "${keyword}"

${serpSummary}

## Analise competitiva (H2s e tamanho dos concorrentes)

${serpContentSummary}

## Instrucoes de atualizacao

1. Identifique secoes do post atual que estao desatualizadas ou superficiais
2. Compare com os H2s dos concorrentes — adicione topicos importantes que faltam
3. Se o post tiver menos palavras que os concorrentes, aprofunde as secoes existentes
4. Atualize dateModified para: ${today()}
5. Mantenha o slug: ${slug}
6. Adicione ou melhore a secao FAQ se necessario
7. Preserve os internal links existentes — adicione novos se relevante

Responda APENAS com o MDX completo atualizado.`

  log('🧠  Chamando Anthropic API para gerar atualização...')
  const rawOutput = await callAnthropic(systemPrompt, userPrompt, { label: 'update-post' })

  let updatedMdx = rawOutput.trim()
  if (updatedMdx.startsWith('```mdx')) updatedMdx = updatedMdx.slice(6)
  else if (updatedMdx.startsWith('```')) updatedMdx = updatedMdx.slice(3)
  if (updatedMdx.endsWith('```')) updatedMdx = updatedMdx.slice(0, -3)
  updatedMdx = updatedMdx.trim()

  if (!updatedMdx.startsWith('---')) {
    throw new Error(`Output invalido — nao comeca com frontmatter:\n${updatedMdx.slice(0, 200)}`)
  }

  // Ensure dateModified is updated
  if (!updatedMdx.includes(`dateModified: "${today()}"`)) {
    updatedMdx = updatedMdx.replace(
      /dateModified:\s*"[^"]*"/,
      `dateModified: "${today()}"`
    )
  }

  const wordCount = updatedMdx.replace(/---[\s\S]*?---/, '').trim().split(/\s+/).length
  log(`📝  Post atualizado: ~${wordCount} palavras`)

  if (DRY_RUN) {
    log('✅  Dry run — nao salvo')
    log('\n--- Preview (primeiros 500 chars) ---')
    console.log(updatedMdx.slice(0, 500))
    return { slug, wordCount }
  }

  // Save backup
  const backupPath = `${filePath}.bak`
  fs.writeFileSync(backupPath, original, 'utf-8')
  log(`💾  Backup salvo em: content/blog/${slug}.mdx.bak`)

  fs.writeFileSync(filePath, updatedMdx, 'utf-8')
  log(`✅  Post atualizado: content/blog/${slug}.mdx`)

  return { slug, wordCount }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('═══════════════════════════════════════════════════')
  log('  Dexter — Atualização de Post')
  log('═══════════════════════════════════════════════════')

  if (!process.env.ANTHROPIC_API_KEY) {
    log('❌  ANTHROPIC_API_KEY nao configurado. Abortando.')
    process.exit(1)
  }

  // Resolve slug
  let slug = null
  const slugArg = process.argv.find(a => a.startsWith('--slug='))
  if (slugArg) {
    slug = slugArg.split('=').slice(1).join('=')
  } else if (AUTO) {
    slug = selectSlugFromRankingDrops()
    if (slug) {
      log(`🎯  Slug selecionado automaticamente (ranking drop): ${slug}`)
    } else {
      log('ℹ️  Nenhum post com queda de ranking encontrado no gsc-insights.md')
      process.exit(2)
    }
  } else {
    console.error('Uso: node scripts/update-post.mjs --slug=my-post-slug')
    console.error('     node scripts/update-post.mjs --auto   (seleciona pelo GSC)')
    process.exit(1)
  }

  try {
    const result = await updatePost(slug)
    log('\n═══════════════════════════════════════════════════')
    log(`✅  Atualização concluída!`)
    log(`   Slug:    ${result.slug}`)
    log(`   Palavras: ~${result.wordCount}`)
    log('═══════════════════════════════════════════════════')

    if (!DRY_RUN) {
      log('\nProximos passos:')
      log('  1. Revisar o post atualizado em content/blog/${slug}.mdx')
      log('  2. node scripts/source-audit.mjs')
      log('  3. git add content/blog/${slug}.mdx && git commit -m "content: update ${slug}"')
      log('  4. git push (Vercel deploya automaticamente)')
    }

    process.exit(0)
  } catch (err) {
    log(`\n❌  Erro: ${err.message}`)
    process.exit(1)
  }
}

main()

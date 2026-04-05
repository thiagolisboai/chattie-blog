/**
 * Beehiiv Draft — T1.3: cria rascunho de newsletter após publicação de post
 *
 * Após o Dexter publicar um novo post, cria automaticamente um draft no Beehiiv
 * com o conteúdo do post para aprovação manual antes do envio.
 *
 * O draft inclui:
 *   - Título do post como subject
 *   - Excerpt como preview text
 *   - Conteúdo HTML gerado a partir do MDX (simplificado)
 *   - CTA linkando para o post completo
 *   - Imagem de capa do post
 *
 * Uso:
 *   node scripts/beehiiv-draft.mjs --slug=meu-post-slug
 *
 * Requer:
 *   BEEHIIV_API_KEY          — em .env.local ou variável de ambiente
 *   BEEHIIV_PUBLICATION_ID   — em .env.local ou variável de ambiente
 *
 * Saída:
 *   Exit 0 — draft criado (ou graceful degradation se API indisponível)
 *   Imprime URL do draft no Beehiiv para aprovação
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

// ─── Args ─────────────────────────────────────────────────────────────────────

const slugArg = process.argv.find(a => a.startsWith('--slug='))
if (!slugArg) {
  console.error('Uso: node scripts/beehiiv-draft.mjs --slug=meu-post-slug')
  process.exit(1)
}
const SLUG = slugArg.split('=').slice(1).join('=')

const API_KEY        = process.env.BEEHIIV_API_KEY
const PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID

if (!API_KEY || !PUBLICATION_ID) {
  console.warn('⚠️  BEEHIIV_API_KEY ou BEEHIIV_PUBLICATION_ID não configurados — pulando newsletter draft')
  process.exit(0) // graceful degradation
}

// ─── Parse post MDX ───────────────────────────────────────────────────────────

function parsePost(slug) {
  const filePath = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post não encontrado: content/blog/${slug}.mdx`)
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
  const fm = {}
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const [k, ...v] = line.split(':')
      if (k && v.length) fm[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
    })
  }

  const body = raw.slice(fmMatch ? fmMatch[0].length : 0).trim()
  return { fm, body, raw }
}

// ─── Convert MDX body to newsletter HTML ─────────────────────────────────────

function mdxToNewsletterHtml(body, postUrl, fm) {
  // Take first 3-4 paragraphs for the newsletter preview
  const paragraphs = body
    .split(/\n\n+/)
    .filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('!') && !p.startsWith('<'))
    .map(p => p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>')
               .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
               .replace(/`([^`]+)`/g, '<code>$1</code>')
               .trim())
    .filter(p => p.length > 50)
    .slice(0, 3)

  const imageHtml = fm.image
    ? `<img src="${fm.image}" alt="${fm.title || ''}" style="width:100%;max-width:600px;border-radius:8px;margin-bottom:16px;" />`
    : ''

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">

  ${imageHtml}

  <h1 style="font-size: 24px; font-weight: 700; line-height: 1.3; margin-bottom: 8px;">${fm.title || slug}</h1>

  <p style="color: #666; font-size: 14px; margin-bottom: 24px;">${fm.description || fm.excerpt || ''}</p>

  ${paragraphs.map(p => `<p style="font-size: 16px; line-height: 1.7; margin-bottom: 16px;">${p}</p>`).join('\n')}

  <div style="margin: 32px 0; text-align: center;">
    <a href="${postUrl}"
       style="display: inline-block; background: #000; color: #fff; padding: 14px 28px;
              border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Ler artigo completo →
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

  <p style="font-size: 13px; color: #999; text-align: center;">
    Esse email foi gerado automaticamente pelo Dexter, agente de conteúdo do Chattie.<br/>
    <a href="https://trychattie.com/pt-br" style="color: #999;">Conheça o Chattie</a>
  </p>

</div>`.trim()
}

// ─── Beehiiv API call ─────────────────────────────────────────────────────────

function beehiivRequest(method, endpoint, data) {
  const body = JSON.stringify(data)

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.beehiiv.com',
      path: endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          if (res.statusCode >= 400) {
            reject(new Error(`Beehiiv API ${res.statusCode}: ${json.message || JSON.stringify(json).slice(0, 100)}`))
          } else {
            resolve(json)
          }
        } catch (e) { reject(e) }
      })
    })

    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Beehiiv timeout')) })
    req.write(body)
    req.end()
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`📧  T1.3: Criando draft de newsletter para: ${SLUG}`)

try {
  const { fm, body } = parsePost(SLUG)

  const postUrl = `https://trychattie.com/pt-br/blog/${SLUG}`
  const htmlContent = mdxToNewsletterHtml(body, postUrl, fm)

  const draftPayload = {
    platform: 'both',              // web + email
    status: 'draft',
    audience: 'free',
    send_at: null,                  // manual send after approval
    subject: fm.title || SLUG,
    preview_text: fm.excerpt || fm.description?.slice(0, 100) || '',
    content_html: htmlContent,
    content_tags: [fm.category || 'blog'].filter(Boolean),
    meta_default_title: fm.title || SLUG,
    meta_default_description: fm.description || '',
  }

  const result = await beehiivRequest(
    'POST',
    `/v2/publications/${PUBLICATION_ID}/posts`,
    draftPayload
  )

  const draftId   = result.data?.id || result.id
  const draftUrl  = `https://app.beehiiv.com/posts/${draftId}`

  console.log(`✅  Draft criado no Beehiiv!`)
  console.log(`    ID:  ${draftId}`)
  console.log(`    URL: ${draftUrl}`)
  console.log(`    Revise e envie manualmente no painel do Beehiiv.`)

  // Write to GITHUB_OUTPUT if in CI
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `beehiiv_draft_url=${draftUrl}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `beehiiv_draft_id=${draftId}\n`)
  }

  process.exit(0)
} catch (err) {
  // Graceful degradation — não bloquear o pipeline por falha de newsletter
  console.warn(`⚠️  Beehiiv draft falhou: ${err.message}`)
  console.warn(`   O post foi publicado normalmente. Crie o draft manualmente em app.beehiiv.com`)
  process.exit(0)
}

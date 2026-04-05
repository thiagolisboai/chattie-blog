/**
 * Grounding Verify — T1.4: verifica estatísticas citadas no post gerado
 *
 * Problema: o modelo pode escrever "Segundo o LinkedIn, 78% dos SDRs..." mesmo que
 * esse número não exista nessa fonte. O source-audit.mjs bloqueia FONTES PROIBIDAS,
 * mas não verifica se os dados de fontes aprovadas realmente existem.
 *
 * Solução:
 *   1. Extrai afirmações estatísticas com atribuição via regex
 *   2. Para cada afirmação, busca via Brave Search para confirmar existência
 *   3. Afirmações não verificadas são reescritas pelo modelo para remover atribuição falsa
 *
 * Uso (módulo):
 *   import { groundingVerify } from './grounding-verify.mjs'
 *   const cleanMdx = await groundingVerify(mdxContent, keyword)
 *
 * Saída:
 *   - MDX limpo (sem atribuições não verificadas)
 *   - Log das afirmações verificadas e não verificadas
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { braveSearch } from './brave-search.mjs'
import { callAnthropic } from './anthropic-client.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Source domain map ────────────────────────────────────────────────────────

const SOURCE_DOMAINS = {
  'linkedin':      'linkedin.com',
  'mckinsey':      'mckinsey.com',
  'hubspot':       'hubspot.com',
  'salesforce':    'salesforce.com',
  'gartner':       'gartner.com',
  'forrester':     'forrester.com',
  'tra':           'trychattie.com',
  'agendor':       'agendor.com.br',
  'piperun':       'piperun.com',
}

// ─── Extract statistical claims from MDX ──────────────────────────────────────

function extractClaims(mdxContent) {
  const body = mdxContent.replace(/^---[\s\S]*?---\n/, '').trim()
  const claims = []

  // Pattern 1: "Segundo [Fonte], N% de..."
  // Pattern 2: "[N]% dos [X], segundo [Fonte]"
  // Pattern 3: "De acordo com [Fonte], [N]%"
  // Pattern 4: "[Fonte] aponta que [N]%"
  const patterns = [
    // "Segundo LinkedIn, 78%..."
    /[Ss]egundo\s+([\w\s&]+?),\s+[\s\S]{0,80}?(\d[\d.,]*\s*%)/g,
    // "de acordo com LinkedIn, 78%..."
    /[Dd]e acordo com\s+([\w\s&]+?),\s+[\s\S]{0,80}?(\d[\d.,]*\s*%)/g,
    // "conforme dados do LinkedIn, 78%..."
    /[Cc]onforme\s+(?:dados (?:do|da|de)\s+)?([\w\s&]+?),\s+[\s\S]{0,80}?(\d[\d.,]*\s*%)/g,
    // "78% de acordo com LinkedIn"
    /(\d[\d.,]*\s*%)\s+[\w\s,]+(?:segundo|de acordo com|conforme)\s+([\w\s&]+?)[\.,]/g,
    // "LinkedIn aponta que 78%"
    /([\w\s&]+?)\s+(?:aponta|indica|mostra|revela)\s+que\s+[\s\S]{0,60}?(\d[\d.,]*\s*%)/g,
  ]

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(body)) !== null) {
      const [full, a, b] = match
      // Determine which group is source vs stat
      const source = a.replace(/\s+/g, ' ').trim()
      const stat   = b || a

      // Skip if source looks like a number (inverted match)
      if (/^\d/.test(source)) continue
      // Skip very short matches
      if (source.length < 3 || source.length > 50) continue

      claims.push({
        text:   full.slice(0, 150).trim(),
        source: source,
        stat:   stat.trim(),
        index:  match.index,
      })
    }
  }

  // Deduplicate by source+stat combination
  const seen = new Set()
  return claims.filter(c => {
    const key = `${c.source}|${c.stat}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── Identify source domain ───────────────────────────────────────────────────

function identifyDomain(sourceName) {
  const lower = sourceName.toLowerCase()
  for (const [key, domain] of Object.entries(SOURCE_DOMAINS)) {
    if (lower.includes(key)) return domain
  }
  return null
}

// ─── Verify a single claim via Brave Search ───────────────────────────────────

async function verifyClaim(claim) {
  const domain = identifyDomain(claim.source)

  // Build verification query
  const statClean = claim.stat.replace(/\s+/g, ' ').trim()
  const sourceClean = claim.source.replace(/\s+/g, ' ').trim()
  const query = domain
    ? `${statClean} ${sourceClean} site:${domain}`
    : `${statClean} "${sourceClean}" report`

  console.log(`   🔍  Verificando: "${statClean}" (fonte: ${sourceClean})`)

  try {
    const results = await braveSearch(query, 3)

    // Check if any result comes from the source domain
    const fromSource = domain
      ? results.filter(r => r.url.includes(domain))
      : results.filter(r =>
          r.title.toLowerCase().includes(sourceClean.toLowerCase()) ||
          r.description?.toLowerCase().includes(sourceClean.toLowerCase())
        )

    const verified = fromSource.length > 0

    if (verified) {
      console.log(`   ✅  Verificado: ${fromSource[0].url.slice(0, 60)}`)
    } else {
      console.log(`   ❌  Não verificado — nenhum resultado da fonte "${sourceClean}"`)
    }

    return {
      ...claim,
      verified,
      verificationUrl: fromSource[0]?.url || null,
    }
  } catch {
    // On search error, treat as unverified (conservative)
    console.warn(`   ⚠️  Busca falhou para: "${statClean}" — tratando como não verificado`)
    return { ...claim, verified: false, verificationUrl: null }
  }
}

// ─── Rewrite unverified claims ────────────────────────────────────────────────

async function rewriteUnverified(mdxContent, unverifiedClaims, keyword) {
  if (unverifiedClaims.length === 0) return mdxContent

  const claimsList = unverifiedClaims
    .map((c, i) => `${i + 1}. TRECHO: "${c.text}"\n   PROBLEMA: A estatística "${c.stat}" atribuída a "${c.source}" não foi encontrada na fonte original.`)
    .join('\n\n')

  const systemPrompt = `Você é um editor de conteúdo especializado em fact-checking.
Sua tarefa é reescrever trechos de um post de blog para remover atribuições não verificadas,
mantendo o valor informativo do conteúdo.

Regras:
- Se o número específico não pode ser verificado, remova-o ou substitua por linguagem de estimativa
- Use: "Benchmarks de outbound B2B indicam..." ou "É comum que equipes de vendas percebam..."
- Mantenha o ponto de vista do autor — apenas remova a atribuição falsa, não a mensagem
- Se possível, preserve o número mas remova a fonte específica
- NÃO invente uma fonte alternativa
- Responda APENAS com o MDX completo corrigido, começando com ---`

  const userPrompt = `Corrija as seguintes afirmações não verificadas neste post.

## Afirmações a corrigir:

${claimsList}

## Post completo a corrigir:

${mdxContent}

Reescreva o post removendo ou reformulando as ${unverifiedClaims.length} afirmação(ões) listadas acima.
Mantenha TODO o restante do conteúdo idêntico.
Responda APENAS com o MDX completo corrigido.`

  console.log(`\n🔧  Reescrevendo ${unverifiedClaims.length} afirmação(ões) não verificada(s)...`)
  const rewritten = await callAnthropic(systemPrompt, userPrompt, {
    label: 'grounding-rewrite',
    maxTokens: 8192,
  })

  let cleaned = rewritten.trim()
  if (cleaned.startsWith('```mdx')) cleaned = cleaned.slice(6)
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()

  if (!cleaned.startsWith('---')) {
    console.warn('⚠️  Reescrita inválida — usando post original sem modificação')
    return mdxContent
  }

  return cleaned
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Verifica afirmações estatísticas no MDX e reescreve as não verificadas.
 *
 * @param {string} mdxContent — conteúdo MDX do post gerado
 * @param {string} keyword    — keyword do post (para contexto no log)
 * @returns {Promise<string>} MDX limpo (sem atribuições não verificadas)
 */
export async function groundingVerify(mdxContent, keyword = '') {
  console.log('\n📐  T1.4: Grounding verification iniciada...')

  const claims = extractClaims(mdxContent)

  if (claims.length === 0) {
    console.log('   ℹ️  Nenhuma afirmação com atribuição numérica encontrada — post limpo')
    return mdxContent
  }

  console.log(`   📋  ${claims.length} afirmação(ões) encontrada(s) para verificar`)

  // Verify all claims (with small delay between searches to avoid rate limits)
  const verificationResults = []
  for (const claim of claims) {
    const result = await verifyClaim(claim)
    verificationResults.push(result)
    if (claims.indexOf(claim) < claims.length - 1) {
      await new Promise(r => setTimeout(r, 1000)) // 1s entre buscas
    }
  }

  const verified   = verificationResults.filter(r => r.verified)
  const unverified = verificationResults.filter(r => !r.verified)

  console.log(`\n   Resultado: ${verified.length} verificada(s), ${unverified.length} não verificada(s)`)

  if (unverified.length > 0) {
    console.log('   Afirmações NÃO verificadas:')
    unverified.forEach(c => console.log(`     - "${c.stat}" (fonte: ${c.source})`))
  }

  // Rewrite post if there are unverified claims
  const cleanedMdx = await rewriteUnverified(mdxContent, unverified, keyword)

  // Log results
  const logEntry = {
    ts: new Date().toISOString(),
    keyword,
    claimsTotal: claims.length,
    verified: verified.length,
    unverified: unverified.length,
    unverifiedClaims: unverified.map(c => ({ stat: c.stat, source: c.source })),
  }
  try {
    const logPath = path.join(ROOT, 'docs', 'grounding-log.jsonl')
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8')
  } catch { /* nao bloquear */ }

  if (unverified.length === 0) {
    console.log('✅  Grounding OK — todas as afirmações verificadas')
  } else {
    console.log(`✅  Grounding concluído — ${unverified.length} afirmação(ões) reescrita(s)`)
  }

  return cleanedMdx
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
    console.error('Uso: node scripts/grounding-verify.mjs --slug=meu-post')
    console.error('     node scripts/grounding-verify.mjs --file=content/blog/meu-post.mdx')
    process.exit(1)
  }

  const cleaned = await groundingVerify(content, keyword)
  if (cleaned !== content) {
    console.log('\n⚠️  Post foi modificado — revise as mudanças antes de salvar.')
    console.log('   Use com --slug= e o script salva automaticamente.')
    if (slugArg) {
      const slug = slugArg.split('=').slice(1).join('=')
      const filePath = path.join(ROOT, 'content', 'blog', `${slug}.mdx`)
      fs.writeFileSync(filePath, cleaned, 'utf-8')
      console.log(`   Salvo em: content/blog/${slug}.mdx`)
    }
  }
}

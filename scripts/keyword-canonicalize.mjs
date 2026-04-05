/**
 * Keyword Canonicalize — T4.17: detecção de duplicatas semânticas no backlog
 *
 * Problema: o backlog acumula keywords que são variantes da mesma intenção
 * de busca. Ex: "como prospectar no linkedin", "prospecção linkedin b2b" e
 * "linkedin prospecting brasil" são canonicamente equivalentes.
 * Publicar posts para cada uma é desperdício e cria canibalização.
 *
 * Solução — pipeline em 2 etapas:
 *   1. Pre-filtro por overlap de tokens (rápido, sem API)
 *      - Pares com sobreposição ≥60% → candidatos a duplicata
 *      - Pares com sobreposição <30% → descartados
 *   2. Confirmação semântica via Claude (apenas borderline 30-60%)
 *      - Pergunta: "Essas duas keywords têm intenção de busca equivalente?"
 *      - Resposta: "SIM" ou "NÃO"
 *
 * Cache em docs/canonical-cache.jsonl para não refazer comparações.
 *
 * Uso:
 *   node scripts/keyword-canonicalize.mjs           (analisa o backlog inteiro)
 *   node scripts/keyword-canonicalize.mjs --apply   (marca duplicatas no backlog)
 *   node scripts/keyword-canonicalize.mjs --dry-run (apenas mostra)
 *
 * Saída:
 *   docs/canonical-report.md — grupos de keywords equivalentes
 *   docs/keyword-backlog.md  — atualizado com status "duplicata" (com --apply)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { callAnthropic } from './anthropic-client.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const APPLY   = process.argv.includes('--apply')

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

// ─── Token overlap (fast, no API) ─────────────────────────────────────────────

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2) // include 3-char words for PT-BR (e.g. "b2b", "sdr")
}

function overlapScore(a, b) {
  const tA = new Set(tokenize(a))
  const tB = new Set(tokenize(b))
  if (tA.size === 0 || tB.size === 0) return 0
  const intersection = [...tA].filter(t => tB.has(t)).length
  const union = new Set([...tA, ...tB]).size
  return intersection / union // Jaccard similarity
}

// ─── Canonical cache ──────────────────────────────────────────────────────────

const CACHE_PATH = path.join(ROOT, 'docs', 'canonical-cache.jsonl')

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {}
  const cache = {}
  fs.readFileSync(CACHE_PATH, 'utf-8').trim().split('\n').filter(Boolean).forEach(line => {
    try {
      const e = JSON.parse(line)
      const key = [e.a, e.b].sort().join('|||')
      cache[key] = e.equivalent
    } catch { /* skip */ }
  })
  return cache
}

function saveToCache(a, b, equivalent) {
  const entry = { a, b, equivalent, ts: new Date().toISOString() }
  fs.appendFileSync(CACHE_PATH, JSON.stringify(entry) + '\n', 'utf-8')
}

// ─── Claude semantic equivalence check ───────────────────────────────────────

async function areEquivalent(kwA, kwB) {
  const systemPrompt = `Você é especialista em SEO e intenção de busca.
Responda APENAS com "SIM" ou "NÃO".`

  const userPrompt = `As duas keywords abaixo têm intenção de busca equivalente?
Intenção equivalente = um único post poderia ranquear bem para ambas.

Keyword A: "${kwA}"
Keyword B: "${kwB}"

Responda SIM se um post otimizado para A também serviria para B.
Responda NÃO se as keywords demandam conteúdos claramente diferentes.

Responda apenas: SIM ou NÃO`

  const response = await callAnthropic(systemPrompt, userPrompt, {
    label: 'keyword-canonicalize',
    maxTokens: 10,
  })

  return response.trim().toUpperCase().startsWith('SIM')
}

// ─── Read backlog ─────────────────────────────────────────────────────────────

function readBacklog() {
  const p = path.join(ROOT, 'docs', 'keyword-backlog.md')
  if (!fs.existsSync(p)) return { raw: '', keywords: [] }

  const raw = fs.readFileSync(p, 'utf-8')
  const keywords = raw.split('\n')
    .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Keyword'))
    .map(l => {
      const cols = l.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length < 5) return null
      return {
        keyword:  cols[0],
        intent:   cols[1],
        comp:     cols[2],
        priority: cols[3],
        status:   cols[4],
        _line:    l,
      }
    })
    .filter(Boolean)
    .filter(r => r.status.toLowerCase() === 'pendente')

  return { raw, keywords }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('\n🔗  T4.17: Keyword canonicalization iniciada...')

const { raw: backlogRaw, keywords } = readBacklog()
console.log(`   ${keywords.length} keywords pendentes para analisar`)

if (keywords.length < 2) {
  console.log('   Menos de 2 keywords — nada a comparar')
  process.exit(0)
}

const cache = loadCache()
const groups = []        // [{canonical: kw, duplicates: [kw, ...]}]
const processed = new Set()

let apiCallCount = 0

for (let i = 0; i < keywords.length; i++) {
  const kwA = keywords[i].keyword
  if (processed.has(kwA)) continue

  const group = { canonical: kwA, duplicates: [] }

  for (let j = i + 1; j < keywords.length; j++) {
    const kwB = keywords[j].keyword
    if (processed.has(kwB)) continue

    const cacheKey = [kwA, kwB].sort().join('|||')
    let equivalent

    if (cacheKey in cache) {
      equivalent = cache[cacheKey]
    } else {
      const overlap = overlapScore(kwA, kwB)

      if (overlap >= 0.60) {
        // High overlap — treat as equivalent without API call
        equivalent = true
        saveToCache(kwA, kwB, true)
      } else if (overlap < 0.25) {
        // Too different — definitely not equivalent
        equivalent = false
        saveToCache(kwA, kwB, false)
      } else {
        // Borderline — ask Claude
        if (!process.env.ANTHROPIC_API_KEY) {
          equivalent = overlap >= 0.45 // rough guess without API
        } else {
          process.stdout.write(`   🧠  Comparando: "${kwA.slice(0, 30)}" ↔ "${kwB.slice(0, 30)}"... `)
          equivalent = await areEquivalent(kwA, kwB)
          console.log(equivalent ? 'EQUIVALENTES' : 'diferentes')
          saveToCache(kwA, kwB, equivalent)
          apiCallCount++
          if (apiCallCount < keywords.length) await new Promise(r => setTimeout(r, 500))
        }
      }
    }

    if (equivalent) {
      group.duplicates.push(kwB)
      processed.add(kwB)
    }
  }

  if (group.duplicates.length > 0) {
    groups.push(group)
    processed.add(kwA)
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]
const reportLines = [
  `# Canonical Keyword Report — ${today}`,
  ``,
  `> ${keywords.length} keywords analisadas | ${groups.length} grupo(s) de duplicatas encontrado(s)`,
  groups.length > 0 ? `> Chamadas à API: ${apiCallCount} (restante do cache)` : '',
  ``,
  `---`,
  ``,
]

if (groups.length === 0) {
  reportLines.push('✅ Nenhuma duplicata semântica encontrada no backlog.')
} else {
  reportLines.push('## Grupos de keywords equivalentes', '')
  reportLines.push('> Mantenha a **canonical** e marque as duplicatas como `duplicata` no backlog.', '')

  for (const g of groups) {
    reportLines.push(`### Grupo: "${g.canonical}"`)
    reportLines.push(`- ✅ **Manter**: \`${g.canonical}\``)
    g.duplicates.forEach(d => {
      reportLines.push(`- ❌ **Duplicata**: \`${d}\` → criar um post seria canibalização`)
    })
    reportLines.push('')
  }

  reportLines.push('## Ação recomendada', '')
  reportLines.push('Execute com `--apply` para marcar as duplicatas automaticamente:')
  reportLines.push('```bash')
  reportLines.push('node scripts/keyword-canonicalize.mjs --apply')
  reportLines.push('```')
}

reportLines.push('', `---`, `_Gerado por \`scripts/keyword-canonicalize.mjs\` em ${today}_`)

if (!DRY_RUN) {
  fs.writeFileSync(path.join(ROOT, 'docs', 'canonical-report.md'), reportLines.join('\n'), 'utf-8')
  console.log(`\n✅  Relatório salvo em: docs/canonical-report.md`)

  // --apply: mark duplicates in backlog
  if (APPLY && groups.length > 0) {
    let updatedRaw = backlogRaw
    let markedCount = 0
    for (const g of groups) {
      for (const dup of g.duplicates) {
        const originalRow = keywords.find(k => k.keyword === dup)
        if (!originalRow) continue
        const newRow = originalRow._line.replace(
          /\|\s*pendente\s*\|/i,
          `| duplicata (→ ${g.canonical}) |`
        )
        if (newRow !== originalRow._line) {
          updatedRaw = updatedRaw.replace(originalRow._line, newRow)
          markedCount++
        }
      }
    }
    if (markedCount > 0) {
      fs.writeFileSync(path.join(ROOT, 'docs', 'keyword-backlog.md'), updatedRaw, 'utf-8')
      console.log(`   ${markedCount} duplicata(s) marcadas no backlog`)
    }
  }
} else {
  console.log('\n--- DRY RUN ---')
  console.log(reportLines.join('\n'))
}

if (groups.length > 0) {
  console.log(`\n⚠️  ${groups.length} grupo(s) de keywords equivalentes detectados:`)
  groups.forEach(g => {
    console.log(`   "${g.canonical}" ≡ ${g.duplicates.map(d => `"${d}"`).join(', ')}`)
  })
} else {
  console.log('\n✅  Backlog limpo — sem duplicatas semânticas')
}

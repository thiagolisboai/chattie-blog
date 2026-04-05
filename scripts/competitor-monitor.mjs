/**
 * Competitor Monitor — T4.19: monitora o conteúdo dos concorrentes
 *
 * Problema: concorrentes publicam novos posts sobre os mesmos temas.
 * Sem monitoramento, o Dexter não sabe quando um post nosso ficou desatualizado
 * porque um concorrente publicou algo melhor, ou quando há um gap que eles
 * cobriram mas nós ainda não.
 *
 * Solução:
 *   1. Lê lista de concorrentes em docs/competitors.md
 *   2. Para cada concorrente, busca posts recentes via Brave Search
 *   3. Compara os títulos/tópicos encontrados contra nossos posts publicados
 *   4. Identifica: gaps (eles têm, nós não), oportunidades (eles publicaram recentemente)
 *   5. Gera docs/competitor-report.md com análise acionável
 *
 * Uso:
 *   node scripts/competitor-monitor.mjs
 *   node scripts/competitor-monitor.mjs --add=agendor.com.br   (adiciona concorrente)
 *
 * Concorrentes padrão (se docs/competitors.md não existir):
 *   agendor.com.br, piperun.com, exact.com.br, meetime.com.br, zendesk.com/pt-br
 *
 * Requer:
 *   BRAVE_API_KEY — para buscas de conteúdo concorrente
 */

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

// ─── Default competitors ──────────────────────────────────────────────────────

const DEFAULT_COMPETITORS = [
  { domain: 'agendor.com.br',     name: 'Agendor',      focus: 'linkedin vendas b2b' },
  { domain: 'piperun.com',        name: 'PipeRun',       focus: 'prospecção linkedin crm' },
  { domain: 'exact.com.br',       name: 'Exact Sales',   focus: 'pré-vendas sdr b2b' },
  { domain: 'meetime.com.br',     name: 'Meetime',       focus: 'vendas b2b linkedin' },
  { domain: 'resultadosdigitais.com.br', name: 'RD Station', focus: 'marketing vendas b2b' },
]

// ─── Load competitors from file ───────────────────────────────────────────────

function loadCompetitors() {
  const p = path.join(ROOT, 'docs', 'competitors.md')
  if (!fs.existsSync(p)) {
    // Create with defaults on first run
    const defaultContent = [
      '# Concorrentes Monitorados',
      '',
      '> Lista de domínios monitorados pelo `competitor-monitor.mjs`.',
      '> Formato: `domain | Nome | foco de busca`',
      '',
      '| Domain | Nome | Foco de Busca |',
      '|--------|------|--------------|',
      ...DEFAULT_COMPETITORS.map(c => `| ${c.domain} | ${c.name} | ${c.focus} |`),
      '',
      '_Edite esta lista para adicionar ou remover concorrentes._',
    ].join('\n')
    fs.writeFileSync(p, defaultContent, 'utf-8')
    return DEFAULT_COMPETITORS
  }

  const raw = fs.readFileSync(p, 'utf-8')
  const rows = raw.split('\n')
    .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Domain'))
    .map(l => {
      const cols = l.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length < 3) return null
      return { domain: cols[0], name: cols[1], focus: cols[2] }
    })
    .filter(Boolean)

  return rows.length > 0 ? rows : DEFAULT_COMPETITORS
}

// ─── Handle --add flag ────────────────────────────────────────────────────────

const addArg = process.argv.find(a => a.startsWith('--add='))
if (addArg) {
  const domain = addArg.split('=').slice(1).join('=')
  const p = path.join(ROOT, 'docs', 'competitors.md')
  const raw = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
  if (raw.includes(domain)) {
    console.log(`⚠️  ${domain} já está na lista`)
  } else {
    fs.appendFileSync(p, `| ${domain} | (nome) | (foco de busca) |\n`, 'utf-8')
    console.log(`✅  Adicionado: ${domain}`)
    console.log(`   Edite docs/competitors.md para preencher nome e foco`)
  }
  process.exit(0)
}

// ─── Load our published posts ─────────────────────────────────────────────────

function loadOurPosts() {
  const dir = path.join(ROOT, 'content', 'blog')
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
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
      return {
        slug:     fm.slug || f.replace('.mdx', ''),
        title:    fm.title || '',
        category: fm.category || '',
        keywords: fm.title?.toLowerCase().split(/\s+/) || [],
      }
    })
    .filter(Boolean)
}

// ─── Tokenize for comparison ──────────────────────────────────────────────────

function tokenize(text) {
  return new Set(
    text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
  )
}

function overlapScore(a, b) {
  const tA = tokenize(a)
  const tB = tokenize(b)
  if (tA.size === 0) return 0
  const intersection = [...tA].filter(t => tB.has(t)).length
  return intersection / tA.size
}

function isCovered(competitorTitle, ourPosts) {
  return ourPosts.some(p => overlapScore(competitorTitle, p.title) >= 0.50)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const competitors = loadCompetitors()
const ourPosts    = loadOurPosts()
const today       = new Date().toISOString().split('T')[0]
const currentYear = new Date().getFullYear()

console.log(`\n🕵️  T4.19: Competitor monitoring iniciado`)
console.log(`   ${competitors.length} concorrentes | ${ourPosts.length} posts nossos`)

if (!process.env.BRAVE_API_KEY) {
  console.error('❌  BRAVE_API_KEY não configurado — necessário para buscas')
  process.exit(1)
}

const allFindings = []

for (const competitor of competitors) {
  console.log(`\n   Monitorando: ${competitor.name} (${competitor.domain})`)

  try {
    // Search for recent content from this competitor on their focus topics
    const query = `site:${competitor.domain} ${competitor.focus} ${currentYear}`
    const results = await braveSearch(query, 8)

    console.log(`   → ${results.length} resultado(s) encontrado(s)`)

    const findings = results.map(r => {
      const title   = r.title || ''
      const covered = isCovered(title, ourPosts)
      return {
        competitor: competitor.name,
        domain:     competitor.domain,
        title,
        url:        r.url,
        covered,
        // Simple gap detection: if they cover this but we don't
        isGap:      !covered && title.length > 10,
      }
    })

    allFindings.push(...findings)

    const gaps = findings.filter(f => f.isGap)
    if (gaps.length > 0) {
      console.log(`   ⚠️  ${gaps.length} gap(s) detectado(s):`)
      gaps.slice(0, 3).forEach(g => console.log(`      - "${g.title.slice(0, 70)}"`))
    } else {
      console.log(`   ✅  Cobertura OK — sem gaps críticos`)
    }

    // Delay between competitors to avoid rate limiting
    if (competitors.indexOf(competitor) < competitors.length - 1) {
      await new Promise(r => setTimeout(r, 2000))
    }
  } catch (err) {
    console.warn(`   ⚠️  Falha para ${competitor.name}: ${err.message}`)
  }
}

// ─── Generate report ──────────────────────────────────────────────────────────

const gaps       = allFindings.filter(f => f.isGap)
const covered    = allFindings.filter(f => f.covered)
const byCompetitor = {}
for (const f of allFindings) {
  if (!byCompetitor[f.competitor]) byCompetitor[f.competitor] = []
  byCompetitor[f.competitor].push(f)
}

const reportLines = [
  `# Competitor Content Report — ${today}`,
  ``,
  `> ${competitors.length} concorrentes | ${allFindings.length} posts analisados | **${gaps.length} gaps** | ${covered.length} tópicos cobertos`,
  ``,
  `---`,
  ``,
]

if (gaps.length > 0) {
  reportLines.push(
    `## 🚨 Gaps de conteúdo (concorrentes cobrem, nós não)`,
    ``,
    `> Adicione ao backlog os gaps de alta relevância.`,
    ``,
    `| Concorrente | Título | URL |`,
    `|------------|--------|-----|`,
    ...gaps.map(g => `| ${g.competitor} | ${g.title.slice(0, 60)} | ${g.url?.slice(0, 60) || '—'} |`),
    ``,
  )
} else {
  reportLines.push(`## ✅ Sem gaps críticos detectados nesta rodada`, ``)
}

// Per-competitor breakdown
reportLines.push(`## Detalhamento por concorrente`, ``)
for (const [name, findings] of Object.entries(byCompetitor)) {
  const compGaps = findings.filter(f => f.isGap)
  reportLines.push(
    `### ${name}`,
    ``,
    `| Status | Título |`,
    `|--------|--------|`,
    ...findings.map(f => `| ${f.isGap ? '❌ Gap' : '✅ Coberto'} | ${f.title.slice(0, 70)} |`),
    ``,
  )
}

// Add to backlog suggestions
if (gaps.length > 0) {
  reportLines.push(
    `## 📋 Sugestões para adicionar ao backlog`,
    ``,
    `Copie os gaps relevantes para \`docs/keyword-backlog.md\`:`,
    ``,
    '```',
    ...gaps.slice(0, 5).map(g => `| ${g.title.slice(0, 50)} | informacional | Média | Alta | pendente |`),
    '```',
    ``,
  )
}

reportLines.push(
  `---`,
  `_Gerado por \`scripts/competitor-monitor.mjs\` em ${today}_`,
  `_Próxima execução: adicione ao workflow mensal ou rode manualmente_`,
)

fs.writeFileSync(path.join(ROOT, 'docs', 'competitor-report.md'), reportLines.join('\n'), 'utf-8')
console.log(`\n✅  Relatório salvo em: docs/competitor-report.md`)
console.log(`   Gaps encontrados: ${gaps.length} | Cobertos: ${covered.length}`)

if (gaps.length > 0) {
  console.log(`\n   Top gaps para adicionar ao backlog:`)
  gaps.slice(0, 3).forEach(g => console.log(`   - [${g.competitor}] ${g.title.slice(0, 60)}`))
}

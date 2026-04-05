/**
 * Source Audit — Fase 4 do Agente de Conteúdo Chattie
 *
 * Escaneia todos os posts MDX e identifica:
 *   - Citações com atribuição a fontes externas (Segundo X, De acordo com X)
 *   - Estatísticas numéricas sem fonte (números soltos com %)
 *   - Padrões de "resultado documentado" sem referência real
 *
 * Uso:
 *   node scripts/source-audit.mjs
 *   node scripts/source-audit.mjs --strict   (inclui avisos de baixa prioridade)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const STRICT = process.argv.includes('--strict')

const DIRS = [
  path.join(ROOT, 'content', 'blog'),
  path.join(ROOT, 'content', 'blog-en'),
]

// ─── Verified sources (known-good, won't be flagged) ────────────────────────

const VERIFIED_SOURCES = [
  'linkedin',
  'linkedin (2024)',
  'linkedin (2023)',
  'linkedin (2025)',
  'linkedin sales solutions',
  'mckinsey',
  'mckinsey & company',
  'hubspot',
  'salesforce',
  'gartner',
  'forrester',
  'tra',          // internal client data referenced in posts
  'agendor',
  'piperun',
]

// Patterns that indicate a non-verifiable source was fabricated
const RISKY_SOURCES = [
  'aberdeen group',
  'sales benchmark index',
  'sbi',
  'datanyze',
  'cso insights',
  'sirius decisions',
]

// ─── Regex patterns ──────────────────────────────────────────────────────────

const ATTRIBUTION_PT = /(?:segundo|de acordo com|conforme|dados (?:d[ao]|do)|pesquisa d[ao]|estudo d[ao]|relatório d[ao]|levantamento d[ao])\s+([^,\.–—\n]+)/gi
const ATTRIBUTION_EN = /(?:according to|per|based on|data from|research (?:by|from)|study (?:by|from)|report (?:by|from))\s+([^,\.–—\n]+)/gi
const STAT_NO_SOURCE  = /\b(\d+(?:\.\d+)?)\s*(?:%|x mais|x better|times more|vezes mais)\b/gi
const RESULT_VAGOS    = /(?:resultado documentado|times (?:que implementaram|with|that implemented)|empresas (?:que|that)|equipes (?:que|that))[\s\S]{0,80}(?:\d+[-–]\d+%|\d+%)/gi

// ─── Process files ───────────────────────────────────────────────────────────

const issues = []  // { file, line, type, text, source? }

function scanFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const lines = raw.split('\n')
  const fileName = path.relative(ROOT, filePath)

  // Skip frontmatter
  let inFrontmatter = false
  let fmDone = false
  let fmCount = 0

  lines.forEach((line, idx) => {
    if (line.trim() === '---') {
      fmCount++
      if (fmCount === 2) fmDone = true
      return
    }
    if (!fmDone) return

    const lineNum = idx + 1

    // Check for attributions
    const ptMatches = [...line.matchAll(ATTRIBUTION_PT)]
    const enMatches = [...line.matchAll(ATTRIBUTION_EN)]

    for (const match of [...ptMatches, ...enMatches]) {
      const sourceName = match[1].toLowerCase().trim()
      const isRisky = RISKY_SOURCES.some((r) => sourceName.includes(r))
      const isVerified = VERIFIED_SOURCES.some((v) => sourceName.includes(v))

      if (isRisky) {
        issues.push({
          file: fileName,
          line: lineNum,
          type: '🚨 FONTE SUSPEITA',
          text: line.trim().slice(0, 120),
          source: match[1].trim(),
        })
      } else if (!isVerified && STRICT) {
        issues.push({
          file: fileName,
          line: lineNum,
          type: '⚠️  Fonte não verificada',
          text: line.trim().slice(0, 120),
          source: match[1].trim(),
        })
      }
    }

    // Check for stats without any source
    const statMatches = [...line.matchAll(STAT_NO_SOURCE)]
    if (statMatches.length > 0) {
      const hasSource = ptMatches.length > 0 || enMatches.length > 0
      const hasParen = /\([\w\s]+,?\s*\d{4}\)/.test(line) // e.g. (LinkedIn, 2024)
      const hasLink = /\[.+?\]\(.+?\)/.test(line)
      if (!hasSource && !hasParen && !hasLink && STRICT) {
        issues.push({
          file: fileName,
          line: lineNum,
          type: '📊 Stat sem fonte',
          text: line.trim().slice(0, 120),
        })
      }
    }

    // Check for vague "resultado documentado" patterns
    const vagueMatches = line.match(/resultado documentado|times (?:que implementaram)/i)
    if (vagueMatches && STRICT) {
      issues.push({
        file: fileName,
        line: lineNum,
        type: '📝 Dado vago',
        text: line.trim().slice(0, 120),
      })
    }
  })
}

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) continue
  fs.readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .forEach((f) => scanFile(path.join(dir, f)))
}

// ─── Output ──────────────────────────────────────────────────────────────────

const critical = issues.filter((i) => i.type.includes('SUSPEITA'))
const warnings = issues.filter((i) => !i.type.includes('SUSPEITA'))

console.log(`
╔══════════════════════════════════════════════════════════╗
║           Source Audit — Chattie Blog                    ║
╚══════════════════════════════════════════════════════════╝
${STRICT ? '  Modo: --strict (inclui avisos de baixa prioridade)' : '  Modo: padrão (apenas fontes suspeitas/críticas)'}
`)

if (critical.length === 0 && issues.length === 0) {
  console.log('✅  Nenhuma fonte suspeita encontrada. Blog limpo.\n')
  process.exit(0)
}

if (critical.length > 0) {
  console.log(`🚨  Fontes suspeitas (corrigir antes de publicar): ${critical.length}\n`)
  critical.forEach((i) => {
    console.log(`  ${i.type}`)
    console.log(`  Arquivo: ${i.file}:${i.line}`)
    if (i.source) console.log(`  Fonte citada: "${i.source}"`)
    console.log(`  Texto: "${i.text}"`)
    console.log('')
  })
}

if (warnings.length > 0 && STRICT) {
  console.log(`⚠️   Avisos (revisar): ${warnings.length}\n`)
  warnings.forEach((i) => {
    console.log(`  ${i.type} — ${i.file}:${i.line}`)
    console.log(`  "${i.text}"`)
    console.log('')
  })
}

console.log(`─────────────────────────────────────────────────────
  Fontes suspeitas:    ${critical.length}
  Avisos (--strict):   ${warnings.length}
  Total verificado:    ${DIRS.flatMap(d => fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.mdx')) : []).length} posts
─────────────────────────────────────────────────────

💡  Regras de citação: docs/source-guidelines.md
`)

if (critical.length > 0) process.exit(1)

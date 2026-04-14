/**
 * bulk-eeat.mjs — Adiciona campos E-E-A-T e dateModified a posts que não os têm
 *
 * Campos adicionados (quando ausentes):
 *   authorTitle, authorBio, authorLinkedIn, dateModified
 *
 * Uso:
 *   node scripts/bulk-eeat.mjs             # aplica
 *   node scripts/bulk-eeat.mjs --dry-run   # só lista o que mudaria
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')

const TODAY = new Date().toISOString().split('T')[0]   // 2026-04-14

// ─── Author data ─────────────────────────────────────────────────────────────

const EEAT = {
  'pt-BR': {
    authorTitle:    'CEO & Co-founder, Chattie',
    authorBio:      'Thiago Lisboa é CEO e co-founder do Chattie, AI SDR para LinkedIn. Especialista em vendas B2B, social selling e automação de prospecção para founders e equipes comerciais brasileiras.',
    authorLinkedIn: 'https://www.linkedin.com/in/thiagolisboai',
  },
  'en': {
    authorTitle:    'CEO & Co-founder, Chattie',
    authorBio:      'Thiago Lisboa is CEO and co-founder of Chattie, AI SDR for LinkedIn. B2B sales specialist focused on social selling and prospecting automation for founders and commercial teams.',
    authorLinkedIn: 'https://www.linkedin.com/in/thiagolisboai',
  },
}

// ─── Dirs ────────────────────────────────────────────────────────────────────

const DIRS = [
  { dir: path.join(ROOT, 'content', 'blog'),    lang: 'pt-BR' },
  { dir: path.join(ROOT, 'content', 'blog-en'), lang: 'en' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasFrontmatterKey(raw, key) {
  return new RegExp(`^${key}:`, 'm').test(raw)
}

function insertAfterKey(raw, anchorKey, newLines) {
  // Insert newLines immediately after the line matching anchorKey: ...
  const lines = raw.split('\n')
  const idx = lines.findIndex(l => l.startsWith(`${anchorKey}:`))
  if (idx === -1) return raw
  lines.splice(idx + 1, 0, ...newLines)
  return lines.join('\n')
}

function insertBeforeClosingFence(raw, newLines) {
  // Insert newLines just before the closing ---
  const fenceIdx = raw.indexOf('\n---\n')
  if (fenceIdx === -1) return raw
  const before = raw.slice(0, fenceIdx)
  const after  = raw.slice(fenceIdx)
  return before + '\n' + newLines.join('\n') + after
}

// ─── Process files ───────────────────────────────────────────────────────────

let total = 0
let changed = 0

for (const { dir, lang } of DIRS) {
  const eeat = EEAT[lang]
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'))

  for (const file of files) {
    const filePath = path.join(dir, file)
    let raw = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n')
    total++

    const needsTitle    = !hasFrontmatterKey(raw, 'authorTitle')
    const needsBio      = !hasFrontmatterKey(raw, 'authorBio')
    const needsLinkedIn = !hasFrontmatterKey(raw, 'authorLinkedIn')
    const needsDate     = !hasFrontmatterKey(raw, 'dateModified')

    if (!needsTitle && !needsBio && !needsLinkedIn && !needsDate) continue

    const slug = file.replace('.mdx', '')
    const fields = []
    if (needsTitle)    fields.push('authorTitle')
    if (needsBio)      fields.push('authorBio')
    if (needsLinkedIn) fields.push('authorLinkedIn')
    if (needsDate)     fields.push('dateModified')

    console.log(`${DRY_RUN ? '[dry] ' : ''}${lang.padEnd(5)} ${slug}`)
    console.log(`       adding: ${fields.join(', ')}`)

    if (!DRY_RUN) {
      // Add E-E-A-T fields after the `author:` line
      if (needsTitle || needsBio || needsLinkedIn) {
        const toInsert = []
        if (needsTitle)    toInsert.push(`authorTitle: "${eeat.authorTitle}"`)
        if (needsBio)      toInsert.push(`authorBio: "${eeat.authorBio}"`)
        if (needsLinkedIn) toInsert.push(`authorLinkedIn: "${eeat.authorLinkedIn}"`)
        raw = insertAfterKey(raw, 'author', toInsert)
      }

      // Add dateModified before closing ---
      if (needsDate) {
        if (hasFrontmatterKey(raw, 'dateModified')) {
          // already added in a previous loop pass (shouldn't happen but guard)
        } else {
          raw = insertAfterKey(raw, 'date', [`dateModified: "${TODAY}"`])
        }
      }

      fs.writeFileSync(filePath, raw, 'utf-8')
    }

    changed++
  }
}

console.log(`\n✅  ${changed}/${total} posts ${DRY_RUN ? 'precisariam de' : 'atualizados com'} campos E-E-A-T / dateModified`)
if (DRY_RUN) console.log('   Rode sem --dry-run para aplicar.')

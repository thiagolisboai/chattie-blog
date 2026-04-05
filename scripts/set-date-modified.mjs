/**
 * Set dateModified — utilitário para atualizar o campo dateModified no frontmatter
 *
 * Uso:
 *   node scripts/set-date-modified.mjs [slug] [data]
 *
 * Exemplos:
 *   node scripts/set-date-modified.mjs ia-para-vendas-b2b 2026-04-05
 *   node scripts/set-date-modified.mjs --all 2026-04-05         (todos os posts)
 *   node scripts/set-date-modified.mjs --all                    (usa hoje)
 *
 * Se dateModified já existir, atualiza. Se não existir, insere após o campo "date:".
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const DIRS = [
  path.join(ROOT, 'content', 'blog'),
  path.join(ROOT, 'content', 'blog-en'),
]

const args = process.argv.slice(2)
const ALL = args[0] === '--all'
const targetSlug = ALL ? null : args[0]
const targetDate = (ALL ? args[1] : args[1]) || new Date().toISOString().split('T')[0]

if (!targetSlug && !ALL) {
  console.log(`
Uso:
  node scripts/set-date-modified.mjs [slug] [data]
  node scripts/set-date-modified.mjs --all [data]

Exemplos:
  node scripts/set-date-modified.mjs ia-para-vendas-b2b 2026-04-05
  node scripts/set-date-modified.mjs --all 2026-04-05
`)
  process.exit(0)
}

let updated = 0

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) continue
  fs.readdirSync(dir).filter(f => f.endsWith('.mdx')).forEach(f => {
    const filePath = path.join(dir, f)
    const slug = f.replace('.mdx', '')

    if (!ALL && slug !== targetSlug) return

    let raw = fs.readFileSync(filePath, 'utf-8')

    if (raw.includes('dateModified:')) {
      // Update existing
      raw = raw.replace(
        /dateModified:\s*"[^"]*"/,
        `dateModified: "${targetDate}"`
      )
    } else {
      // Insert after date:
      raw = raw.replace(
        /^(date:\s*"[^"]*")$/m,
        `$1\ndateModified: "${targetDate}"`
      )
    }

    fs.writeFileSync(filePath, raw, 'utf-8')
    console.log(`✅  ${slug} → dateModified: "${targetDate}"`)
    updated++
  })
}

if (updated === 0 && !ALL) {
  console.log(`❌  Post "${targetSlug}" não encontrado.`)
} else {
  console.log(`\n${updated} post(s) atualizado(s).`)
}

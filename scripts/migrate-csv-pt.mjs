// migrate-csv-pt.mjs — Fase 4: migrar blog-history.csv para /content/blog/
// Uso: node scripts/migrate-csv-pt.mjs
// Requer: npm install turndown csv-parse

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function main() {
  const csvPath = path.join(ROOT, 'blog-history.csv')
  if (!fs.existsSync(csvPath)) {
    console.error('blog-history.csv não encontrado na raiz do projeto.')
    process.exit(1)
  }

  // Dynamically import csv-parse and turndown
  const { parse } = await import('csv-parse/sync')
  const TurndownService = (await import('turndown')).default

  const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })
  const csv = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csv, { columns: true, skip_empty_lines: true })

  const outDir = path.join(ROOT, 'content/blog')
  fs.mkdirSync(outDir, { recursive: true })

  let count = 0
  for (const record of records) {
    const title = record.title || record.Title || ''
    const content = record.content || record.Content || record.body || record.Body || ''
    if (!title || !content) continue

    const slug = slugify(title)
    const plainText = stripHtml(content)
    const description = plainText.slice(0, 155)
    const excerpt = plainText.slice(0, 100)
    const markdown = td.turndown(content)
    const today = new Date().toISOString().split('T')[0]

    const mdx = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
lang: "pt-BR"
date: "${today}"
publishedAt: "${today}T09:00:00-03:00"
description: "${description.replace(/"/g, '\\"')}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
category: "chattie"
tags: ["chattie", "linkedin", "b2b"]
image: ""
author: "Thiago Lisboa"
readTime: "5 min"
canonicalUrl: "https://trychattie.com/pt-br/blog/${slug}"
structuredData: "article"
geoOptimized: false
enSlug: ""
---

${markdown}
`

    fs.writeFileSync(path.join(outDir, `${slug}.mdx`), mdx, 'utf-8')
    count++
    console.log(`✓ ${slug}.mdx`)
  }

  console.log(`\nMigração concluída: ${count} posts gerados em content/blog/`)
  console.log('Próximo passo: revisar 5 posts como amostra antes do commit.')
}

main().catch(console.error)

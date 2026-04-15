/**
 * submit-feeds.mjs — Item 19 do Tier 5
 *
 * Mostra os links de submissão dos feeds RSS do Chattie Blog
 * e abre automaticamente no navegador (Windows/Mac/Linux).
 *
 * Feeds:
 *   PT-BR: https://trychattie.com/feed.xml
 *   EN:    https://trychattie.com/en/feed.xml
 *
 * Uso:
 *   node scripts/submit-feeds.mjs          # imprime instruções
 *   node scripts/submit-feeds.mjs --open   # abre os links no navegador
 */

import { execSync } from 'child_process'

const FEEDS = {
  'PT-BR': 'https://trychattie.com/feed.xml',
  'EN':    'https://trychattie.com/en/feed.xml',
}

const AGGREGATORS = [
  {
    name: 'Feedly',
    description: 'Maior agregador RSS — indexa automaticamente após submissão',
    submitUrl: (feedUrl) => `https://feedly.com/i/subscription/feed/${encodeURIComponent(feedUrl)}`,
    note: 'Crie uma conta Feedly, adicione o feed via URL. A indexação é automática após adicionar.',
  },
  {
    name: 'Feedly OPML',
    description: 'Para submissão em massa via OPML (alternativa)',
    submitUrl: () => 'https://feedly.com/i/opml',
    note: 'Importe o arquivo docs/feeds.opml para registrar ambos os feeds de uma vez.',
  },
  {
    name: 'NewsBlur',
    description: 'Alternativa popular ao Google Reader',
    submitUrl: (feedUrl) => `https://newsblur.com/?url=${encodeURIComponent(feedUrl)}`,
    note: 'Registre uma conta em newsblur.com e adicione o feed pela URL.',
  },
  {
    name: 'Inoreader',
    description: 'Reader profissional — bom para indexação de conteúdo B2B',
    submitUrl: (feedUrl) => `https://www.inoreader.com/?add_feed=${encodeURIComponent(feedUrl)}`,
    note: 'Crie uma conta em inoreader.com. A subscrição dispara indexação.',
  },
  {
    name: 'Perplexity Browse',
    description: 'Perplexity rastreia feeds RSS automaticamente via sitemaps e links de descoberta',
    submitUrl: () => null,
    note: 'Nenhuma ação manual necessária. O <link rel="alternate" type="application/rss+xml"> já está no <head> do site — Perplexity rastreia por sitemap e descoberta automática.',
  },
]

const OPEN_FLAG = process.argv.includes('--open')

function openUrl(url) {
  try {
    const platform = process.platform
    if (platform === 'win32') execSync(`start "" "${url}"`)
    else if (platform === 'darwin') execSync(`open "${url}"`)
    else execSync(`xdg-open "${url}"`)
  } catch {
    // Silently ignore — URL is still printed
  }
}

console.log(`
╔══════════════════════════════════════════════════════════╗
║       RSS Feed Submission — Chattie Blog Tier 5          ║
╚══════════════════════════════════════════════════════════╝

Feeds do Chattie Blog:
  PT-BR:  ${FEEDS['PT-BR']}
  EN:     ${FEEDS['EN']}

Guia completo: docs/feed-submission.md
`)

for (const agg of AGGREGATORS) {
  console.log(`─── ${agg.name} ───────────────────────────────────────────────`)
  console.log(`    ${agg.description}`)
  console.log(`    Nota: ${agg.note}`)

  for (const [lang, feedUrl] of Object.entries(FEEDS)) {
    const url = agg.submitUrl(feedUrl)
    if (url) {
      console.log(`    [${lang}] ${url}`)
      if (OPEN_FLAG) {
        openUrl(url)
      }
    }
  }
  console.log('')
}

if (!OPEN_FLAG) {
  console.log(`
Dica: rode com --open para abrir todos os links automaticamente:
  node scripts/submit-feeds.mjs --open
`)
}

console.log(`
Status de submissão: docs/feed-submission.md (atualizar manualmente após submeter)
`)

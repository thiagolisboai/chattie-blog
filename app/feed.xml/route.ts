import { getAllPostsPt } from '@/lib/posts-pt'

const BASE = 'https://trychattie.com'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts = getAllPostsPt().slice(0, 20)

  const items = posts
    .map((post) => {
      const pubDate = new Date(post.publishedAt || post.date).toUTCString()
      const link = `${BASE}/pt-br/blog/${post.slug}`
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.excerpt || post.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(post.category)}</category>
      ${post.image ? `<enclosure url="${escapeXml(post.image)}" type="image/jpeg" length="0" />` : ''}
      <author>blog@trychattie.com (${escapeXml(post.author || 'Thiago Lisboa')})</author>
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Chattie Blog — Social Selling e LinkedIn B2B</title>
    <link>${BASE}/pt-br/blog</link>
    <description>Insights sobre social selling, LinkedIn B2B e IA para vendas — pelo time do Chattie.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE}/og-default.png</url>
      <title>Chattie Blog</title>
      <link>${BASE}/pt-br/blog</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

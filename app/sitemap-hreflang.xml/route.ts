/**
 * Sitemap de hreflang — declara pares PT-BR/EN para o Google
 *
 * Gera um sitemap XML com <xhtml:link rel="alternate"> para cada post
 * que tem equivalente nos dois idiomas. Isso reforça o sinal hreflang
 * além dos meta tags já presentes no HTML de cada página.
 *
 * URL: https://trychattie.com/sitemap-hreflang.xml
 */

import { getAllPostsPt } from '@/lib/posts-pt'
import { getAllPostsEn } from '@/lib/posts-en'

const BASE = 'https://trychattie.com'

export async function GET() {
  const ptPosts = getAllPostsPt()
  const enPosts = getAllPostsEn()

  // Build lookup: enSlug → EN post
  const enBySlug = new Map(enPosts.map((p) => [p.slug, p]))
  // Build lookup: ptSlug → PT post (from EN post's ptSlug field)
  const ptBySlug = new Map(ptPosts.map((p) => [p.slug, p]))

  const urls: string[] = []

  // PT-BR posts that have an EN pair
  for (const pt of ptPosts) {
    if (!pt.enSlug) continue
    const en = enBySlug.get(pt.enSlug)
    if (!en) continue

    const ptUrl  = `${BASE}/pt-br/blog/${pt.slug}`
    const enUrl  = `${BASE}/blog/${en.slug}`
    const lastMod = (pt.dateModified || pt.date).split('T')[0]

    urls.push(`
  <url>
    <loc>${ptUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${ptUrl}"/>
    <xhtml:link rel="alternate" hreflang="en"    href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>
  </url>
  <url>
    <loc>${enUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${ptUrl}"/>
    <xhtml:link rel="alternate" hreflang="en"    href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>
  </url>`)
  }

  // EN-only posts (no PT pair)
  for (const en of enPosts) {
    const hasPtPair = ptPosts.some((p) => p.enSlug === en.slug)
    if (hasPtPair) continue

    const enUrl  = `${BASE}/blog/${en.slug}`
    const lastMod = (en.dateModified || en.date).split('T')[0]

    urls.push(`
  <url>
    <loc>${enUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <xhtml:link rel="alternate" hreflang="en"        href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

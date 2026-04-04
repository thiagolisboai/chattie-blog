import { MetadataRoute } from 'next'
import { getAllPostsPt } from '@/lib/posts-pt'

export default function sitemapPt(): MetadataRoute.Sitemap {
  const posts = getAllPostsPt()
  return [
    {
      url: 'https://trychattie.com/pt-br/blog',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...posts.map((post) => ({
      url: `https://trychattie.com/pt-br/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}

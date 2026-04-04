import { MetadataRoute } from 'next'
import { getAllPostsEn } from '@/lib/posts-en'

export default function sitemapEn(): MetadataRoute.Sitemap {
  const posts = getAllPostsEn()
  if (posts.length === 0) return []
  return [
    {
      url: 'https://trychattie.com/blog',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...posts.map((post) => ({
      url: `https://trychattie.com/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}

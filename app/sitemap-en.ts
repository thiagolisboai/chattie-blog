import { MetadataRoute } from 'next'
import { getAllPostsEn } from '@/lib/posts-en'
import { AUTHORS } from '@/lib/authors'

export default function sitemapEn(): MetadataRoute.Sitemap {
  const posts = getAllPostsEn()

  // Collect active categories from EN posts
  const activeCats = [...new Set(posts.map((p) => p.category))]

  return [
    {
      url: 'https://trychattie.com/blog',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Category pages
    ...activeCats.map((cat) => ({
      url: `https://trychattie.com/blog/category/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
    // Resource pages
    {
      url: 'https://trychattie.com/resources/linkedin-prospecting-checklist',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: 'https://trychattie.com/resources/linkedin-connection-templates',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: 'https://trychattie.com/resources/linkedin-followup-script',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Author pages
    ...Object.values(AUTHORS).map((author) => ({
      url: `https://trychattie.com/blog/author/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Individual posts
    ...posts.map((post) => ({
      url: `https://trychattie.com/blog/${post.slug}`,
      lastModified: new Date(post.dateModified || post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}

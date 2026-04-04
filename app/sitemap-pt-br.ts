import { MetadataRoute } from 'next'
import { getAllPostsPt } from '@/lib/posts-pt'

const PT_CATEGORIES = ['linkedin', 'social-selling', 'chattie', 'b2b', 'ia-para-vendas', 'comparativos']

export default function sitemapPt(): MetadataRoute.Sitemap {
  const posts = getAllPostsPt()

  // Collect actual categories from posts
  const activeCats = [...new Set(posts.map((p) => p.category))].filter((c) =>
    PT_CATEGORIES.includes(c)
  )

  return [
    {
      url: 'https://trychattie.com/pt-br/blog',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Category listing pages
    ...activeCats.map((cat) => ({
      url: `https://trychattie.com/pt-br/blog/categoria/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
    // Resource pages
    {
      url: 'https://trychattie.com/pt-br/recursos/checklist-prospeccao-linkedin',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Individual posts
    ...posts.map((post) => ({
      url: `https://trychattie.com/pt-br/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}

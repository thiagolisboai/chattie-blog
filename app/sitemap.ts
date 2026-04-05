import { MetadataRoute } from 'next'
import { getAllPostsPt } from '@/lib/posts-pt'
import { getAllPostsEn } from '@/lib/posts-en'
import { AUTHORS } from '@/lib/authors'

const BASE = 'https://trychattie.com'
const PT_CATEGORIES = ['linkedin', 'social-selling', 'chattie', 'b2b', 'ia-para-vendas', 'comparativos']

export default function sitemap(): MetadataRoute.Sitemap {
  const ptPosts = getAllPostsPt()
  const enPosts = getAllPostsEn()

  const ptActiveCats = [...new Set(ptPosts.map((p) => p.category))].filter((c) =>
    PT_CATEGORIES.includes(c)
  )
  const enActiveCats = [...new Set(enPosts.map((p) => p.category))]

  return [
    // ── PT-BR static pages ──────────────────────────────────────────────────
    { url: `${BASE}/pt-br/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...ptActiveCats.map((cat) => ({
      url: `${BASE}/pt-br/blog/categoria/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
    { url: `${BASE}/pt-br/recursos/checklist-prospeccao-linkedin`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE}/pt-br/recursos/templates-mensagem-linkedin`,   lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE}/pt-br/recursos/script-follow-up-linkedin`,     lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    ...Object.values(AUTHORS).map((author) => ({
      url: `${BASE}/pt-br/blog/autor/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),

    // ── PT-BR posts ─────────────────────────────────────────────────────────
    ...ptPosts.map((post) => ({
      url: `${BASE}/pt-br/blog/${post.slug}`,
      lastModified: new Date(post.dateModified || post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    // ── EN static pages ─────────────────────────────────────────────────────
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...enActiveCats.map((cat) => ({
      url: `${BASE}/blog/category/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
    { url: `${BASE}/resources/linkedin-prospecting-checklist`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE}/resources/linkedin-connection-templates`,  lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE}/resources/linkedin-followup-script`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    ...Object.values(AUTHORS).map((author) => ({
      url: `${BASE}/blog/author/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),

    // ── EN posts ────────────────────────────────────────────────────────────
    ...enPosts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.dateModified || post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}

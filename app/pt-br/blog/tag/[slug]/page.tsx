import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllPostsPt } from '@/lib/posts-pt'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getAllPostsPt()
  const tags = [...new Set(posts.flatMap((p) => p.tags || []))]
  return tags.map((tag) => ({ slug: tag.toLowerCase().replace(/\s+/g, '-') }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const label = slug.replace(/-/g, ' ')
  return {
    title: `#${label} | Blog Chattie`,
    description: `Todos os artigos sobre ${label} — social selling, LinkedIn B2B e IA para vendas pelo Chattie.`,
    alternates: { canonical: `https://trychattie.com/pt-br/blog/tag/${slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function TagPagePt({ params }: Props) {
  const { slug } = await params
  const all = getAllPostsPt()

  const posts = all.filter((p) =>
    (p.tags || []).some((t) => t.toLowerCase().replace(/\s+/g, '-') === slug)
  )

  if (posts.length === 0) notFound()

  const label = posts[0].tags?.find(
    (t) => t.toLowerCase().replace(/\s+/g, '-') === slug
  ) ?? slug

  return (
    <>
      <BlogNav lang="pt-BR" />
      <RevealObserver />
      <ScrollToTopButton />

      {/* Header */}
      <div style={{ background: '#FAFBF3', borderBottom: '2px solid #000', padding: '4rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Link href="/pt-br/blog" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2F6451', textDecoration: 'none' }}>
              ← Todos os artigos
            </Link>
          </div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2F6451', marginBottom: '0.5rem' }}>
            Tag
          </p>
          <h1 style={{
            fontFamily: "'Sherika', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '0.75rem',
          }}>
            #{label}
          </h1>
          <p style={{ fontSize: '1rem', color: '#555' }}>
            {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'} com esta tag
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {posts.map((post, i) => (
            <div key={post.slug} className="reveal" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
              <BlogCard post={post} basePath="/pt-br/blog" lang="pt-BR" />
            </div>
          ))}
        </div>
      </main>

      <BlogFooter lang="pt-BR" />
    </>
  )
}

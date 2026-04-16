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
    robots: { index: false, follow: true },
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

  // Related tags: all tags from matching posts, excluding current
  const relatedTags = [...new Set(
    posts.flatMap((p) => p.tags || []).filter((t) => t.toLowerCase().replace(/\s+/g, '-') !== slug)
  )].slice(0, 8)

  return (
    <>
      <BlogNav lang="pt-BR" />
      <RevealObserver />
      <ScrollToTopButton />

      {/* Hero */}
      <div
        style={{
          background: '#FAFBF3',
          borderBottom: '2px solid #000',
          padding: '4.5rem 1.5rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="grain-overlay" />
        {/* Top accent stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#2F6451' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link
            href="/pt-br/blog"
            style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2F6451', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}
          >
            ← Todos os artigos
          </Link>

          <p style={{
            fontFamily: "'Sherika', sans-serif",
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.13em',
            color: '#2F6451',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ display: 'inline-block', width: 14, height: 2, background: 'currentColor' }} />
            Tag
          </p>

          {/* Tag badge */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h1 style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              margin: 0,
            }}>
              <span style={{ color: '#2F6451', fontWeight: 700 }}>#</span>{label}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{
              background: '#000',
              color: '#FAFBF3',
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '0.25rem 0.75rem',
              letterSpacing: '0.05em',
            }}>
              {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}
            </span>
          </div>
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

        {/* Related tags */}
        {relatedTags.length > 0 && (
          <div style={{ marginTop: '4rem', paddingTop: '2.5rem', borderTop: '2px solid #000' }}>
            <p style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              color: '#666',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ display: 'inline-block', width: 14, height: 2, background: 'currentColor' }} />
              Tags relacionadas
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {relatedTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/pt-br/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  className="tag-pill"
                  style={{ fontSize: '0.82rem', fontWeight: 600 }}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <BlogFooter lang="pt-BR" />
    </>
  )
}

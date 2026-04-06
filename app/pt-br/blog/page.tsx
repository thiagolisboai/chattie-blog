import type { Metadata } from 'next'
import { getAllPostsPt } from '@/lib/posts-pt'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'
import { NewsletterCta } from '@/components/newsletter-cta'
import { BlogHeroSymbols } from '@/components/blog-hero-symbols'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog LinkedIn B2B e Social Selling | Chattie',
  description: 'Insights práticos sobre prospecção no LinkedIn, social selling e IA para vendas — para founders e consultores B2B brasileiros.',
  alternates: {
    canonical: 'https://trychattie.com/pt-br/blog',
    languages: { 'pt-BR': 'https://trychattie.com/pt-br/blog' },
  },
  openGraph: {
    title: 'Blog LinkedIn B2B e Social Selling | Chattie',
    description: 'Insights práticos sobre prospecção no LinkedIn, social selling e IA para vendas.',
    url: 'https://trychattie.com/pt-br/blog',
    locale: 'pt_BR',
    type: 'website',
  },
}

const POSTS_PER_PAGE = 12

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function BlogListPt({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))
  const allPosts = getAllPostsPt()
  const totalPages = Math.ceil(Math.max(0, allPosts.length - 1) / POSTS_PER_PAGE)
  const [featured] = allPosts
  const rest = allPosts.slice(1 + (currentPage - 1) * POSTS_PER_PAGE, 1 + currentPage * POSTS_PER_PAGE)

  return (
    <>
      <ScrollToTopButton />
      <BlogNav lang="pt-BR" />
      <RevealObserver />

      {/* Hero header */}
      <div
        className="blog-listing-hero"
        style={{
          background: `#FAFBF3 url('/brand/orange-gradient-bg.png') no-repeat top right / 50%`,
          borderBottom: '2px solid #000',
          padding: '4rem 1.5rem 3rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grain */}
        <div className="grain-overlay" />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="eyebrow" style={{ color: '#2F6451' }}>Blog em Português</p>
            <h1
              style={{
                fontFamily: "'Sherika', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(2.2rem, 4.2vw, 3.5rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem',
                maxWidth: 560,
              }}
            >
              Social selling e LinkedIn B2B para quem vende de verdade.
            </h1>
            <p style={{ fontSize: '1rem', color: '#555', lineHeight: 1.75, maxWidth: 480, marginBottom: '1.75rem' }}>
              Insights práticos sobre prospecção, IA para vendas e social selling —
              para founders e consultores B2B.
            </p>
            <Link
              href="/blog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#2F6451',
                textDecoration: 'none',
                border: '1.5px solid #2F6451',
                padding: '0.35rem 0.85rem',
                letterSpacing: '0.02em',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              🇺🇸 Read in English
            </Link>
          </div>

          {/* Right: brand symbols */}
          <div className="hero-symbols-col" style={{ width: 360, flexShrink: 0 }}>
            <BlogHeroSymbols />
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 1.5rem 5rem' }}>
        {allPosts.length === 0 ? (
          <div className="card-brutalist" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Em breve.</p>
            <p style={{ color: '#666' }}>Os primeiros posts estão chegando.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Featured post */}
            {featured && (
              <BlogCard post={featured} basePath="/pt-br/blog" featured lang="pt-BR" />
            )}

            {/* Newsletter */}
            <NewsletterCta lang="pt-BR" />

            {/* Divider */}
            {rest.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                <div style={{ flex: 1, height: 2, background: '#000' }} />
                <p className="eyebrow" style={{ marginBottom: 0 }}>Todos os artigos</p>
                <div style={{ flex: 1, height: 2, background: '#000' }} />
              </div>
            )}

            {/* Grid */}
            <div
              className="blog-grid-auto"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {rest.map((post, i) => (
                <div key={post.slug} style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                  <BlogCard post={post} basePath="/pt-br/blog" lang="pt-BR" />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Paginação" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '3rem' }}>
                {currentPage > 1 && (
                  <a href={currentPage === 2 ? '/pt-br/blog' : `/pt-br/blog?page=${currentPage - 1}`}
                    style={{ border: '2px solid #000', padding: '0.45rem 1rem', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', color: '#000', background: '#fff', boxShadow: '3px 3px 0 #000' }}>
                    ← Anterior
                  </a>
                )}
                <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                  {currentPage} / {totalPages}
                </span>
                {currentPage < totalPages && (
                  <a href={`/pt-br/blog?page=${currentPage + 1}`}
                    style={{ border: '2px solid #000', padding: '0.45rem 1rem', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', color: '#000', background: '#F4B13F', boxShadow: '3px 3px 0 #000' }}>
                    Próxima →
                  </a>
                )}
              </nav>
            )}
          </div>
        )}
      </main>

      <BlogFooter lang="pt-BR" />
    </>
  )
}

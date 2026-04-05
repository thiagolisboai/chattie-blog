import type { Metadata } from 'next'
import { getAllPostsPt } from '@/lib/posts-pt'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'
import { NewsletterCta } from '@/components/newsletter-cta'

export const metadata: Metadata = {
  title: 'Blog PT-BR | Chattie',
  description: 'Insights sobre social selling, LinkedIn B2B e IA para vendas — para founders e consultores brasileiros.',
  alternates: {
    canonical: 'https://trychattie.com/pt-br/blog',
    languages: { 'pt-BR': 'https://trychattie.com/pt-br/blog' },
  },
  openGraph: {
    title: 'Blog | Chattie',
    description: 'Insights sobre social selling, LinkedIn B2B e IA para vendas.',
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
        style={{
          background: `#FAFBF3 url('/brand/orange-gradient-bg.png') no-repeat top right / 45%`,
          borderBottom: '2px solid #000',
          padding: '5rem 1.5rem 4rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grain */}
        <div className="grain-overlay" />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p className="eyebrow" style={{ color: '#2F6451' }}>Blog PT-BR</p>
          <h1
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
              maxWidth: 700,
            }}
          >
            Social selling, LinkedIn B2B<br />e IA para vendas.
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, maxWidth: 520 }}>
            Para founders, consultores e operadores B2B que vendem pelo LinkedIn.
          </p>
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

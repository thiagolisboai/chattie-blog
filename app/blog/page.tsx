import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostsEn } from '@/lib/posts-en'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'
import { NewsletterCta } from '@/components/newsletter-cta'
import type { PostFrontmatter } from '@/lib/posts-pt'

export const metadata: Metadata = {
  title: 'Blog | Chattie',
  description: 'Insights on social selling, B2B LinkedIn and AI for sales — for founders and operators who sell on LinkedIn.',
  alternates: {
    canonical: 'https://trychattie.com/blog',
    languages: { en: 'https://trychattie.com/blog' },
  },
  openGraph: {
    title: 'Blog | Chattie',
    description: 'Insights on social selling, B2B LinkedIn and AI for sales.',
    url: 'https://trychattie.com/blog',
    locale: 'en_US',
    type: 'website',
  },
}

const POSTS_PER_PAGE = 12

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function BlogListEn({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))
  const allPosts = getAllPostsEn()
  const totalPages = Math.ceil(Math.max(0, allPosts.length - 1) / POSTS_PER_PAGE)
  const [featured] = allPosts
  const rest = allPosts.slice(1 + (currentPage - 1) * POSTS_PER_PAGE, 1 + currentPage * POSTS_PER_PAGE)

  return (
    <>
      <ScrollToTopButton />
      <BlogNav lang="en" />
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
        <div className="grain-overlay" />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p className="eyebrow" style={{ color: '#2F6451' }}>Blog EN</p>
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
            Social selling, B2B LinkedIn<br />and AI for sales.
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, maxWidth: 520, marginBottom: '1rem' }}>
            For founders, consultants and B2B operators who sell on LinkedIn.
          </p>
          <Link href="/pt-br/blog" style={{ fontSize: '0.875rem', color: '#2F6451', textDecoration: 'underline', fontWeight: 600 }}>
            🇧🇷 Ler em Português →
          </Link>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 1.5rem 5rem' }}>
        {allPosts.length === 0 ? (
          <div className="card-brutalist" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Coming soon.</p>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>The first English posts are on their way.</p>
            <Link
              href="/pt-br/blog"
              style={{ display: 'inline-block', border: '2px solid #000', padding: '0.5rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', background: '#F4B13F' }}
            >
              Read in Portuguese →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {featured && (
              <BlogCard post={featured as unknown as PostFrontmatter} basePath="/blog" featured lang="en" />
            )}
            {/* Newsletter */}
            <NewsletterCta lang="en" />
            {rest.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                <div style={{ flex: 1, height: 2, background: '#000' }} />
                <p className="eyebrow" style={{ marginBottom: 0 }}>All articles</p>
                <div style={{ flex: 1, height: 2, background: '#000' }} />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {rest.map((post, i) => (
                <div key={post.slug} style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                  <BlogCard post={post as unknown as PostFrontmatter} basePath="/blog" lang="en" />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '3rem' }}>
                {currentPage > 1 && (
                  <a href={currentPage === 2 ? '/blog' : `/blog?page=${currentPage - 1}`}
                    style={{ border: '2px solid #000', padding: '0.45rem 1rem', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', color: '#000', background: '#fff', boxShadow: '3px 3px 0 #000' }}>
                    ← Previous
                  </a>
                )}
                <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                  {currentPage} / {totalPages}
                </span>
                {currentPage < totalPages && (
                  <a href={`/blog?page=${currentPage + 1}`}
                    style={{ border: '2px solid #000', padding: '0.45rem 1rem', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', color: '#000', background: '#F4B13F', boxShadow: '3px 3px 0 #000' }}>
                    Next →
                  </a>
                )}
              </nav>
            )}
          </div>
        )}
      </main>

      <BlogFooter lang="en" />
    </>
  )
}

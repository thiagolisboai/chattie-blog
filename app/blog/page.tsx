import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostsEn } from '@/lib/posts-en'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'
import { NewsletterCta } from '@/components/newsletter-cta'
import { BlogHeroSymbols } from '@/components/blog-hero-symbols'
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
          background: `#FAFBF3 url('/brand/orange-gradient-bg.png') no-repeat top right / 50%`,
          borderBottom: '2px solid #000',
          padding: '4rem 1.5rem 3rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="grain-overlay" />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="eyebrow" style={{ color: '#2F6451' }}>Blog in English</p>
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
              LinkedIn B2B and social selling for people who actually sell.
            </h1>
            <p style={{ fontSize: '1rem', color: '#555', lineHeight: 1.75, maxWidth: 480, marginBottom: '1.75rem' }}>
              Practical insights on prospecting, AI for sales, and social selling —
              for B2B founders and consultants.
            </p>
            <Link
              href="/pt-br/blog"
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
              🇧🇷 Ler em Português
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

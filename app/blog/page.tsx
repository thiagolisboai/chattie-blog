import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostsEn } from '@/lib/posts-en'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'
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

export default function BlogListEn() {
  const posts = getAllPostsEn()
  const [featured, ...rest] = posts

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
        {posts.length === 0 ? (
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
          </div>
        )}
      </main>

      <BlogFooter lang="en" />
    </>
  )
}

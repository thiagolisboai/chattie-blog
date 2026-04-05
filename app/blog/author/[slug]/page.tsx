import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AUTHORS } from '@/lib/authors'
import { getAllPostsEn } from '@/lib/posts-en'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'
import type { PostFrontmatter } from '@/lib/posts-pt'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return Object.values(AUTHORS).map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const author = AUTHORS[slug]
  if (!author) return {}

  return {
    title: `${author.name} | Chattie Blog`,
    description: author.bio,
    alternates: {
      canonical: `https://trychattie.com/blog/author/${slug}`,
      languages: { 'pt-BR': `https://trychattie.com/pt-br/blog/autor/${slug}` },
    },
    openGraph: {
      title: `${author.name} | Chattie Blog`,
      description: author.bio,
      url: `https://trychattie.com/blog/author/${slug}`,
      images: [{ url: author.photo, width: 400, height: 400 }],
    },
  }
}

export default async function AuthorPageEn({ params }: Props) {
  const { slug } = await params
  const author = AUTHORS[slug]
  if (!author) notFound()

  const posts = getAllPostsEn().filter(
    (p) => (p.author || 'Thiago Lisboa').toLowerCase() === author.name.toLowerCase()
  )

  const [featuredPost, ...restPosts] = posts

  return (
    <>
      <BlogNav lang="en" />
      <RevealObserver />
      <ScrollToTopButton />

      {/* Author hero — dark treatment */}
      <div style={{ background: '#000', borderBottom: '4px solid #66BAC6', position: 'relative', overflow: 'hidden' }}>
        <div className="grain-overlay" style={{ opacity: 0.06 }} />

        <div aria-hidden="true" style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 320, height: 320,
          background: '#66BAC6',
          opacity: 0.1,
          clipPath: 'circle(50% at 100% 100%)',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 0', position: 'relative', zIndex: 1 }}>
          <Link
            href="/blog"
            style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(250,251,243,0.5)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem' }}
          >
            ← All articles
          </Link>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 3.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2.5rem', alignItems: 'center' }}>
            {/* Photo */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Image
                src={author.photo}
                alt={author.name}
                width={120}
                height={120}
                style={{
                  borderRadius: '50%',
                  border: '3px solid #66BAC6',
                  objectFit: 'cover',
                  display: 'block',
                  boxShadow: '6px 6px 0 #66BAC6',
                }}
              />
              <div style={{
                position: 'absolute', bottom: -6, right: -6,
                background: '#F4B13F',
                border: '2px solid #000',
                width: 36, height: 36,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Sherika', sans-serif",
                fontWeight: 900,
                fontSize: '0.75rem',
                color: '#000',
              }}>
                {posts.length}
              </div>
            </div>

            {/* Info */}
            <div>
              <p style={{
                fontFamily: "'Sherika', sans-serif",
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.13em',
                color: '#66BAC6',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ display: 'inline-block', width: 14, height: 2, background: 'currentColor' }} />
                Author
              </p>
              <h1 style={{
                fontFamily: "'Sherika', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.03em',
                marginBottom: '0.4rem',
                color: '#FAFBF3',
              }}>
                {author.name}
              </h1>
              <p style={{ fontSize: '0.9rem', color: '#66BAC6', fontWeight: 600, marginBottom: '1rem' }}>
                {author.role}
              </p>
              <p style={{ fontSize: '0.95rem', color: 'rgba(250,251,243,0.75)', lineHeight: 1.65, maxWidth: 520, marginBottom: '1.25rem' }}>
                {author.bio}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.82rem', fontWeight: 800,
                    border: '2px solid #E4C1F9',
                    padding: '0.4rem 1rem',
                    background: '#E4C1F9',
                    textDecoration: 'none',
                    color: '#000',
                    boxShadow: '3px 3px 0 #66BAC6',
                    fontFamily: "'Sherika', sans-serif",
                  }}
                >
                  LinkedIn →
                </a>
                <Link
                  href="/pt-br/blog/autor/thiago-lisboa"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.78rem', fontWeight: 700,
                    border: '1.5px solid rgba(250,251,243,0.2)',
                    padding: '0.4rem 0.9rem',
                    textDecoration: 'none',
                    color: 'rgba(250,251,243,0.6)',
                  }}
                >
                  🇧🇷 Ver em Português
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          padding: '0.85rem 1.5rem',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.35rem', color: '#F4B13F' }}>{posts.length}</span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(250,251,243,0.45)', marginLeft: '0.4rem' }}>articles published</span>
            </div>
            <div>
              <span style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.35rem', color: '#F4B13F' }}>
                {[...new Set(posts.flatMap((p) => p.tags || []))].length}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(250,251,243,0.45)', marginLeft: '0.4rem' }}>topics covered</span>
            </div>
            <div>
              <span style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.35rem', color: '#F4B13F' }}>
                {[...new Set(posts.map((p) => p.category))].length}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(250,251,243,0.45)', marginLeft: '0.4rem' }}>categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {posts.length === 0 ? (
          <div className="card-brutalist" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.25rem' }}>No articles yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {featuredPost && (
              <BlogCard post={featuredPost as unknown as PostFrontmatter} basePath="/blog" featured lang="en" />
            )}

            {restPosts.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                  <div style={{ flex: 1, height: 2, background: '#000' }} />
                  <p className="eyebrow" style={{ marginBottom: 0 }}>All articles</p>
                  <div style={{ flex: 1, height: 2, background: '#000' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {restPosts.map((post, i) => (
                    <div key={post.slug} className="reveal" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                      <BlogCard post={post as unknown as PostFrontmatter} basePath="/blog" lang="en" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <BlogFooter lang="en" />
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AUTHORS } from '@/lib/authors'
import { getAllPostsPt } from '@/lib/posts-pt'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'
import { AuthorPersonSchema } from '@/components/author-schema'

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
    title: `${author.name} | Blog Chattie`,
    description: author.bioPt,
    alternates: {
      canonical: `https://trychattie.com/pt-br/blog/autor/${slug}`,
      languages: { en: `https://trychattie.com/blog/author/${slug}` },
    },
    openGraph: {
      title: `${author.name} | Blog Chattie`,
      description: author.bioPt,
      url: `https://trychattie.com/pt-br/blog/autor/${slug}`,
      images: [{ url: author.photo, width: 400, height: 400 }],
    },
  }
}

export default async function AuthorPagePt({ params }: Props) {
  const { slug } = await params
  const author = AUTHORS[slug]
  if (!author) notFound()

  const posts = getAllPostsPt().filter(
    (p) => (p.author || 'Thiago Lisboa').toLowerCase() === author.name.toLowerCase()
  )

  const [featuredPost, ...restPosts] = posts

  return (
    <>
      <AuthorPersonSchema author={author} lang="pt-BR" />
      <BlogNav lang="pt-BR" />
      <RevealObserver />
      <ScrollToTopButton />

      {/* Author hero — dark treatment */}
      <div style={{ background: '#000', borderBottom: '4px solid #E57B33', position: 'relative', overflow: 'hidden' }}>
        <div className="grain-overlay" style={{ opacity: 0.06 }} />

        {/* Decorative geometric accent */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 320, height: 320,
          background: '#2F6451',
          opacity: 0.12,
          clipPath: 'circle(50% at 100% 100%)',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 0', position: 'relative', zIndex: 1 }}>
          <Link
            href="/pt-br/blog"
            style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(250,251,243,0.5)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem' }}
          >
            ← Todos os artigos
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
                  border: '3px solid #E57B33',
                  objectFit: 'cover',
                  display: 'block',
                  boxShadow: '6px 6px 0 #E57B33',
                }}
              />
              {/* Post count badge */}
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
                Autor
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
                {author.rolePt}
              </p>
              <p style={{ fontSize: '0.95rem', color: 'rgba(250,251,243,0.75)', lineHeight: 1.65, maxWidth: 520, marginBottom: '1.25rem' }}>
                {author.bioPt}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ga-cta="author-linkedin-pt"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.82rem', fontWeight: 800,
                    border: '2px solid #E4C1F9',
                    padding: '0.4rem 1rem',
                    background: '#E4C1F9',
                    textDecoration: 'none',
                    color: '#000',
                    boxShadow: '3px 3px 0 #E57B33',
                    fontFamily: "'Sherika', sans-serif",
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                >
                  LinkedIn →
                </a>
                <Link
                  href="/blog/author/thiago-lisboa"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.78rem', fontWeight: 700,
                    border: '1.5px solid rgba(250,251,243,0.2)',
                    padding: '0.4rem 0.9rem',
                    textDecoration: 'none',
                    color: 'rgba(250,251,243,0.6)',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  🇺🇸 View in English
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
              <span style={{ fontSize: '0.78rem', color: 'rgba(250,251,243,0.45)', marginLeft: '0.4rem' }}>artigos publicados</span>
            </div>
            <div>
              <span style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.35rem', color: '#F4B13F' }}>
                {[...new Set(posts.flatMap((p) => p.tags || []))].length}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(250,251,243,0.45)', marginLeft: '0.4rem' }}>tópicos cobertos</span>
            </div>
            <div>
              <span style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.35rem', color: '#F4B13F' }}>
                {[...new Set(posts.map((p) => p.category))].length}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(250,251,243,0.45)', marginLeft: '0.4rem' }}>categorias</span>
            </div>
          </div>
        </div>
      </div>

      {/* EEAT: Bio expandida + áreas de expertise + credenciais */}
      <div style={{ background: '#FAFBF3', borderBottom: '2px solid #000' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '3rem', alignItems: 'start' }}>

          {/* Left: expanded bio + expertise tags */}
          <div>
            <p style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              color: '#2F6451',
              marginBottom: '0.85rem',
            }}>
              Sobre o autor
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', marginBottom: '1.75rem', maxWidth: 580 }}>
              {author.bioExpandedPt}
            </p>

            {/* Expertise tags */}
            <p style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 700,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#2F6451',
              marginBottom: '0.6rem',
            }}>
              Áreas de expertise
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {author.expertiseAreasPt.map((area) => (
                <span
                  key={area}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: '#000',
                    color: '#FAFBF3',
                    padding: '0.3rem 0.7rem',
                    border: '2px solid #000',
                    fontFamily: "'Sherika', sans-serif",
                  }}
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Right: credentials card */}
          <div style={{
            minWidth: 260,
            background: '#fff',
            border: '2px solid #000',
            boxShadow: '4px 4px 0 #000',
            padding: '1.5rem',
            flexShrink: 0,
          }}>
            <p style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '1.1rem',
              color: '#000',
            }}>
              Credenciais
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {author.credentials.map((c) => (
                <li key={c.title} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#E57B33', fontWeight: 900, flexShrink: 0, marginTop: '0.1em', fontSize: '1rem' }}>→</span>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.85rem',
                        color: '#000',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        textDecorationColor: '#E57B33',
                        textUnderlineOffset: '3px',
                        lineHeight: 1.5,
                      }}
                    >
                      {c.titlePt || c.title}
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#000', fontWeight: 600, lineHeight: 1.5 }}>
                      {c.titlePt || c.title}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Posts */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {posts.length === 0 ? (
          <div className="card-brutalist" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.25rem' }}>Nenhum artigo ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Featured most recent post */}
            {featuredPost && (
              <BlogCard post={featuredPost} basePath="/pt-br/blog" featured lang="pt-BR" />
            )}

            {restPosts.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                  <div style={{ flex: 1, height: 2, background: '#000' }} />
                  <p className="eyebrow" style={{ marginBottom: 0 }}>Todos os artigos</p>
                  <div style={{ flex: 1, height: 2, background: '#000' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {restPosts.map((post, i) => (
                    <div key={post.slug} className="reveal" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                      <BlogCard post={post} basePath="/pt-br/blog" lang="pt-BR" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <BlogFooter lang="pt-BR" />
    </>
  )
}

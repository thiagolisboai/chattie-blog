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

  return (
    <>
      <BlogNav lang="pt-BR" />
      <RevealObserver />
      <ScrollToTopButton />

      {/* Author hero */}
      <div style={{ background: '#FAFBF3', borderBottom: '2px solid #000', padding: '4rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Link href="/pt-br/blog" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2F6451', textDecoration: 'none' }}>
              ← Todos os artigos
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <Image
              src={author.photo}
              alt={author.name}
              width={100}
              height={100}
              style={{ borderRadius: '50%', border: '3px solid #000', objectFit: 'cover', flexShrink: 0, boxShadow: '4px 4px 0 #000' }}
            />
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2F6451', marginBottom: '0.4rem' }}>
                Autor
              </p>
              <h1 style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
                {author.name}
              </h1>
              <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.75rem' }}>{author.rolePt}</p>
              <p style={{ fontSize: '0.95rem', color: '#333', lineHeight: 1.65, maxWidth: 540 }}>{author.bioPt}</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, border: '2px solid #000', padding: '0.35rem 0.9rem', background: '#E4C1F9', textDecoration: 'none', color: '#000', boxShadow: '2px 2px 0 #000' }}
                >
                  LinkedIn →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '2rem' }}>
          {posts.length} {posts.length === 1 ? 'artigo publicado' : 'artigos publicados'}
        </p>
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

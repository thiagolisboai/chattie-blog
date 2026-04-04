import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllSlugsPt, getPostBySlugPt, getAllPostsPt } from '@/lib/posts-pt'
import { getMdxComponents } from '@/components/mdx-components'
import { ArticleJsonLd } from '@/components/json-ld'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { ReadingProgressBar, ScrollToTopButton } from '@/components/post-ui'
import { RelatedPosts } from '@/components/related-posts'
import { getAuthor } from '@/lib/authors'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugsPt().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlugPt(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: post.canonicalUrl,
      languages: {
        'pt-BR': post.canonicalUrl,
        ...(post.enSlug
          ? { en: `https://trychattie.com/blog/${post.enSlug}` }
          : {}),
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: post.canonicalUrl,
      locale: 'pt_BR',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author || 'Thiago Lisboa'],
      tags: post.tags,
      images: [{ url: post.image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  }
}

export default async function BlogPostPt({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlugPt(slug)
  if (!post) notFound()

  const author = getAuthor(post.author || 'Thiago Lisboa')
  const allPosts = getAllPostsPt()

  return (
    <>
      <ReadingProgressBar />
      <ScrollToTopButton />
      <ArticleJsonLd post={post} lang="pt-BR" />
      <BlogNav lang="pt-BR" />

      <main id="main-content" style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {/* Back */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/pt-br/blog"
            style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2F6451', textDecoration: 'none' }}
            className="hover:text-rust"
          >
            ← Voltar ao blog
          </Link>
        </div>

        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                background: '#2F6451',
                color: '#FAFBF3',
                padding: '0.2rem 0.6rem',
              }}
            >
              {post.category}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#888' }}>{post.readTime}</span>
            <time style={{ fontSize: '0.78rem', color: '#888' }}>
              {new Date(post.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>

          <h1
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            {post.title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: 1.65 }}>{post.description}</p>

          {post.image && (
            <div
              style={{
                marginTop: '1.75rem',
                border: '2px solid #000',
                boxShadow: '4px 4px 0 #000',
                overflow: 'hidden',
              }}
            >
              <img src={post.image} alt={post.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
        </header>

        {/* Article */}
        <article className="prose">
          <MDXRemote source={post.content} components={getMdxComponents()} />
        </article>

        {/* Footer */}
        <footer style={{ marginTop: '4rem', borderTop: '2px solid #000', paddingTop: '2rem' }}>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            {post.tags?.map((tag) => (
              <span key={tag} style={{ fontSize: '0.8rem', border: '1px solid #000', padding: '0.2rem 0.6rem' }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Author card */}
          {author && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.25rem',
                border: '2px solid #000',
                boxShadow: '4px 4px 0 rgba(47,100,81,0.3)',
                padding: '1.5rem',
                marginBottom: '2rem',
                background: '#FAFBF3',
              }}
            >
              <img
                src={author.photo}
                alt={author.name}
                style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid #000', objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 800, fontSize: '1rem', marginBottom: '0.15rem' }}>{author.name}</p>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.6rem' }}>{author.rolePt}</p>
                <p style={{ fontSize: '0.875rem', color: '#444', lineHeight: 1.6 }}>{author.bioPt}</p>
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '0.6rem', fontSize: '0.78rem', fontWeight: 700, color: '#2F6451', textDecoration: 'none' }}
                >
                  LinkedIn →
                </a>
              </div>
            </div>
          )}

          {/* Related posts */}
          <RelatedPosts
            currentSlug={post.slug}
            currentCategory={post.category}
            currentTags={post.tags || []}
            allPosts={allPosts}
            basePath="/pt-br/blog"
            lang="pt-BR"
          />

          {/* CTA */}
          <div
            className="card-brutalist"
            style={{ background: '#E57B33', color: '#FAFBF3', padding: '2rem', marginTop: '2rem' }}
          >
            <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              Quer vender mais pelo LinkedIn?
            </p>
            <p style={{ marginBottom: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
              O Chattie é o AI SDR que prospecta, qualifica e engaja seus leads no LinkedIn — no piloto automático.
            </p>
            <a
              href="https://trychattie.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta-post"
            >
              Conhecer o Chattie →
            </a>
          </div>
        </footer>
      </main>

      <BlogFooter lang="pt-BR" />
    </>
  )
}

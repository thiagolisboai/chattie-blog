import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllSlugsPt, getPostBySlugPt, getAllPostsPt } from '@/lib/posts-pt'
import { getMdxComponents } from '@/components/mdx-components'
import Image from 'next/image'
import { ArticleJsonLd } from '@/components/json-ld'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { ShareButtons } from '@/components/share-buttons'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { ReadingProgressBar, ScrollToTopButton } from '@/components/post-ui'
import { RelatedPosts } from '@/components/related-posts'
import { TableOfContents } from '@/components/table-of-contents'
import { NewsletterCta } from '@/components/newsletter-cta'
import { CtaButton } from '@/components/cta-button'
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
          ? {
              en: `https://trychattie.com/blog/${post.enSlug}`,
              'x-default': `https://trychattie.com/blog/${post.enSlug}`,
            }
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
      <ReadingProgressBar slug={post.slug} lang="pt-BR" />
      <ScrollToTopButton />
      <ArticleJsonLd post={{ ...post, slug: post.slug }} lang="pt-BR" />
      <BreadcrumbSchema items={[
        { name: 'Blog', url: 'https://trychattie.com/pt-br/blog' },
        { name: post.category, url: `https://trychattie.com/pt-br/blog/categoria/${post.category}` },
        { name: post.title, url: post.canonicalUrl },
      ]} />
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
          {post.series && (
            <div style={{ marginBottom: '0.75rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#2F6451',
                  border: '1.5px solid #2F6451',
                  padding: '0.2rem 0.6rem',
                  fontFamily: "'Sherika', sans-serif",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2F6451', flexShrink: 0 }} />
                {post.series}{post.seriesNumber ? ` #${post.seriesNumber}` : ''}
              </span>
            </div>
          )}
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
                position: 'relative',
                aspectRatio: '16/9',
              }}
            >
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 760px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
        </header>

        {/* Content + TOC sidebar layout */}
        <div className="post-layout">
          {/* Main content column */}
          <div>
            {/* Inline TOC (visible on mobile/tablet, hidden on desktop) */}
            <div className="post-toc-inline">
              <TableOfContents />
            </div>

            {/* Article */}
            <article className="prose">
              <MDXRemote source={post.content} components={getMdxComponents()} />
            </article>
          </div>

          {/* Sticky TOC sidebar (desktop only) */}
          <aside className="post-toc-sidebar" aria-label="Índice do artigo">
            <TableOfContents compact />
          </aside>
        </div>

        {/* Share */}
        <ShareButtons url={post.canonicalUrl} title={post.title} lang="pt-BR" />

        {/* Footer */}
        <footer style={{ marginTop: '4rem', borderTop: '2px solid #000', paddingTop: '2rem' }}>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            {post.tags?.map((tag) => (
              <Link key={tag} href={`/pt-br/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.8rem', border: '1px solid #000', padding: '0.2rem 0.6rem', textDecoration: 'none', color: '#000', transition: 'background 0.15s' }} className="hover:bg-lavender">
                #{tag}
              </Link>
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
              <Image
                src={author.photo}
                alt={author.name}
                width={72}
                height={72}
                style={{ borderRadius: '50%', border: '2px solid #000', objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <Link href={`/pt-br/blog/autor/${author.slug}`} style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 800, fontSize: '1rem', marginBottom: '0.15rem', display: 'block', textDecoration: 'none', color: '#000' }} className="hover:text-teal">{author.name}</Link>
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

          {/* Newsletter */}
          <NewsletterCta lang="pt-BR" />

          {/* Related posts */}
          <RelatedPosts
            currentSlug={post.slug}
            currentCategory={post.category}
            currentTags={post.tags || []}
            allPosts={allPosts}
            basePath="/pt-br/blog"
            lang="pt-BR"
          />

          {/* CTA — contextual by category */}
          {(() => {
            const ctaCopy: Record<string, { heading: string; body: string; btn: string }> = {
              'social-selling': {
                heading: 'Pronto para fazer social selling com consistência?',
                body: 'O Chattie organiza suas conversas no LinkedIn para que nenhum lead quente fique sem follow-up — no timing certo, com o contexto certo.',
                btn: 'Conhecer o Chattie',
              },
              'linkedin': {
                heading: 'Sua prospecção no LinkedIn merece um sistema.',
                body: 'O Chattie registra o contexto de cada conversa e sinaliza o momento certo para o follow-up — sem perder o fio da meada.',
                btn: 'Conhecer o Chattie',
              },
              'comparativos': {
                heading: 'Já que você está comparando, experimente na prática.',
                body: 'Teste o Chattie gratuitamente. Sem cartão de crédito — conecte sua conta do LinkedIn e veja a diferença.',
                btn: 'Testar o Chattie',
              },
              'chattie': {
                heading: 'Pronto para ter o mesmo resultado?',
                body: 'Comece a usar o Chattie hoje e organize sua prospecção no LinkedIn sem a complexidade de um CRM.',
                btn: 'Testar o Chattie',
              },
              'ia-para-vendas': {
                heading: 'IA que realmente funciona para vendas no LinkedIn.',
                body: 'O Chattie aplica IA onde ela importa: no contexto de cada conversa, no timing do follow-up e na priorização de quem está quente.',
                btn: 'Conhecer o Chattie',
              },
              'b2b': {
                heading: 'Quer fechar mais negócios no LinkedIn?',
                body: 'O Chattie é o AI SDR que prospecta, qualifica e engaja seus leads no LinkedIn — com contexto real, não automação genérica.',
                btn: 'Conhecer o Chattie',
              },
            }
            const cta = ctaCopy[post.category] ?? {
              heading: 'Quer vender mais pelo LinkedIn?',
              body: 'O Chattie é o AI SDR que prospecta, qualifica e engaja seus leads no LinkedIn — no piloto automático.',
              btn: 'Conhecer o Chattie',
            }
            return (
              <div
                className="card-brutalist"
                style={{ background: '#E57B33', color: '#FAFBF3', padding: '2rem', marginTop: '2rem' }}
              >
                <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                  {cta.heading}
                </p>
                <p style={{ marginBottom: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
                  {cta.body}
                </p>
                <CtaButton
                  href="https://trychattie.com"
                  label={cta.btn}
                  gaLabel={`post_cta_pt_${post.slug}`}
                >
                  {cta.btn} →
                </CtaButton>
              </div>
            )
          })()}
        </footer>
      </main>

      <BlogFooter lang="pt-BR" />
    </>
  )
}

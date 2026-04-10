import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { getAllSlugsEn, getPostBySlugEn, getAllPostsEn } from '@/lib/posts-en'
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
import type { PostFrontmatter } from '@/lib/posts-pt'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugsEn().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlugEn(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: post.canonicalUrl,
      languages: {
        en: post.canonicalUrl,
        'x-default': post.canonicalUrl,
        ...(post.ptSlug
          ? { 'pt-BR': `https://trychattie.com/pt-br/blog/${post.ptSlug}` }
          : {}),
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: post.canonicalUrl,
      locale: 'en_US',
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

export default async function BlogPostEn({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlugEn(slug)
  if (!post) notFound()

  const author = getAuthor(post.author || 'Thiago Lisboa')
  const allPosts = getAllPostsEn()

  return (
    <>
      <ReadingProgressBar slug={post.slug} lang="en" />
      <ScrollToTopButton />
      <ArticleJsonLd post={{ ...post, slug: post.slug }} lang="en" postContent={post.content} />
      <BreadcrumbSchema items={[
        { name: 'Blog', url: 'https://trychattie.com/blog' },
        { name: post.category, url: `https://trychattie.com/blog/category/${post.category}` },
        { name: post.title, url: post.canonicalUrl },
      ]} />
      <BlogNav lang="en" />

      <main id="main-content" style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {/* Back */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/blog"
            style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2F6451', textDecoration: 'none' }}
            className="hover:text-rust"
          >
            ← Back to blog
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
                background: '#66BAC6',
                color: '#000',
                padding: '0.2rem 0.6rem',
              }}
            >
              {post.category}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#888' }}>{post.readTime}</span>
            <time style={{ fontSize: '0.78rem', color: '#888' }}>
              {new Date(post.date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>

          {post.ptSlug && (
            <div style={{ marginBottom: '1rem' }}>
              <Link href={`/pt-br/blog/${post.ptSlug}`} style={{ fontSize: '0.85rem', color: '#2F6451', fontWeight: 600, textDecoration: 'underline' }}>
                🇧🇷 Ler em Português →
              </Link>
            </div>
          )}

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
              <MDXRemote source={post.content} components={getMdxComponents()} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
            </article>
          </div>

          {/* Sticky TOC sidebar (desktop only) */}
          <aside className="post-toc-sidebar" aria-label="Table of contents">
            <TableOfContents compact />
          </aside>
        </div>

        {/* Share */}
        <ShareButtons url={post.canonicalUrl} title={post.title} lang="en" />

        {/* Footer */}
        <footer style={{ marginTop: '4rem', borderTop: '2px solid #000', paddingTop: '2rem' }}>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '2.5rem' }}>
            {post.tags?.map((tag) => (
              <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`} className="tag-pill">
                #{tag}
              </Link>
            ))}
          </div>

          {/* Author card */}
          {author && (
            <div className="author-card">
              <div className="author-card-accent" />
              <div style={{ padding: '1.5rem 0', flexShrink: 0 }}>
                <Link href={`/blog/author/${author.slug}`} style={{ display: 'block' }}>
                  <Image
                    src={author.photo}
                    alt={author.name}
                    width={72}
                    height={72}
                    style={{ borderRadius: '50%', border: '2px solid #000', objectFit: 'cover', display: 'block' }}
                  />
                </Link>
              </div>
              <div className="author-card-body">
                <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2F6451', marginBottom: '0.35rem' }}>
                  About the author
                </p>
                <Link href={`/blog/author/${author.slug}`} style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.05rem', marginBottom: '0.15rem', display: 'block', textDecoration: 'none', color: '#000', letterSpacing: '-0.01em' }} className="hover:text-teal">
                  {author.name}
                </Link>
                <p style={{ fontSize: '0.78rem', color: '#2F6451', fontWeight: 600, marginBottom: '0.6rem' }}>{author.role}</p>
                <p style={{ fontSize: '0.875rem', color: '#444', lineHeight: 1.65, margin: 0 }}>{author.bio}</p>
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: 700,
                    color: '#FAFBF3', background: '#2F6451', border: '1.5px solid #000',
                    padding: '0.3rem 0.7rem', textDecoration: 'none', boxShadow: '2px 2px 0 #000',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                >
                  LinkedIn →
                </a>
              </div>
            </div>
          )}

          {/* Newsletter */}
          <NewsletterCta lang="en" />

          {/* Related posts */}
          <RelatedPosts
            currentSlug={post.slug}
            currentCategory={post.category}
            currentTags={post.tags || []}
            allPosts={allPosts as unknown as PostFrontmatter[]}
            basePath="/blog"
            lang="en"
          />

          {/* CTA — contextual by category */}
          {(() => {
            const ctaCopy: Record<string, { heading: string; body: string; btn: string }> = {
              'social-selling': {
                heading: 'Ready to do social selling consistently?',
                body: 'Chattie keeps your LinkedIn conversations organized so no warm lead goes without a timely, contextual follow-up.',
                btn: 'Try Chattie',
              },
              'linkedin': {
                heading: 'Your LinkedIn prospecting deserves a system.',
                body: 'Chattie tracks every conversation context and signals the right time to follow up — without losing the thread.',
                btn: 'Try Chattie',
              },
              'comparativos': {
                heading: "Since you're comparing, try it hands-on.",
                body: 'Test Chattie free. No credit card — connect your LinkedIn account and see the difference.',
                btn: 'Try Chattie',
              },
              'chattie': {
                heading: 'Ready to get the same results?',
                body: 'Start using Chattie today and organize your LinkedIn prospecting without CRM complexity.',
                btn: 'Try Chattie',
              },
              'ia-para-vendas': {
                heading: 'AI that actually works for LinkedIn sales.',
                body: 'Chattie applies AI where it matters: conversation context, follow-up timing, and prioritizing who is warm right now.',
                btn: 'Try Chattie',
              },
            }
            const cta = ctaCopy[post.category] ?? {
              heading: 'Want to sell more on LinkedIn?',
              body: 'Chattie is the AI SDR that prospects, qualifies and engages your LinkedIn leads — on autopilot.',
              btn: 'Try Chattie',
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
                  gaLabel={`post_cta_en_${post.slug}`}
                >
                  {cta.btn} →
                </CtaButton>
              </div>
            )
          })()}
        </footer>
      </main>

      <BlogFooter lang="en" />
    </>
  )
}

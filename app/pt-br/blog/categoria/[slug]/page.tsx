import type { Metadata } from 'next'
import { getAllPostsPt } from '@/lib/posts-pt'
import { BlogCard } from '@/components/blog-card'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { RevealObserver } from '@/components/reveal-observer'
import { ScrollToTopButton } from '@/components/post-ui'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  'linkedin':       'LinkedIn',
  'social-selling': 'Social Selling',
  'chattie':        'Chattie',
  'b2b':            'B2B',
  'ia-para-vendas': 'IA para Vendas',
  'prospecting':    'Prospecção',
  'comparativos':   'Comparativos',
}

const CATEGORY_COLORS: Record<string, { accent: string; text: string; badge: string; badgeText: string }> = {
  'social-selling': { accent: '#2F6451', text: '#2F6451', badge: '#2F6451', badgeText: '#FAFBF3' },
  'linkedin':       { accent: '#66BAC6', text: '#1a6f7d', badge: '#66BAC6', badgeText: '#000' },
  'chattie':        { accent: '#E57B33', text: '#c05e1a', badge: '#E57B33', badgeText: '#FAFBF3' },
  'b2b':            { accent: '#E4C1F9', text: '#7b3fa0', badge: '#E4C1F9', badgeText: '#000' },
  'ia-para-vendas': { accent: '#F4B13F', text: '#a07010', badge: '#F4B13F', badgeText: '#000' },
  'comparativos':   { accent: '#000', text: '#000', badge: '#000', badgeText: '#FAFBF3' },
}

const DEFAULT_COLOR = { accent: '#2F6451', text: '#2F6451', badge: '#2F6451', badgeText: '#FAFBF3' }

export async function generateStaticParams() {
  const posts = getAllPostsPt()
  const cats = [...new Set(posts.map((p) => p.category))]
  return cats.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const label = CATEGORY_LABELS[slug] || slug
  return {
    title: `${label} | Blog Chattie`,
    description: `Artigos sobre ${label} para founders e consultores B2B que vendem pelo LinkedIn.`,
    alternates: { canonical: `https://trychattie.com/pt-br/blog/categoria/${slug}` },
  }
}

export default async function CategoryPagePt({ params }: Props) {
  const { slug } = await params
  const all = getAllPostsPt()
  const posts = all.filter((p) => p.category === slug)
  const label = CATEGORY_LABELS[slug] || slug
  const colors = CATEGORY_COLORS[slug] || DEFAULT_COLOR
  const [featured, ...rest] = posts

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Blog', url: 'https://trychattie.com/pt-br/blog' },
        { name: label, url: `https://trychattie.com/pt-br/blog/categoria/${slug}` },
      ]} />
      <BlogNav lang="pt-BR" />
      <RevealObserver />
      <ScrollToTopButton />

      {/* Hero */}
      <div
        style={{
          background: '#FAFBF3',
          borderBottom: '2px solid #000',
          padding: '4.5rem 1.5rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="grain-overlay" />
        {/* Category color stripe — top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: colors.accent }} />
        {/* Decorative corner block */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, right: 0,
          width: 200, height: 200,
          background: colors.accent,
          opacity: 0.07,
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link
            href="/pt-br/blog"
            style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2F6451', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}
          >
            ← Todos os artigos
          </Link>

          <p style={{
            fontFamily: "'Sherika', sans-serif",
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.13em',
            color: colors.text,
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ display: 'inline-block', width: 14, height: 2, background: 'currentColor' }} />
            Categoria
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{
              background: colors.badge,
              color: colors.badgeText,
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 800,
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.3rem 0.85rem',
              border: '2px solid #000',
            }}>
              {label}
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Sherika', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}>
            {label}
          </h1>

          <span style={{
            background: '#000',
            color: '#FAFBF3',
            fontFamily: "'Sherika', sans-serif",
            fontWeight: 800,
            fontSize: '0.75rem',
            padding: '0.25rem 0.75rem',
            letterSpacing: '0.05em',
          }}>
            {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}
          </span>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {posts.length === 0 ? (
          <div className="card-brutalist" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Nenhum artigo ainda.
            </p>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Em breve teremos conteúdo nesta categoria.</p>
            <Link href="/pt-br/blog" style={{ display: 'inline-block', border: '2px solid #000', padding: '0.5rem 1.5rem', fontWeight: 700, background: '#F4B13F' }}>
              Ver todos os artigos →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Featured first post */}
            {featured && (
              <BlogCard post={featured} basePath="/pt-br/blog" featured lang="pt-BR" />
            )}

            {/* Divider */}
            {rest.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                <div style={{ flex: 1, height: 2, background: '#000' }} />
                <p className="eyebrow" style={{ marginBottom: 0, color: colors.text }}>Mais artigos</p>
                <div style={{ flex: 1, height: 2, background: '#000' }} />
              </div>
            )}

            {/* Rest grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {rest.map((post, i) => (
                <div key={post.slug} className="reveal" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                  <BlogCard post={post} basePath="/pt-br/blog" lang="pt-BR" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BlogFooter lang="pt-BR" />
    </>
  )
}

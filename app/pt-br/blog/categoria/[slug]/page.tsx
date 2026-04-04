import type { Metadata } from 'next'
import { getAllPostsPt } from '@/lib/posts-pt'
import { BlogCard } from '@/components/blog-card'
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
}

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

  return (
    <>
      <BlogNav lang="pt-BR" />
      <RevealObserver />
      <ScrollToTopButton />

      {/* Header */}
      <div style={{
        background: '#FAFBF3',
        borderBottom: '2px solid #000',
        padding: '4rem 1.5rem 3rem',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Link href="/pt-br/blog" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2F6451', textDecoration: 'none' }}>
              ← Todos os artigos
            </Link>
          </div>
          <p className="eyebrow" style={{ color: '#2F6451' }}>Categoria</p>
          <h1 style={{
            fontFamily: "'Sherika', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '0.75rem',
          }}>
            {label}
          </h1>
          <p style={{ fontSize: '1rem', color: '#555' }}>
            {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'} nesta categoria
          </p>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {posts.map((post, i) => (
              <div key={post.slug} className="reveal" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                <BlogCard post={post} basePath="/pt-br/blog" lang="pt-BR" />
              </div>
            ))}
          </div>
        )}
      </main>

      <BlogFooter lang="pt-BR" />
    </>
  )
}

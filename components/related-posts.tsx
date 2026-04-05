import Link from 'next/link'
import Image from 'next/image'
import type { PostFrontmatter } from '@/lib/posts-pt'

interface RelatedPostsProps {
  currentSlug: string
  currentCategory: string
  currentTags: string[]
  allPosts: PostFrontmatter[]
  basePath: string
  lang?: 'pt-BR' | 'en'
}

function score(post: PostFrontmatter, category: string, tags: string[]): number {
  let s = 0
  if (post.category === category) s += 3
  const shared = (post.tags || []).filter((t) => tags.includes(t)).length
  s += shared
  return s
}

const catColors: Record<string, { bg: string; color: string }> = {
  'social-selling': { bg: '#2F6451', color: '#FAFBF3' },
  'linkedin':       { bg: '#66BAC6', color: '#000' },
  'chattie':        { bg: '#E57B33', color: '#FAFBF3' },
  'b2b':            { bg: '#E4C1F9', color: '#000' },
  'ia-para-vendas': { bg: '#F4B13F', color: '#000' },
  'ai-for-sales':   { bg: '#F4B13F', color: '#000' },
  'comparativos':   { bg: '#000', color: '#FAFBF3' },
  'comparisons':    { bg: '#000', color: '#FAFBF3' },
}

export function RelatedPosts({ currentSlug, currentCategory, currentTags, allPosts, basePath, lang = 'pt-BR' }: RelatedPostsProps) {
  const isPtBr = lang === 'pt-BR'

  const related = allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({ post: p, score: score(p, currentCategory, currentTags) }))
    .filter(({ score: s }) => s > 0)
    .sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime())
    .slice(0, 3)
    .map(({ post }) => post)

  if (related.length === 0) return null

  return (
    <section style={{ marginTop: '4rem' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, height: 2, background: '#000' }} />
        <p style={{
          fontFamily: "'Sherika', sans-serif",
          fontWeight: 800,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.13em',
          color: '#666',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0,
        }}>
          <span style={{ display: 'inline-block', width: 18, height: 2, background: 'currentColor' }} />
          {isPtBr ? 'Continue lendo' : 'Continue reading'}
        </p>
        <div style={{ flex: 1, height: 2, background: '#000' }} />
      </div>

      {/* Horizontal card list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {related.map((post, i) => {
          const cat = catColors[post.category] || { bg: '#B7C3B0', color: '#000' }
          return (
            <Link
              key={post.slug}
              href={`${basePath}/${post.slug}`}
              className="related-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Thumbnail */}
              {post.image ? (
                <div className="related-card-img">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="96px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  className="related-card-img"
                  style={{ background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>✦</span>
                </div>
              )}

              {/* Content */}
              <div className="related-card-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    background: cat.bg,
                    color: cat.color,
                    padding: '0.1rem 0.35rem',
                    flexShrink: 0,
                  }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#999', flexShrink: 0 }}>{post.readTime}</span>
                </div>
                <p className="related-card-title">{post.title}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

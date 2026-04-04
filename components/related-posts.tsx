import Link from 'next/link'
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

  const catColors: Record<string, { bg: string; color: string }> = {
    'linkedin':       { bg: '#2F6451', color: '#FAFBF3' },
    'social-selling': { bg: '#66BAC6', color: '#000' },
    'chattie':        { bg: '#E57B33', color: '#FAFBF3' },
    'b2b':            { bg: '#E4C1F9', color: '#000' },
    'ia-para-vendas': { bg: '#F4B13F', color: '#000' },
    'ai-for-sales':   { bg: '#F4B13F', color: '#000' },
  }

  return (
    <section style={{ marginTop: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
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
        }}>
          <span style={{ display: 'inline-block', width: 18, height: 2, background: 'currentColor' }} />
          {isPtBr ? 'Continue lendo' : 'Continue reading'}
        </p>
        <div style={{ flex: 1, height: 2, background: '#000' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {related.map((post) => {
          const cat = catColors[post.category] || { bg: '#B7C3B0', color: '#000' }
          return (
            <Link key={post.slug} href={`${basePath}/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }} className="group">
              <article
                className="card-brutalist"
                style={{ background: '#fff', height: '100%', overflow: 'hidden' }}
              >
                {post.image && (
                  <div style={{ overflow: 'hidden', borderBottom: '2px solid #000', aspectRatio: '16/9' }}>
                    <img
                      src={post.image}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                        display: 'block',
                      }}
                      className="group-hover:scale-105"
                    />
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      background: cat.bg,
                      color: cat.color,
                      padding: '0.15rem 0.4rem',
                    }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{post.readTime}</span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Sherika', sans-serif",
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      color: '#000',
                      transition: 'color 0.15s',
                      margin: 0,
                    }}
                    className="group-hover:text-teal"
                  >
                    {post.title}
                  </h3>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

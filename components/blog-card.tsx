import Link from 'next/link'
import type { PostFrontmatter } from '@/lib/posts-pt'

interface BlogCardProps {
  post: PostFrontmatter
  basePath?: string
  featured?: boolean
  lang?: 'pt-BR' | 'en'
}

const categoryColors: Record<string, { bg: string; color: string }> = {
  'social-selling':    { bg: '#2F6451', color: '#FAFBF3' },
  'linkedin':          { bg: '#66BAC6', color: '#000' },
  'b2b':               { bg: '#E4C1F9', color: '#000' },
  'ia-para-vendas':    { bg: '#F4B13F', color: '#000' },
  'chattie':           { bg: '#E57B33', color: '#FAFBF3' },
  'ai-for-sales':      { bg: '#F4B13F', color: '#000' },
  'prospecting':       { bg: '#2F6451', color: '#FAFBF3' },
}

export function BlogCard({ post, basePath = '/pt-br/blog', featured = false, lang = 'pt-BR' }: BlogCardProps) {
  const catStyle = categoryColors[post.category] || { bg: '#B7C3B0', color: '#000' }
  const dateLocale = lang === 'pt-BR' ? 'pt-BR' : 'en-US'

  if (featured) {
    return (
      <Link href={`${basePath}/${post.slug}`} className="block group col-span-full">
        <article
          className="card-brutalist bg-white overflow-hidden"
          style={{ display: 'grid', gridTemplateColumns: '55% 45%' }}
        >
          {post.image && (
            <div className="card-img-wrap" style={{ borderRight: '2px solid #000', borderBottom: 'none', aspectRatio: '16/9' }}>
              <img
                src={post.image}
                alt={post.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}
                className="group-hover:scale-105"
              />
            </div>
          )}
          <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span
                style={{ background: catStyle.bg, color: catStyle.color, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                {post.category}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#777' }}>{post.readTime}</span>
              <time style={{ fontSize: '0.75rem', color: '#777' }}>
                {new Date(post.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })}
              </time>
            </div>
            <h2
              style={{
                fontFamily: "'Sherika', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                transition: 'color 0.15s',
              }}
              className="group-hover:text-teal"
            >
              {post.title}
            </h2>
            <p style={{ fontSize: '1rem', color: '#4a4a4a', lineHeight: 1.6 }}>
              {post.excerpt || post.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
              {post.tags?.slice(0, 4).map((tag) => (
                <span key={tag} style={{ fontSize: '0.75rem', border: '1px solid #000', padding: '0.15rem 0.5rem' }}>
                  #{tag}
                </span>
              ))}
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#E57B33',
                marginTop: '0.25rem',
              }}
            >
              {lang === 'pt-BR' ? 'Ler artigo' : 'Read article'} →
            </span>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`${basePath}/${post.slug}`} className="block group reveal">
      <article className="card-brutalist bg-white h-full flex flex-col" style={{ overflow: 'hidden' }}>
        {post.image && (
          <div className="card-img-wrap" style={{ aspectRatio: '16/9' }}>
            <img
              src={post.image}
              alt={post.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}
              className="group-hover:scale-105"
            />
          </div>
        )}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{ background: catStyle.bg, color: catStyle.color, fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {post.category}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#888' }}>{post.readTime}</span>
          </div>
          <h2
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 800,
              fontSize: '1.15rem',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              transition: 'color 0.15s',
            }}
            className="group-hover:text-teal"
          >
            {post.title}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#555', lineHeight: 1.6, flex: 1 }}>
            {(post.excerpt || post.description)?.slice(0, 110)}…
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto' }}>
            {post.tags?.slice(0, 2).map((tag) => (
              <span key={tag} style={{ fontSize: '0.7rem', border: '1px solid #000', padding: '0.1rem 0.4rem' }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  )
}

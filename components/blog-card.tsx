import Link from 'next/link'
import type { PostFrontmatter } from '@/lib/posts-pt'

interface BlogCardProps {
  post: PostFrontmatter
  basePath?: string
}

export function BlogCard({ post, basePath = '/pt-br/blog' }: BlogCardProps) {
  const categoryColors: Record<string, string> = {
    'social-selling': 'bg-teal text-cream',
    'linkedin': 'bg-cyan text-chattie-black',
    'b2b': 'bg-lavender text-chattie-black',
    'ia-para-vendas': 'bg-orange text-chattie-black',
    'chattie': 'bg-rust text-cream',
  }

  const categoryClass = categoryColors[post.category] || 'bg-sage text-chattie-black'

  return (
    <Link href={`${basePath}/${post.slug}`} className="block group">
      <article className="card-brutalist bg-white p-6 h-full flex flex-col gap-4">
        {post.image && (
          <div className="w-full aspect-video overflow-hidden border-2 border-black">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-800 px-2 py-1 uppercase tracking-wide ${categoryClass}`}>
            {post.category}
          </span>
          <span className="text-xs text-gray-500">{post.readTime}</span>
          <time className="text-xs text-gray-500">
            {new Date(post.date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </time>
        </div>
        <h2 className="font-900 text-xl leading-tight group-hover:text-teal transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-gray-700 line-clamp-3 flex-1">{post.excerpt || post.description}</p>
        <div className="flex flex-wrap gap-2 mt-auto">
          {post.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs border border-black px-2 py-0.5 font-600">
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </Link>
  )
}

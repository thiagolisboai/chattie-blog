import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllSlugsEn, getPostBySlugEn } from '@/lib/posts-en'
import { getMdxComponents } from '@/components/mdx-components'
import { ArticleJsonLd } from '@/components/json-ld'
import { BlogNav } from '@/components/blog-nav'
import { getAuthor } from '@/lib/authors'
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

  return (
    <>
      <ArticleJsonLd post={post} lang="en" />
      <BlogNav lang="en" />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/blog" className="text-sm font-bold text-teal hover:text-rust">
            ← Back to blog
          </Link>
        </div>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest bg-cyan text-chattie-black px-2 py-1">
              {post.category}
            </span>
            <span className="text-xs text-gray-500">{post.readTime}</span>
            <time className="text-xs text-gray-500">
              {new Date(post.date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">{post.title}</h1>
          <p className="text-lg text-gray-700 leading-relaxed">{post.description}</p>
          {post.ptSlug && (
            <div className="mt-3">
              <Link href={`/pt-br/blog/${post.ptSlug}`} className="text-sm text-teal underline font-semibold">
                🇧🇷 Ler em Português →
              </Link>
            </div>
          )}
          {post.image && (
            <div className="mt-6 border-2 border-black shadow-[4px_4px_0_black] overflow-hidden">
              <img src={post.image} alt={post.title} className="w-full aspect-video object-cover" />
            </div>
          )}
        </header>

        <article className="prose">
          <MDXRemote source={post.content} components={getMdxComponents()} />
        </article>

        <footer className="mt-16 border-t-2 border-black pt-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags?.map((tag) => (
              <span key={tag} className="text-sm border border-black px-3 py-1 font-semibold">
                #{tag}
              </span>
            ))}
          </div>

          {author && (
            <div className="flex items-start gap-4 border-2 border-black shadow-[4px_4px_0_black] p-5 mb-8 bg-cream">
              <img
                src={author.photo}
                alt={author.name}
                className="w-16 h-16 rounded-full border-2 border-black object-cover shrink-0"
              />
              <div>
                <p className="font-black text-base">{author.name}</p>
                <p className="text-sm text-gray-600 mb-1">{author.role}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{author.bio}</p>
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-bold text-teal hover:text-rust"
                >
                  LinkedIn →
                </a>
              </div>
            </div>
          )}

          <div className="card-brutalist bg-rust text-cream p-6">
            <p className="font-black text-lg mb-2">Want to sell more on LinkedIn?</p>
            <p className="mb-4 text-cream/90">
              Chattie is the AI SDR that prospects, qualifies and engages your LinkedIn leads — on autopilot.
            </p>
            <a
              href="https://trychattie.com"
              className="inline-block bg-cream text-black font-bold border-2 border-cream px-6 py-3 hover:bg-orange transition-colors"
            >
              Try Chattie →
            </a>
          </div>
        </footer>
      </main>
    </>
  )
}

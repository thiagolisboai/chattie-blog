import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostsEn } from '@/lib/posts-en'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'
import type { PostFrontmatter } from '@/lib/posts-pt'

export const metadata: Metadata = {
  title: 'Blog | Chattie',
  description: 'Insights on social selling, B2B LinkedIn and AI for sales — for founders and operators who sell on LinkedIn.',
  alternates: {
    canonical: 'https://trychattie.com/blog',
    languages: { en: 'https://trychattie.com/blog' },
  },
  openGraph: {
    title: 'Blog | Chattie',
    description: 'Insights on social selling, B2B LinkedIn and AI for sales.',
    url: 'https://trychattie.com/blog',
    locale: 'en_US',
    type: 'website',
  },
}

export default function BlogListEn() {
  const posts = getAllPostsEn()

  return (
    <>
      <BlogNav lang="en" />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <header className="mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-teal mb-3">Blog EN</p>
          <h1 className="text-5xl font-black leading-tight mb-4">
            Social selling, B2B LinkedIn<br />and AI for sales.
          </h1>
          <p className="text-lg text-gray-700 max-w-xl">
            For founders, consultants and B2B operators who sell on LinkedIn.
          </p>
          <div className="mt-4">
            <Link href="/pt-br/blog" className="text-sm text-teal underline font-semibold">
              🇧🇷 Ler em Português →
            </Link>
          </div>
        </header>

        {posts.length === 0 ? (
          <div className="border-2 border-black p-12 text-center shadow-[4px_4px_0_black]">
            <p className="text-2xl font-black mb-2">Coming soon.</p>
            <p className="text-gray-600 mb-4">The first English posts are on their way.</p>
            <Link href="/pt-br/blog" className="inline-block border-2 border-black px-5 py-2 font-bold hover:bg-orange-400 transition-colors text-sm">
              Read in Portuguese →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post as unknown as PostFrontmatter} basePath="/blog" />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

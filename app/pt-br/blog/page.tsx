import type { Metadata } from 'next'
import { getAllPostsPt } from '@/lib/posts-pt'
import { BlogCard } from '@/components/blog-card'
import { BlogNav } from '@/components/blog-nav'

export const metadata: Metadata = {
  title: 'Blog PT-BR | Chattie',
  description: 'Insights sobre social selling, LinkedIn B2B e IA para vendas — para founders e consultores brasileiros.',
  alternates: {
    canonical: 'https://trychattie.com/pt-br/blog',
    languages: { 'pt-BR': 'https://trychattie.com/pt-br/blog' },
  },
  openGraph: {
    title: 'Blog | Chattie',
    description: 'Insights sobre social selling, LinkedIn B2B e IA para vendas.',
    url: 'https://trychattie.com/pt-br/blog',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function BlogListPt() {
  const posts = getAllPostsPt()

  return (
    <>
      <BlogNav lang="pt-BR" />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <header className="mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-teal mb-3">Blog PT-BR</p>
          <h1 className="text-5xl font-black leading-tight mb-4">
            Social selling, LinkedIn B2B<br />e IA para vendas.
          </h1>
          <p className="text-lg text-gray-700 max-w-xl">
            Para founders, consultores e operadores B2B que vendem pelo LinkedIn.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="border-2 border-black p-12 text-center shadow-[4px_4px_0_black]">
            <p className="text-2xl font-black mb-2">Em breve.</p>
            <p className="text-gray-600">Os primeiros posts estão chegando.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} basePath="/pt-br/blog" />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

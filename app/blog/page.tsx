import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogNav } from '@/components/blog-nav'

export const metadata: Metadata = {
  title: 'Blog | Chattie',
  description: 'Insights on social selling, B2B LinkedIn and AI for sales — coming soon.',
  robots: { index: false, follow: false },
}

export default function BlogListEn() {
  return (
    <>
      <BlogNav lang="en" />
      <main className="max-w-5xl mx-auto px-6 py-32 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-teal mb-3">EN Blog</p>
        <h1 className="text-5xl font-black mb-4">Coming soon.</h1>
        <p className="text-gray-600 mb-8">
          The English blog is on its way — after 30 PT-BR posts are live.
        </p>
        <Link href="/pt-br/blog" className="inline-block border-2 border-black px-6 py-3 font-bold hover:bg-orange transition-colors">
          Ler em Português →
        </Link>
      </main>
    </>
  )
}

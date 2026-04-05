import { getAllPostsPt } from '@/lib/posts-pt'
import { getAllPostsEn } from '@/lib/posts-en'
import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = false

export async function GET() {
  const pt = getAllPostsPt().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    tags: p.tags,
    date: p.date,
    readTime: p.readTime,
    lang: 'pt-BR' as const,
    href: `/pt-br/blog/${p.slug}`,
  }))

  const en = getAllPostsEn().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    tags: p.tags,
    date: p.date,
    readTime: p.readTime,
    lang: 'en' as const,
    href: `/blog/${p.slug}`,
  }))

  return NextResponse.json(
    { posts: [...pt, ...en] },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  )
}

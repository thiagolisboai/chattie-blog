import { NextRequest, NextResponse } from 'next/server'
import { getAllPostsPt } from '@/lib/posts-pt'
import { getAllPostsEn } from '@/lib/posts-en'

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en'
  const posts = lang === 'pt' ? getAllPostsPt() : getAllPostsEn()
  const latest = posts.slice(0, 3).map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category ?? '',
    date: p.date ?? p.publishedAt ?? '',
    description: p.description ?? '',
  }))
  return NextResponse.json(latest, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
  })
}

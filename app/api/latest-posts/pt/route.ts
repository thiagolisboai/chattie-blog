import { getAllPostsPt } from '@/lib/posts-pt'

export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  const latest = getAllPostsPt().slice(0, 3).map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category ?? '',
    date: p.date ?? '',
    description: p.description ?? '',
  }))
  return Response.json(latest, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
  })
}

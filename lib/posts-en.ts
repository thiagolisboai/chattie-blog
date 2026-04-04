import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// Outstatic saves to outstatic/content/blog-en/
// Manual/agentic posts go to content/blog-en/
const DIR_OUTSTATIC = path.join(process.cwd(), 'outstatic/content/blog-en')
const DIR_MANUAL = path.join(process.cwd(), 'content/blog-en')

export interface PostEnFrontmatter {
  title: string
  slug: string
  lang: string
  date: string
  publishedAt: string
  description: string
  excerpt: string
  category: string
  tags: string[]
  image: string
  author: string
  readTime: string
  canonicalUrl: string
  structuredData: string
  geoOptimized: boolean
  dateModified?: string
  ptSlug?: string
}

export interface PostEn extends PostEnFrontmatter {
  content: string
}

function mapEnFrontmatter(data: Record<string, unknown>, slug: string): PostEnFrontmatter {
  const authorRaw = data.author as { name?: string } | string | undefined
  const authorName = typeof authorRaw === 'object' && authorRaw !== null
    ? (authorRaw.name ?? 'Thiago Lisboa')
    : (authorRaw as string) ?? 'Thiago Lisboa'
  const dateStr = (data.publishedAt as string) || (data.date as string) || new Date().toISOString()
  return {
    title: (data.title as string) || '',
    slug: (data.slug as string) || slug,
    lang: (data.lang as string) || 'en',
    date: dateStr.split('T')[0],
    publishedAt: dateStr,
    description: (data.description as string) || (data.title as string) || '',
    excerpt: (data.excerpt as string) || (data.description as string) || '',
    category: (data.category as string) || 'chattie',
    tags: (data.tags as string[]) || ['chattie', 'linkedin', 'b2b'],
    image: (data.coverImage as string) || (data.image as string) || '',
    author: authorName,
    readTime: (data.readTime as string) || '5 min',
    canonicalUrl: (data.canonicalUrl as string) || `https://trychattie.com/blog/${slug}`,
    structuredData: (data.structuredData as string) || 'article',
    geoOptimized: (data.geoOptimized as boolean) ?? false,
    dateModified: data.dateModified ? (data.dateModified as string) : undefined,
    ptSlug: (data.ptSlug as string) || '',
  }
}

function readEnPostsFromDir(dir: string): PostEnFrontmatter[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { data } = matter(raw)
      if (data.status && data.status !== 'published') return null
      const slug = (data.slug as string) || file.replace('.mdx', '')
      return mapEnFrontmatter(data as Record<string, unknown>, slug)
    })
    .filter((p): p is PostEnFrontmatter => p !== null)
}

export function getAllPostsEn(): PostEnFrontmatter[] {
  const outstatic = readEnPostsFromDir(DIR_OUTSTATIC)
  const manual = readEnPostsFromDir(DIR_MANUAL)
  return [...outstatic, ...manual]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export function getPostBySlugEn(slug: string): PostEn | null {
  for (const dir of [DIR_OUTSTATIC, DIR_MANUAL]) {
    const file = path.join(dir, `${slug}.mdx`)
    if (!fs.existsSync(file)) continue
    const raw = fs.readFileSync(file, 'utf-8')
    const { data, content } = matter(raw)
    if (data.status && data.status !== 'published') return null
    return { ...mapEnFrontmatter(data as Record<string, unknown>, slug), content }
  }
  return null
}

export function getAllSlugsEn(): string[] {
  return [DIR_OUTSTATIC, DIR_MANUAL].flatMap((dir) => {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((f) => f.replace('.mdx', ''))
  })
}

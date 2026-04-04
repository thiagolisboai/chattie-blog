import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const DIR = path.join(process.cwd(), 'content/blog')

export interface PostFrontmatter {
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
  enSlug?: string
}

export interface Post extends PostFrontmatter {
  content: string
}

export function getAllPostsPt(): PostFrontmatter[] {
  if (!fs.existsSync(DIR)) return []
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(DIR, file), 'utf-8')
      const { data } = matter(raw)
      return {
        ...data,
        slug: (data.slug as string) || file.replace('.mdx', ''),
      } as PostFrontmatter
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlugPt(slug: string): Post | null {
  const file = path.join(DIR, `${slug}.mdx`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf-8')
  const { data, content } = matter(raw)
  return { ...(data as PostFrontmatter), slug, content }
}

export function getAllSlugsPt(): string[] {
  if (!fs.existsSync(DIR)) return []
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace('.mdx', ''))
}

/**
 * Prebuild script — generates public/search-data.json
 * Runs before `next build` so Vercel serves it as a guaranteed static asset.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function resolveAuthor(raw) {
  if (!raw) return 'Thiago Lisboa'
  if (typeof raw === 'object' && raw !== null) return raw.name || 'Thiago Lisboa'
  return String(raw)
}

function readDir(dir, lang, basePath) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .flatMap((file) => {
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
        const { data } = matter(raw)
        if (data.status && data.status !== 'published') return []
        const slug = data.slug || file.replace('.mdx', '')
        return [{
          slug,
          title: data.title || '',
          description: data.description || data.title || '',
          category: data.category || 'chattie',
          tags: Array.isArray(data.tags) ? data.tags : [],
          date: String(data.publishedAt || data.date || '').split('T')[0],
          readTime: data.readTime || '5 min',
          author: resolveAuthor(data.author),
          lang,
          href: `${basePath}/${slug}`,
        }]
      } catch {
        return []
      }
    })
}

const posts = [
  ...readDir(path.join(ROOT, 'outstatic/content/blog-ptbr'), 'pt-BR', '/pt-br/blog'),
  ...readDir(path.join(ROOT, 'content/blog'),                'pt-BR', '/pt-br/blog'),
  ...readDir(path.join(ROOT, 'outstatic/content/blog-en'),   'en',    '/blog'),
  ...readDir(path.join(ROOT, 'content/blog-en'),             'en',    '/blog'),
]

posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const outPath = path.join(ROOT, 'public', 'search-data.json')
fs.writeFileSync(outPath, JSON.stringify({ posts }, null, 0), 'utf-8')
console.log(`✓ search-data.json — ${posts.length} posts indexed`)

import { getAuthor } from '@/lib/authors'

interface ArticleJsonLdProps {
  post: {
    title: string
    description: string
    publishedAt: string
    date: string
    image: string
    canonicalUrl: string
    author?: string
    tags?: string[]
    structuredData?: string
  }
  lang?: string
}

export function ArticleJsonLd({ post, lang = 'pt-BR' }: ArticleJsonLdProps) {
  const author = getAuthor(post.author || 'Thiago Lisboa')

  const authorSchema = author
    ? {
        '@type': 'Person',
        name: author.name,
        url: author.url,
        image: `https://trychattie.com${author.photo}`,
        sameAs: [author.linkedin, ...(author.twitter ? [author.twitter] : [])],
      }
    : {
        '@type': 'Person',
        name: post.author || 'Thiago Lisboa',
        url: 'https://trychattie.com',
      }

  const schema = {
    '@context': 'https://schema.org',
    '@type': post.structuredData === 'faq' ? 'FAQPage' : 'Article',
    headline: post.title,
    description: post.description,
    inLanguage: lang,
    datePublished: post.publishedAt,
    dateModified: post.date,
    author: authorSchema,
    publisher: {
      '@type': 'Organization',
      name: 'Chattie',
      url: 'https://trychattie.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://trychattie.com/brand_assets/Black%20Chattie%20-%20Face%20Symbol.png',
      },
    },
    image: {
      '@type': 'ImageObject',
      url: post.image,
      width: 1200,
      height: 630,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonicalUrl,
    },
    keywords: post.tags?.join(', '),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

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

  const articleSchema = {
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
        url: 'https://trychattie.com/brand/chattie-symbol.png',
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
    // Speakable — helps Google Assistant / voice search cite this content
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.prose h2', '.prose > p:first-of-type'],
    },
  }

  // BreadcrumbList for SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Chattie', item: 'https://trychattie.com' },
      {
        '@type': 'ListItem',
        position: 2,
        name: lang === 'pt-BR' ? 'Blog PT-BR' : 'Blog',
        item: lang === 'pt-BR' ? 'https://trychattie.com/pt-br/blog' : 'https://trychattie.com/blog',
      },
      { '@type': 'ListItem', position: 3, name: post.title, item: post.canonicalUrl },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}

import type { Author } from '@/lib/authors'

interface Props {
  author: Author
  lang: 'pt-BR' | 'en'
}

/**
 * AuthorPersonSchema — injects a Person JSON-LD schema for the author page.
 * Helps LLMs and search engines establish EEAT signals for the author.
 */
export function AuthorPersonSchema({ author, lang }: Props) {
  const pageUrl =
    lang === 'pt-BR'
      ? `https://trychattie.com/pt-br/blog/autor/${author.slug}`
      : `https://trychattie.com/blog/author/${author.slug}`

  const description = lang === 'pt-BR' ? author.bioExpandedPt : author.bioExpanded
  const jobTitle = lang === 'pt-BR' ? author.rolePt : author.role
  const knowsAbout = lang === 'pt-BR' ? author.expertiseAreasPt : author.expertiseAreas

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: pageUrl,
    image: `https://trychattie.com${author.photo}`,
    jobTitle,
    description,
    worksFor: {
      '@type': 'Organization',
      name: author.worksFor,
      url: author.worksForUrl,
    },
    sameAs: [
      author.linkedin,
      ...(author.twitter ? [author.twitter] : []),
      author.url,
    ],
    knowsAbout,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Chattie Blog',
    url: 'https://trychattie.com',
    description: 'Insights sobre social selling, LinkedIn B2B e IA para vendas — pelo time do Chattie.',
    publisher: {
      '@type': 'Organization',
      name: 'Chattie',
      url: 'https://trychattie.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://trychattie.com/brand/chattie-wordmark.png',
      },
      sameAs: [
        'https://www.linkedin.com/company/trychattie',
      ],
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://trychattie.com/pt-br/blog?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['pt-BR', 'en'],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const ALLOWED = [
    '/pt-br/blog/',
    '/blog/',
    '/pt-br/recursos/',
    '/resources/',
    '/feed.xml',
    '/en/feed.xml',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: ALLOWED,
        disallow: ['/keystatic/', '/outstatic/', '/api/'],
      },
      // AI crawlers — explicit GEO permissions
      { userAgent: 'GPTBot',            allow: ALLOWED },
      { userAgent: 'ClaudeBot',         allow: ALLOWED },
      { userAgent: 'CCBot',             allow: ALLOWED },
      { userAgent: 'PerplexityBot',     allow: ALLOWED },
      { userAgent: 'anthropic-ai',      allow: ALLOWED },
      { userAgent: 'Applebot-Extended', allow: ALLOWED },
      { userAgent: 'GoogleOther',       allow: ALLOWED },
      { userAgent: 'Amazonbot',         allow: ALLOWED },
    ],
    sitemap: ['https://trychattie.com/sitemap.xml'],
  }
}

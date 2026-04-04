import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/pt-br/blog/', '/blog/'],
        disallow: ['/keystatic/', '/outstatic/', '/api/'],
      },
      // AI crawlers — explicit GEO permissions
      { userAgent: 'GPTBot',            allow: ['/pt-br/blog/', '/blog/'] },
      { userAgent: 'ClaudeBot',         allow: ['/pt-br/blog/', '/blog/'] },
      { userAgent: 'CCBot',             allow: ['/pt-br/blog/', '/blog/'] },
      { userAgent: 'PerplexityBot',     allow: ['/pt-br/blog/', '/blog/'] },
      { userAgent: 'anthropic-ai',      allow: ['/pt-br/blog/', '/blog/'] },
      { userAgent: 'Applebot-Extended', allow: ['/pt-br/blog/', '/blog/'] },
      { userAgent: 'GoogleOther',       allow: ['/pt-br/blog/', '/blog/'] },
      { userAgent: 'Amazonbot',         allow: ['/pt-br/blog/', '/blog/'] },
    ],
    sitemap: [
      'https://trychattie.com/sitemap-pt-br.xml',
      'https://trychattie.com/sitemap-en.xml',
    ],
  }
}

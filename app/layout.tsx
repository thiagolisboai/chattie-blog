import type { Metadata } from 'next'
import { Barlow } from 'next/font/google'
import Script from 'next/script'
import { SkipLink } from '@/components/skip-link'
import { HtmlLang } from '@/components/html-lang'
import { WebsiteSchema } from '@/components/website-schema'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-barlow',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://trychattie.com'),
  title: {
    default: 'Blog | Chattie',
    template: '%s | Chattie Blog',
  },
  description: 'Insights sobre social selling, LinkedIn B2B e IA para vendas — pelo time do Chattie.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  openGraph: {
    siteName: 'Chattie Blog',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1920, height: 1080 }],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={barlow.variable} suppressHydrationWarning>
      <head>
        {/* Set html[lang] synchronously so crawlers and screen readers get correct value immediately */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=window.location.pathname;document.documentElement.lang=(p.startsWith('/pt-br')||p==='/')?'pt-BR':'en'})()`,
          }}
        />
        {/* RSS feed discovery */}
        <link rel="alternate" type="application/rss+xml" title="Chattie Blog PT-BR" href="/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Chattie Blog EN" href="/en/feed.xml" />
      </head>
      <body className="min-h-screen bg-cream text-chattie-black">
        <WebsiteSchema />
        <HtmlLang />
        <SkipLink />
        <div className="grain-overlay" aria-hidden="true" />
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8JMPF0BR2R"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8JMPF0BR2R');
          `}
        </Script>
      </body>
    </html>
  )
}

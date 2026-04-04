import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://trychattie.com'),
  title: {
    default: 'Blog | Chattie',
    template: '%s | Chattie Blog',
  },
  description: 'Insights sobre social selling, LinkedIn B2B e IA para vendas — pelo time do Chattie.',
  openGraph: {
    siteName: 'Chattie Blog',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1920, height: 1080 }],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-cream text-chattie-black">
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

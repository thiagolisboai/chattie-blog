import type { Metadata } from 'next'
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
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-cream text-chattie-black">
        {children}
      </body>
    </html>
  )
}

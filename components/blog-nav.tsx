'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface BlogNavProps {
  lang?: 'pt-BR' | 'en'
}

const CATEGORIES_PT = [
  { label: 'LinkedIn', href: '/pt-br/blog/categoria/linkedin' },
  { label: 'Social Selling', href: '/pt-br/blog/categoria/social-selling' },
  { label: 'Chattie', href: '/pt-br/blog/categoria/chattie' },
]

const CATEGORIES_EN = [
  { label: 'LinkedIn', href: '/blog/category/linkedin' },
  { label: 'Social Selling', href: '/blog/category/social-selling' },
  { label: 'AI for Sales', href: '/blog/category/ai-for-sales' },
]

export function BlogNav({ lang = 'pt-BR' }: BlogNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isPtBr = lang === 'pt-BR'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navStyle: React.CSSProperties = scrolled
    ? {
        background: 'rgba(250, 251, 243, 0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.07)',
        borderBottomColor: 'rgba(0,0,0,0.07)',
      }
    : { background: '#FAFBF3', borderBottomColor: '#000' }

  const ptListingHref = '/pt-br/blog'
  const enListingHref = '/blog'

  // Language toggle: point to the listing page of the other language
  const ptToggleHref = ptListingHref
  const enToggleHref = enListingHref

  const categories = isPtBr ? CATEGORIES_PT : CATEGORIES_EN

  return (
    <nav
      className="sticky top-0 z-50 border-b-2"
      style={{ ...navStyle, transition: 'background 0.3s, backdrop-filter 0.3s, box-shadow 0.3s, border-color 0.3s' }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: 68 }}>

        {/* Logo → blog listing */}
        <Link href={isPtBr ? ptListingHref : enListingHref} className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
          <img
            src="/brand/chattie-wordmark.png"
            alt="Chattie"
            style={{ height: 28 }}
            onError={(e) => {
              // fallback to text if image fails
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <span
            className="text-xs font-bold border-2 border-black px-2 py-0.5"
            style={{ background: '#E4C1F9', letterSpacing: '0.05em' }}
          >
            Blog
          </span>
        </Link>

        {/* Category links */}
        <div className="hidden md:flex items-center gap-6" style={{ flex: 1, justifyContent: 'center' }}>
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="text-sm font-medium hover:underline"
              style={{ color: '#333' }}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Right: lang toggle + CTA */}
        <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
          {/* Language toggle pill */}
          <div
            className="flex items-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', padding: '0.18rem', gap: 0 }}
          >
            <Link
              href={ptToggleHref}
              className="rounded-full text-xs font-semibold px-2.5 py-1 transition-all"
              style={isPtBr
                ? { background: 'white', color: '#000', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                : { background: 'none', color: '#888' }}
            >
              PT
            </Link>
            <Link
              href={enToggleHref}
              className="rounded-full text-xs font-semibold px-2.5 py-1 transition-all"
              style={!isPtBr
                ? { background: 'white', color: '#000', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                : { background: 'none', color: '#888' }}
            >
              EN
            </Link>
          </div>

          {/* CTA → trychattie.com */}
          <a
            href="https://trychattie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center text-sm font-bold border-2 border-black text-cream rounded-full btn-nav-cta"
            style={{ background: '#E57B33', padding: '0.45rem 1.2rem', minHeight: 40 }}
          >
            {isPtBr ? 'Conhecer o Chattie →' : 'Try Chattie →'}
          </a>
        </div>
      </div>
    </nav>
  )
}

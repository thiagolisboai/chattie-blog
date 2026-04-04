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
  { label: 'Comparativos', href: '/pt-br/blog/categoria/comparativos' },
  { label: 'Chattie', href: '/pt-br/blog/categoria/chattie' },
  { label: '📋 Checklist', href: '/pt-br/recursos/checklist-prospeccao-linkedin' },
]

const CATEGORIES_EN = [
  { label: 'LinkedIn', href: '/blog/category/linkedin' },
  { label: 'Social Selling', href: '/blog/category/social-selling' },
  { label: 'Comparisons', href: '/blog/category/comparativos' },
  { label: 'AI for Sales', href: '/blog/category/ai-for-sales' },
  { label: '📋 Checklist', href: '/resources/linkedin-prospecting-checklist' },
]

export function BlogNav({ lang = 'pt-BR' }: BlogNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isPtBr = lang === 'pt-BR'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const navBg: React.CSSProperties = scrolled
    ? {
        background: 'rgba(250, 251, 243, 0.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.07)',
        borderBottomColor: 'rgba(0,0,0,0.07)',
      }
    : { background: '#FAFBF3', borderBottomColor: '#000' }

  const ptListingHref = '/pt-br/blog'
  const enListingHref = '/blog'
  const categories = isPtBr ? CATEGORIES_PT : CATEGORIES_EN

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b-2"
        style={{ ...navBg, transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s' }}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between" style={{ height: 64 }}>

          {/* Logo — fullmark (symbol + wordmark) */}
          <Link href={isPtBr ? ptListingHref : enListingHref} className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
            <img
              src="/brand/chattie-fullmark.png"
              alt="Chattie"
              style={{ height: 30, width: 'auto', maxWidth: 140 }}
              onError={(e) => {
                const img = e.target as HTMLImageElement
                img.src = '/brand/chattie-wordmark.png'
                img.onerror = () => { img.style.display = 'none' }
              }}
            />
            <span
              className="text-xs font-bold border-2 border-black px-2 py-0.5"
              style={{ background: '#E4C1F9', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
            >
              Blog
            </span>
          </Link>

          {/* Desktop category links */}
          <div className="hidden lg:flex items-center gap-5" style={{ flex: 1, justifyContent: 'center' }}>
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="text-sm font-semibold transition-colors hover:text-rust"
                style={{ color: pathname === cat.href ? '#E57B33' : '#333' }}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Right: lang toggle + CTA + hamburger */}
          <div className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
            {/* Language toggle pill */}
            <div
              className="flex items-center rounded-full"
              style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', padding: '0.15rem', gap: 0 }}
            >
              <Link
                href={ptListingHref}
                className="rounded-full text-xs font-semibold px-2.5 py-1 transition-all"
                style={isPtBr ? { background: 'white', color: '#000', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' } : { background: 'none', color: '#888' }}
              >
                PT
              </Link>
              <Link
                href={enListingHref}
                className="rounded-full text-xs font-semibold px-2.5 py-1 transition-all"
                style={!isPtBr ? { background: 'white', color: '#000', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' } : { background: 'none', color: '#888' }}
              >
                EN
              </Link>
            </div>

            {/* CTA — same tab (navigates within trychattie.com) */}
            <a
              href="https://trychattie.com"
              className="hidden sm:inline-flex items-center text-sm font-bold border-2 border-black text-cream rounded-full btn-nav-cta"
              style={{ background: '#E57B33', padding: '0.4rem 1.1rem', minHeight: 38, color: '#FAFBF3' }}
            >
              {isPtBr ? 'Conhecer o Chattie →' : 'Try Chattie →'}
            </a>

            {/* Hamburger button (mobile + tablet) */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              className="lg:hidden flex flex-col justify-center items-center gap-1.5"
              style={{ width: 38, height: 38, background: 'none', border: '2px solid #000', flexShrink: 0, padding: '6px', cursor: 'pointer' }}
            >
              <span
                style={{
                  display: 'block', width: 18, height: 2, background: '#000',
                  transition: 'transform 0.2s, opacity 0.2s',
                  transform: menuOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none',
                }}
              />
              <span
                style={{
                  display: 'block', width: 18, height: 2, background: '#000',
                  opacity: menuOpen ? 0 : 1,
                  transition: 'opacity 0.2s',
                }}
              />
              <span
                style={{
                  display: 'block', width: 18, height: 2, background: '#000',
                  transition: 'transform 0.2s, opacity 0.2s',
                  transform: menuOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div
            style={{
              background: '#FAFBF3',
              borderTop: '2px solid #000',
              padding: '1rem 1.25rem 1.5rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {categories.map((cat, i) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  style={{
                    padding: '0.8rem 0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: pathname === cat.href ? '#E57B33' : '#000',
                    borderBottom: i < categories.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {cat.label}
                  <span style={{ color: '#999', fontSize: '0.9rem' }}>→</span>
                </Link>
              ))}
              <a
                href="https://trychattie.com"
                style={{
                  marginTop: '1rem',
                  background: '#E57B33',
                  color: '#FAFBF3',
                  border: '2px solid #000',
                  padding: '0.7rem 1.25rem',
                  fontFamily: "'Sherika', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block',
                  boxShadow: '3px 3px 0 #000',
                }}
              >
                {isPtBr ? 'Conhecer o Chattie →' : 'Try Chattie →'}
              </a>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

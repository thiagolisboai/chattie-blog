'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { SearchModal } from '@/components/search-modal'

interface BlogNavProps {
  lang?: 'pt-BR' | 'en'
}

const CATEGORIES_PT = [
  { label: 'LinkedIn', href: '/pt-br/blog/categoria/linkedin' },
  { label: 'Social Selling', href: '/pt-br/blog/categoria/social-selling' },
  { label: 'Comparativos', href: '/pt-br/blog/categoria/comparativos' },
  { label: 'Chattie', href: '/pt-br/blog/categoria/chattie' },
  { label: 'IA para Vendas', href: '/pt-br/blog/categoria/ia-para-vendas' },
  { label: 'B2B', href: '/pt-br/blog/categoria/b2b' },
]

const CATEGORIES_EN = [
  { label: 'LinkedIn', href: '/blog/category/linkedin' },
  { label: 'Social Selling', href: '/blog/category/social-selling' },
  { label: 'Comparisons', href: '/blog/category/comparisons' },
  { label: 'AI for Sales', href: '/blog/category/ai-for-sales' },
  { label: 'B2B', href: '/blog/category/b2b' },
  { label: 'Chattie', href: '/blog/category/chattie' },
]

export function BlogNav({ lang = 'pt-BR' }: BlogNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isPtBr = lang === 'pt-BR'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setCatOpen(false) }, [pathname])

  // Close dropdown on outside click
  useEffect(() => {
    if (!catOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [catOpen])

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isCategoryActive = () => {
    const cats = isPtBr ? CATEGORIES_PT : CATEGORIES_EN
    return cats.some((c) => isActive(c.href))
  }

  const navBg: React.CSSProperties = scrolled
    ? {
        background: 'rgba(250, 251, 243, 0.94)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 4px 0 #000',
        borderBottomColor: '#000',
      }
    : { background: '#FAFBF3', borderBottomColor: '#000' }

  const ptListingHref = '/pt-br/blog'
  const enListingHref = '/blog'
  const categories = isPtBr ? CATEGORIES_PT : CATEGORIES_EN
  const catLabel = isPtBr ? 'Categorias' : 'Categories'

  return (
    <>
      <style>{`
        .cat-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #FAFBF3;
          border: 2px solid #000;
          box-shadow: 4px 4px 0 #000;
          min-width: 220px;
          z-index: 200;
          animation: menuSlideDown 0.18s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        .cat-dropdown a {
          display: block;
          padding: 0.6rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #333;
          text-decoration: none;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          transition: background 0.1s, color 0.1s, border-left 0.1s;
          border-left: 3px solid transparent;
        }
        .cat-dropdown a:last-child { border-bottom: none; }
        .cat-dropdown a:hover { background: #fff; color: #000; border-left-color: #2F6451; }
        .cat-dropdown a.active { color: #E57B33; font-weight: 800; border-left-color: #E57B33; }
      `}</style>

      <nav
        className="sticky top-0 z-50 border-b-2"
        style={{ ...navBg, transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s' }}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between" style={{ height: 64 }}>

          {/* Logo — wordmark only */}
          <Link href={isPtBr ? ptListingHref : enListingHref} className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
            <Image
              src="/brand/chattie-wordmark.png"
              alt="Chattie"
              width={110}
              height={26}
              style={{ height: 26, width: 'auto' }}
              priority
            />
            <span
              className="text-xs font-bold border-2 border-black px-2 py-0.5"
              style={{ background: '#E4C1F9', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
            >
              Blog
            </span>
          </Link>

          {/* Desktop nav — center */}
          <div className="hidden lg:flex items-center gap-6" style={{ flex: 1, justifyContent: 'center' }}>

            {/* Blog home link */}
            <Link
              href={isPtBr ? ptListingHref : enListingHref}
              className="text-sm font-semibold transition-colors"
              style={{
                color: (pathname === ptListingHref || pathname === enListingHref) ? '#E57B33' : '#333',
                textDecoration: 'none',
                position: 'relative',
                paddingBottom: '2px',
              }}
            >
              {isPtBr ? 'Artigos' : 'Articles'}
              {(pathname === ptListingHref || pathname === enListingHref) && (
                <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: '#E57B33', display: 'block' }} />
              )}
            </Link>

            {/* Categories dropdown */}
            <div
              ref={catRef}
              style={{ position: 'relative' }}
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
                aria-haspopup="true"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isCategoryActive() ? '#E57B33' : '#333',
                  padding: '0 0 2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  position: 'relative',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { if (!isCategoryActive()) (e.currentTarget as HTMLButtonElement).style.color = '#000' }}
                onMouseLeave={(e) => { if (!isCategoryActive()) (e.currentTarget as HTMLButtonElement).style.color = '#333' }}
              >
                {catLabel}
                <span style={{
                  display: 'inline-block',
                  width: 0, height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: `4px solid ${isCategoryActive() ? '#E57B33' : 'currentColor'}`,
                  transition: 'transform 0.15s',
                  transform: catOpen ? 'rotate(180deg)' : 'none',
                  marginTop: 2,
                }} />
                {isCategoryActive() && (
                  <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: '#E57B33', display: 'block' }} />
                )}
              </button>

              {catOpen && (
                <div className="cat-dropdown">
                  {categories.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className={isActive(cat.href) ? 'active' : ''}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter anchor */}
            <a
              href={isPtBr ? '/pt-br/blog#newsletter' : '/blog#newsletter'}
              style={{ fontSize: '0.875rem', fontWeight: 600, color: '#333', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#000' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#333' }}
            >
              Newsletter
            </a>
          </div>

          {/* Right: search + lang toggle + CTA + hamburger */}
          <div className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
            <SearchModal lang={isPtBr ? 'pt-BR' : 'en'} />
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

            {/* CTA */}
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
            className="mobile-menu-open"
            style={{
              background: '#FAFBF3',
              borderTop: '2px solid #000',
              padding: '1rem 1.25rem 1.5rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <Link
                href={isPtBr ? ptListingHref : enListingHref}
                style={{
                  padding: '0.8rem 0',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#000',
                  borderBottom: '1px solid rgba(0,0,0,0.1)',
                  borderLeft: '3px solid transparent',
                  paddingLeft: '0.75rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {isPtBr ? 'Artigos' : 'Articles'}
                <span style={{ color: '#999', fontSize: '0.9rem' }}>→</span>
              </Link>

              {/* Mobile: categories section header */}
              <p style={{
                padding: '0.7rem 0.75rem 0.3rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#999',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                marginBottom: 0,
              }}>
                {catLabel}
              </p>

              {categories.map((cat, i) => {
                const active = isActive(cat.href)
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    style={{
                      padding: '0.7rem 0',
                      fontSize: '0.9rem',
                      fontWeight: active ? 800 : 600,
                      color: active ? '#E57B33' : '#000',
                      borderBottom: i < categories.length - 1 ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(0,0,0,0.1)',
                      borderLeft: active ? '3px solid #E57B33' : '3px solid transparent',
                      paddingLeft: '1.25rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {cat.label}
                    <span style={{ color: active ? '#E57B33' : '#ccc', fontSize: '0.9rem' }}>→</span>
                  </Link>
                )
              })}

              <a
                href={isPtBr ? '/pt-br/blog#newsletter' : '/blog#newsletter'}
                style={{
                  padding: '0.8rem 0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#000',
                  borderBottom: '1px solid rgba(0,0,0,0.1)',
                  borderLeft: '3px solid transparent',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                Newsletter
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>→</span>
              </a>

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

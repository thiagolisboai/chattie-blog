'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface BlogNavProps {
  lang?: 'pt-BR' | 'en'
}

export function BlogNav({ lang = 'pt-BR' }: BlogNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isPtBr = lang === 'pt-BR'

  const navStyle: React.CSSProperties = scrolled
    ? {
        background: 'rgba(250, 251, 243, 0.72)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.07)',
        borderBottomColor: 'rgba(0,0,0,0.07)',
      }
    : {
        background: '#FAFBF3',
        borderBottomColor: '#000',
      }

  return (
    <nav
      className="sticky top-0 z-50 border-b-2"
      style={{
        ...navStyle,
        transition: 'background 0.3s, backdrop-filter 0.3s, box-shadow 0.3s, border-color 0.3s',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: 68 }}>

        {/* Logo */}
        <Link href="https://trychattie.com" className="flex items-center gap-2.5">
          <img
            src="/brand/chattie-wordmark.png"
            alt="Chattie"
            style={{ height: 32 }}
          />
          <span
            className="text-xs font-bold border-2 border-black px-2 py-0.5"
            style={{ background: '#E4C1F9', letterSpacing: '0.05em' }}
          >
            Blog
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-7">
          <a
            href="https://trychattie.com/#como-funciona"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: '#222' }}
          >
            {isPtBr ? 'Como funciona' : 'How it works'}
          </a>
          <a
            href="https://trychattie.com/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: '#222' }}
          >
            {isPtBr ? 'Preços' : 'Pricing'}
          </a>
        </div>

        {/* Right: lang toggle + CTA */}
        <div className="flex items-center gap-3">
          {/* Language toggle pill */}
          <div
            className="flex items-center rounded-full"
            style={{
              background: 'rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.1)',
              padding: '0.18rem',
              gap: 0,
            }}
          >
            <Link
              href={isPtBr ? pathname : pathname.replace(/^\/blog/, '/pt-br/blog')}
              className="rounded-full text-xs font-semibold px-2.5 py-1 transition-all"
              style={isPtBr
                ? { background: 'white', color: '#000', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                : { background: 'none', color: '#888' }
              }
            >
              PT
            </Link>
            <Link
              href={isPtBr ? pathname.replace(/^\/pt-br\/blog/, '/blog') : pathname}
              className="rounded-full text-xs font-semibold px-2.5 py-1 transition-all"
              style={!isPtBr
                ? { background: 'white', color: '#000', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                : { background: 'none', color: '#888' }
              }
            >
              EN
            </Link>
          </div>

          {/* CTA button */}
          <a
            href="https://trychattie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block text-sm font-bold border-2 border-black text-cream rounded-full"
            style={{
              background: '#E57B33',
              padding: '0.45rem 1.2rem',
              minHeight: 40,
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'transform 0.12s cubic-bezier(0.16,1,0.3,1), box-shadow 0.12s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = 'translate(-2px,-2px)'
              el.style.boxShadow = '4px 4px 0 #000'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = ''
              el.style.boxShadow = ''
            }}
          >
            {isPtBr ? 'Conhecer o Chattie →' : 'Try Chattie →'}
          </a>
        </div>
      </div>
    </nav>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface PostResult {
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  readTime: string
  lang: 'pt-BR' | 'en'
  href: string
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'social-selling':  { bg: '#2F6451', color: '#FAFBF3' },
  'linkedin':        { bg: '#66BAC6', color: '#000' },
  'b2b':             { bg: '#E4C1F9', color: '#000' },
  'ia-para-vendas':  { bg: '#F4B13F', color: '#000' },
  'chattie':         { bg: '#E57B33', color: '#FAFBF3' },
  'comparativos':    { bg: '#000', color: '#FAFBF3' },
  'comparisons':     { bg: '#000', color: '#FAFBF3' },
  'ai-for-sales':    { bg: '#F4B13F', color: '#000' },
}

export function SearchModal({ lang = 'pt-BR' }: { lang?: 'pt-BR' | 'en' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<PostResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const isPtBr = lang === 'pt-BR'

  // Close on route change
  useEffect(() => { setOpen(false); setQuery('') }, [pathname])

  // Load posts once on first open
  useEffect(() => {
    if (!open || posts.length > 0) return
    setLoading(true)
    fetch('/search-data.json')
      .then((r) => r.json())
      .then((data) => { setPosts(data.posts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, posts.length])

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen((v) => !v) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = query.trim().length < 2
    ? []
    : posts.filter((p) => {
        const q = query.toLowerCase()
        // Respect language context: show both but prefer current lang first
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => {
        // Current-language results first
        const aMatch = a.lang === lang ? -1 : 1
        const bMatch = b.lang === lang ? -1 : 1
        return aMatch - bMatch
      })
      .slice(0, 8)

  const placeholder = isPtBr ? 'Buscar artigos… (⌘K)' : 'Search articles… (⌘K)'
  const noResults = isPtBr ? 'Nenhum artigo encontrado.' : 'No articles found.'
  const hint = isPtBr ? 'Digite ao menos 2 caracteres' : 'Type at least 2 characters'

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label={isPtBr ? 'Buscar' : 'Search'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'none',
          border: '2px solid #000',
          padding: '0.3rem 0.65rem',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#000',
          borderRadius: 0,
          flexShrink: 0,
          transition: 'transform 0.12s cubic-bezier(0.16,1,0.3,1), box-shadow 0.12s cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translate(-1px,-1px)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '2px 2px 0 #000'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translate(0,0)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span className="hidden sm:inline">{isPtBr ? 'Buscar' : 'Search'}</span>
      </button>

      {/* Backdrop + Modal */}
      {open && (
        <div
          className="search-backdrop-enter"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '10vh 1rem 0',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isPtBr ? 'Busca' : 'Search'}
            className="search-modal-enter"
            style={{
              background: '#FAFBF3',
              border: '2px solid #000',
              boxShadow: '8px 8px 0 #000',
              width: '100%',
              maxWidth: 620,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '70vh',
              overflow: 'hidden',
            }}
          >
            {/* Input */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #000', padding: '0 1rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" style={{ flexShrink: 0 }} aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  padding: '1rem 0.75rem',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  color: '#000',
                }}
              />
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '1.2rem', padding: '0.25rem 0.5rem' }}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Results */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading && (
                <p style={{ padding: '1.5rem', color: '#888', fontSize: '0.9rem', textAlign: 'center' }}>
                  {isPtBr ? 'Carregando…' : 'Loading…'}
                </p>
              )}
              {!loading && query.trim().length < 2 && (
                <p style={{ padding: '1.5rem', color: '#aaa', fontSize: '0.85rem', textAlign: 'center' }}>{hint}</p>
              )}
              {!loading && query.trim().length >= 2 && filtered.length === 0 && (
                <p style={{ padding: '1.5rem', color: '#888', fontSize: '0.9rem', textAlign: 'center' }}>{noResults}</p>
              )}
              {filtered.map((post) => {
                const cat = CATEGORY_COLORS[post.category] ?? { bg: '#B7C3B0', color: '#000' }
                return (
                  <Link
                    key={`${post.lang}-${post.slug}`}
                    href={post.href}
                    onClick={() => { setOpen(false); setQuery('') }}
                    style={{
                      display: 'block',
                      padding: '0.9rem 1.25rem',
                      borderBottom: '1px solid rgba(0,0,0,0.08)',
                      borderLeft: '3px solid transparent',
                      textDecoration: 'none',
                      color: '#000',
                      transition: 'background 0.12s, border-left-color 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement
                      el.style.background = '#FAFBF3'
                      el.style.borderLeftColor = '#2F6451'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement
                      el.style.background = 'transparent'
                      el.style.borderLeftColor = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: cat.bg, color: cat.color, padding: '0.15rem 0.45rem' }}>
                        {post.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>{post.readTime}</span>
                      {post.lang !== lang && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', border: '1.5px solid #ccc', padding: '0.1rem 0.35rem' }}>
                          {post.lang === 'en' ? 'EN' : 'PT-BR'}
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Sherika', sans-serif", fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, margin: '0 0 0.25rem' }}>
                      {post.title}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: '#666', margin: 0, lineHeight: 1.5 }}>
                      {post.description.slice(0, 100)}…
                    </p>
                  </Link>
                )
              })}
            </div>

            {/* Footer hint */}
            <div style={{ padding: '0.6rem 1.25rem', borderTop: '2px solid #000', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#888', background: 'rgba(0,0,0,0.02)' }}>
              <span>↵ {isPtBr ? 'selecionar' : 'select'}</span>
              <span>ESC {isPtBr ? 'fechar' : 'close'}</span>
              <span>⌘K {isPtBr ? 'abrir/fechar' : 'toggle'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

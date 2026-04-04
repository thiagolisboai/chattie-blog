'use client'

import { useEffect, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: 2 | 3
}

interface TableOfContentsProps {
  compact?: boolean
}

export function TableOfContents({ compact = false }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    const article = document.querySelector('article.prose')
    if (!article) return

    const els = article.querySelectorAll('h2, h3')
    const items: Heading[] = []

    els.forEach((el) => {
      // Generate slug id if not present
      if (!el.id) {
        el.id = el.textContent
          ? el.textContent
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9\s-]/g, '')
              .trim()
              .replace(/\s+/g, '-')
          : `heading-${items.length}`
      }
      items.push({
        id: el.id,
        text: el.textContent || '',
        level: el.tagName === 'H2' ? 2 : 3,
      })
    })

    setHeadings(items)

    // IntersectionObserver to track active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  if (headings.length < 3) return null

  return (
    <nav
      aria-label="Índice do artigo"
      style={{
        border: '2px solid #000',
        boxShadow: compact ? 'none' : '4px 4px 0 #000',
        padding: compact ? '1rem 1.25rem' : '1.25rem 1.5rem',
        marginBottom: compact ? '0' : '2.5rem',
        background: '#FAFBF3',
      }}
    >
      <p style={{
        fontFamily: "'Sherika', sans-serif",
        fontWeight: 800,
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.13em',
        color: '#555',
        marginBottom: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <span style={{ display: 'inline-block', width: 18, height: 2, background: 'currentColor' }} />
        Neste artigo
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? '1rem' : 0 }}>
            <a
              href={`#${h.id}`}
              style={{
                fontSize: h.level === 2 ? '0.9rem' : '0.82rem',
                fontWeight: h.level === 2 ? 600 : 400,
                color: active === h.id ? '#E57B33' : '#2F6451',
                textDecoration: 'none',
                borderLeft: active === h.id ? '2px solid #E57B33' : '2px solid transparent',
                paddingLeft: '0.5rem',
                transition: 'color 0.15s, border-color 0.15s',
                display: 'block',
                lineHeight: 1.4,
              }}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

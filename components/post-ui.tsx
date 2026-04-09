'use client'

import { useEffect, useRef, useState } from 'react'
import { trackPostRead } from '@/lib/analytics'

interface ReadingProgressBarProps {
  slug?: string
  lang?: string
}

export function ReadingProgressBar({ slug, lang }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const firedMilestones = useRef<Set<number>>(new Set())

  useEffect(() => {
    const milestones = [25, 50, 75, 100]
    const update = () => {
      const article = document.querySelector('article.prose') as HTMLElement | null
      let pct: number
      if (!article) {
        const docH = document.documentElement.scrollHeight - window.innerHeight
        pct = docH > 0 ? (window.scrollY / docH) * 100 : 0
      } else {
        const articleTop = article.offsetTop
        const articleH = article.offsetHeight
        const scrolled = window.scrollY - articleTop
        pct = Math.min(100, Math.max(0, (scrolled / (articleH - window.innerHeight * 0.5)) * 100))
      }
      setProgress(pct)
      if (slug && lang) {
        for (const milestone of milestones) {
          if (pct >= milestone && !firedMilestones.current.has(milestone)) {
            firedMilestones.current.add(milestone)
            trackPostRead(slug, lang, milestone)
          }
        }
      }
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [slug, lang])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 100,
        background: 'rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: '#E57B33',
          transition: 'width 0.1s linear',
          transformOrigin: 'left',
        }}
      />
    </div>
  )
}

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleClick = () => {
    setRolling(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setRolling(false), 600)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      className="scroll-top-btn"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 50,
        height: 50,
        background: '#F4B13F',
        color: '#000',
        border: '2px solid #000',
        borderRadius: '50%',
        fontSize: '1.3rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        boxShadow: '4px 4px 0 #000',
        transition: 'opacity 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.15s',
        animation: rolling ? 'rollUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
      }}
    >
      ↑
    </button>
  )
}

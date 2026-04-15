'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * GA4Events — fires custom GA4 events for scroll depth, CTA clicks, and reading completion.
 *
 * Scroll depth: fires at 25 / 50 / 75 / 100% — each threshold fires once per page.
 * Reading complete: fires when 100% scroll threshold is reached.
 * CTA click: fires when any element with data-ga-cta="<label>" is clicked.
 */
export function GA4Events() {
  const pathname = usePathname()

  // Scroll depth + reading completion
  useEffect(() => {
    const thresholds = [25, 50, 75, 100]
    const fired = new Set<number>()

    function getScrollPct(): number {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      return total > 0 ? Math.round((el.scrollTop / total) * 100) : 0
    }

    function onScroll() {
      const pct = getScrollPct()
      for (const t of thresholds) {
        if (pct >= t && !fired.has(t)) {
          fired.add(t)
          window.gtag?.('event', 'scroll_depth', {
            depth_percent: t,
            page_path: pathname,
          })
          if (t === 100) {
            window.gtag?.('event', 'reading_complete', {
              page_path: pathname,
            })
          }
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  // CTA click tracking via event delegation
  // Add data-ga-cta="<label>" to any clickable element to track it
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('[data-ga-cta]') as HTMLElement | null
      if (!target) return
      window.gtag?.('event', 'cta_click', {
        cta_label: target.dataset.gaCta,
        page_path: pathname,
      })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [pathname])

  return null
}

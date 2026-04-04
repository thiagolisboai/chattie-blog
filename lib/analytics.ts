type GtagFn = (...args: unknown[]) => void

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return
  const w = window as typeof window & { gtag?: GtagFn; dataLayer?: unknown[] }
  if (typeof w.gtag === 'function') {
    w.gtag(...args)
  }
}

export function trackCtaClick(label: string, destination?: string) {
  gtag('event', 'cta_click', {
    event_category: 'conversion',
    event_label: label,
    destination,
  })
}

export function trackPostRead(slug: string, lang: string, percent: number) {
  gtag('event', 'post_read_depth', {
    event_category: 'engagement',
    event_label: slug,
    value: percent,
    lang,
  })
}

export function trackTocClick(headingId: string) {
  gtag('event', 'toc_click', {
    event_category: 'navigation',
    event_label: headingId,
  })
}

export function trackRelatedPostClick(slug: string) {
  gtag('event', 'related_post_click', {
    event_category: 'navigation',
    event_label: slug,
  })
}

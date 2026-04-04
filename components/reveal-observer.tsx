'use client'

import { useEffect } from 'react'

export function RevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    const observe = () => {
      document.querySelectorAll('.reveal:not(.revealed)').forEach((el) => observer.observe(el))
    }

    observe()
    // Re-run after a tick to catch dynamically rendered cards
    const t = setTimeout(observe, 100)
    return () => { clearTimeout(t); observer.disconnect() }
  }, [])

  return null
}

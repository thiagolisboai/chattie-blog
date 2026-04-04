'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function HtmlLang() {
  const pathname = usePathname()

  useEffect(() => {
    const lang = pathname.startsWith('/pt-br') || pathname === '/' ? 'pt-BR' : 'en'
    document.documentElement.lang = lang
  }, [pathname])

  return null
}

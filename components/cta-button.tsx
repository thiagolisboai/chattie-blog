'use client'

import { trackCtaClick } from '@/lib/analytics'

interface CtaButtonProps {
  href: string
  label: string
  gaLabel?: string
  className?: string
  children: React.ReactNode
}

export function CtaButton({ href, label, gaLabel, className, children }: CtaButtonProps) {
  const campaign = encodeURIComponent((gaLabel ?? label).toLowerCase().replace(/\s+/g, '-'))
  const finalHref = href.startsWith('https://trychattie.com')
    ? `${href.split('?')[0]}?utm_source=blog&utm_medium=cta&utm_campaign=${campaign}`
    : href

  return (
    <a
      href={finalHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className ?? 'btn-cta-post'}
      onClick={() => trackCtaClick(gaLabel ?? label, finalHref)}
    >
      {children}
    </a>
  )
}

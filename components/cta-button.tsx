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
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className ?? 'btn-cta-post'}
      onClick={() => trackCtaClick(gaLabel ?? label, href)}
    >
      {children}
    </a>
  )
}

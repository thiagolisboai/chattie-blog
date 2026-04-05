'use client'

import { useState } from 'react'

interface NewsletterCtaProps {
  lang?: 'pt-BR' | 'en'
}

export function NewsletterCta({ lang = 'pt-BR' }: NewsletterCtaProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const copy = {
    'pt-BR': {
      label: 'NEWSLETTER',
      heading: 'Toda semana, uma ideia prática sobre LinkedIn B2B.',
      body: 'Sem spam. Só o que funciona para quem vende de forma consultiva.',
      placeholder: 'seu@email.com',
      btn: 'Quero receber',
      btnLoading: 'Enviando…',
      success: 'Ótimo! Você está na lista. Obrigado 🙌',
      error: 'Algo deu errado. Tente novamente.',
    },
    en: {
      label: 'NEWSLETTER',
      heading: 'One practical LinkedIn B2B idea, every week.',
      body: 'No spam. Only what works for consultative sellers.',
      placeholder: 'your@email.com',
      btn: 'Subscribe',
      btnLoading: 'Subscribing…',
      success: 'You\'re in! Thanks for subscribing 🙌',
      error: 'Something went wrong. Please try again.',
    },
  }

  const t = copy[lang]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')

    // Fire GA4 event
    if (typeof window !== 'undefined' && (window as typeof window & { gtag?: Function }).gtag) {
      ;(window as typeof window & { gtag: Function }).gtag('event', 'newsletter_signup', {
        event_category: 'engagement',
        event_label: lang,
      })
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      id="newsletter"
      style={{
        border: '2px solid #000',
        boxShadow: '6px 6px 0 #E57B33',
        background: '#000',
        padding: '2rem 2.25rem',
        margin: '2rem 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative accent corner */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: '#E57B33',
        clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
        opacity: 0.25,
      }} />

      <p
        style={{
          fontFamily: "'Sherika', sans-serif",
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.13em',
          color: '#66BAC6',
          marginBottom: '0.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ display: 'inline-block', width: 14, height: 2, background: 'currentColor' }} />
        {t.label}
      </p>

      <p
        style={{
          fontFamily: "'Sherika', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
          color: '#FAFBF3',
        }}
      >
        {t.heading}
      </p>
      <p style={{ fontSize: '0.9rem', color: 'rgba(250,251,243,0.65)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        {t.body}
      </p>

      {status === 'success' ? (
        <p
          style={{
            background: '#2F6451',
            color: '#FAFBF3',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: '2px solid #66BAC6',
          }}
        >
          {t.success}
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            style={{
              flex: '1 1 200px',
              border: '2px solid #333',
              padding: '0.65rem 0.85rem',
              fontSize: '0.9rem',
              background: '#1a1a1a',
              outline: 'none',
              color: '#FAFBF3',
              fontFamily: "var(--font-barlow, 'Barlow'), sans-serif",
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#66BAC6' }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#333' }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              background: status === 'loading' ? '#444' : '#F4B13F',
              color: '#000',
              border: '2px solid #F4B13F',
              padding: '0.65rem 1.25rem',
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: status === 'loading' ? 'none' : '3px 3px 0 rgba(244,177,63,0.4)',
              transition: 'transform 0.1s, box-shadow 0.1s, background 0.1s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (status !== 'loading') {
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translate(-1px,-1px)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0 rgba(244,177,63,0.5)'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translate(0,0)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = status === 'loading' ? 'none' : '3px 3px 0 rgba(244,177,63,0.4)'
            }}
          >
            {status === 'loading' && (
              <span style={{
                display: 'inline-block', width: 14, height: 14,
                border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
            {status === 'loading' ? t.btnLoading : t.btn}
          </button>
          {status === 'error' && (
            <p style={{ width: '100%', color: '#ff6b6b', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              {t.error}
            </p>
          )}
        </form>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

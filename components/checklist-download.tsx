'use client'

import { useState } from 'react'

interface ChecklistDownloadProps {
  lang?: 'pt-BR' | 'en'
}

export function ChecklistDownload({ lang = 'pt-BR' }: ChecklistDownloadProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const copy = {
    'pt-BR': {
      placeholder: 'seu@email.com — receba também por e-mail',
      btn: 'Baixar PDF',
      btnLoading: 'Enviando…',
      print: 'Imprimir / Salvar como PDF',
      success: 'Checklist enviado! Confira seu e-mail.',
    },
    en: {
      placeholder: 'your@email.com — get it by email too',
      btn: 'Download PDF',
      btnLoading: 'Sending…',
      print: 'Print / Save as PDF',
      success: 'Checklist sent! Check your email.',
    },
  }

  const t = copy[lang]

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')

    if (typeof window !== 'undefined' && (window as typeof window & { gtag?: Function }).gtag) {
      ;(window as typeof window & { gtag: Function }).gtag('event', 'lead_magnet_download', {
        event_category: 'conversion',
        event_label: `checklist_${lang}`,
      })
    }

    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang, source: 'checklist' }),
      })
    } catch { /* non-blocking */ }

    setStatus('done')
  }

  function handlePrint() {
    if (typeof window !== 'undefined' && (window as typeof window & { gtag?: Function }).gtag) {
      ;(window as typeof window & { gtag: Function }).gtag('event', 'lead_magnet_print', {
        event_category: 'conversion',
        event_label: `checklist_${lang}`,
      })
    }
    window.print()
  }

  return (
    <div
      data-newsletter
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        marginTop: '1.5rem',
        padding: '1.25rem',
        border: '2px solid #000',
        boxShadow: '4px 4px 0 #000',
        background: '#FAFBF3',
      }}
    >
      {status === 'done' ? (
        <p style={{ fontWeight: 700, color: '#2F6451', fontSize: '0.9rem' }}>{t.success}</p>
      ) : (
        <form onSubmit={handleEmail} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px', flexWrap: 'wrap' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            style={{
              flex: '1 1 200px',
              border: '2px solid #000',
              padding: '0.6rem 0.85rem',
              fontSize: '0.875rem',
              fontFamily: "'Barlow', sans-serif",
              outline: 'none',
              background: '#fff',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              background: '#2F6451',
              color: '#FAFBF3',
              border: '2px solid #000',
              padding: '0.6rem 1rem',
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '2px 2px 0 #000',
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'loading' ? t.btnLoading : t.btn}
          </button>
        </form>
      )}

      <button
        onClick={handlePrint}
        style={{
          background: '#FAFBF3',
          color: '#000',
          border: '2px solid #000',
          padding: '0.6rem 1rem',
          fontFamily: "'Sherika', sans-serif",
          fontWeight: 700,
          fontSize: '0.82rem',
          cursor: 'pointer',
          boxShadow: '2px 2px 0 #000',
          whiteSpace: 'nowrap',
        }}
      >
        🖨 {t.print}
      </button>
    </div>
  )
}

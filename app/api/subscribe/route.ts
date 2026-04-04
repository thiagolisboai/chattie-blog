import { NextRequest, NextResponse } from 'next/server'

// Connect your email provider here.
// Supported options: Beehiiv, ConvertKit, Mailchimp, Loops, etc.
// Set NEWSLETTER_API_KEY and NEWSLETTER_LIST_ID in your Vercel environment variables.

export async function POST(req: NextRequest) {
  const { email, lang } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // ── Beehiiv integration (uncomment when ready) ──────────────────────────
  // const publicationId = process.env.BEEHIIV_PUBLICATION_ID
  // const apiKey = process.env.BEEHIIV_API_KEY
  // if (publicationId && apiKey) {
  //   const res = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
  //     body: JSON.stringify({ email, reactivate_existing: true, send_welcome_email: true, utm_source: 'blog', utm_medium: 'inline', custom_fields: [{ name: 'lang', value: lang }] }),
  //   })
  //   if (!res.ok) return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  //   return NextResponse.json({ ok: true })
  // }

  // ── ConvertKit integration (uncomment when ready) ────────────────────────
  // const formId = process.env.CONVERTKIT_FORM_ID
  // const apiKey = process.env.CONVERTKIT_API_KEY
  // if (formId && apiKey) {
  //   const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ api_key: apiKey, email, fields: { lang } }),
  //   })
  //   if (!res.ok) return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  //   return NextResponse.json({ ok: true })
  // }

  // Placeholder response — remove once a provider is configured
  console.log(`[subscribe] ${email} (${lang}) — no provider configured yet`)
  return NextResponse.json({ ok: true })
}

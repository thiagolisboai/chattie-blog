import type { Metadata } from 'next'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { ChecklistDownload } from '@/components/checklist-download'
import { HowToSchema } from '@/components/howto-schema'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'

export const metadata: Metadata = {
  title: '12 LinkedIn B2B Message Templates | Chattie',
  description: '12 ready-to-use LinkedIn message templates for B2B prospecting: connection requests, first messages, follow-ups, and re-engagement. Free.',
  alternates: {
    canonical: 'https://trychattie.com/resources/linkedin-connection-templates',
  },
}

const sections = [
  {
    title: '1. Connection Request',
    color: '#66BAC6',
    templates: [
      {
        label: 'Template A — ICP Discovery',
        text: 'Hey [Name], I saw you\'re [title] at [company] — I work with [founders/SDRs/revenue leaders] who [relevant context]. Would love to connect.',
      },
      {
        label: 'Template B — Shared Content',
        text: 'Hey [Name], I read your post on [topic] and really agreed with [specific point]. I work with similar companies — figured it made sense to connect.',
      },
      {
        label: 'Template C — Mutual Connection',
        text: 'Hey [Name], we\'re both connected with [mutual name] and I work with [your ICP]. Thought it would make sense to connect as well.',
      },
    ],
  },
  {
    title: '2. First Message After Connecting',
    color: '#E4C1F9',
    templates: [
      {
        label: 'Template A — Problem-Solution',
        text: 'Hey [Name], thanks for connecting. I work with [specific profile] who often deal with [problem]. Curious — is that something relevant for you right now?',
      },
      {
        label: 'Template B — Value Content',
        text: 'Hey [Name], saw that you work with [context]. I just put out a guide on [relevant topic] — might be useful. Let me know if you\'d like the link.',
      },
      {
        label: 'Template C — Event Trigger',
        text: 'Hey [Name], saw the news about [company event/hire/launch]. Congrats — that\'s a big move. I work with companies at similar inflection points. If it ever makes sense to chat, I\'m here.',
      },
    ],
  },
  {
    title: '3. Follow-Up Messages',
    color: '#F4B13F',
    templates: [
      {
        label: 'Follow-Up 1 — Day 5, Add Value',
        text: 'Hey [Name], just wanted to share [data point/insight/article] that I thought was relevant for people working in [context]. No action needed — just thought it might be useful.',
      },
      {
        label: 'Follow-Up 2 — Day 10, Reframe',
        text: 'Hey [Name], tried once before — totally get it if the timing\'s off. Quick question: is [specific problem] something you\'re actively working on right now, or is it not a priority at the moment?',
      },
      {
        label: 'Follow-Up 3 — Day 14, Break-Up',
        text: 'Hey [Name], last one from me. If this isn\'t the right time, no worries at all — I can circle back down the road. Just let me know either way.',
      },
    ],
  },
  {
    title: '4. Re-engagement Messages',
    color: '#B7C3B0',
    templates: [
      {
        label: 'Template A — Time Has Passed',
        text: 'Hey [Name], it\'s been [time] since we last talked. [Relevant news/change about their company]. Still makes sense to chat?',
      },
      {
        label: 'Template B — New Context',
        text: 'Hey [Name], we connected before but the timing wasn\'t right. Since then, [something has changed on our end]. Worth a quick call?',
      },
      {
        label: 'Template C — New Content',
        text: 'Hey [Name], I thought of you when I published [new content on a relevant topic]. Figured it might be useful. How\'s everything going?',
      },
    ],
  },
]

function highlightBrackets(text: string) {
  const parts = text.split(/(\[[^\]]+\])/)
  return parts.map((part, i) =>
    part.startsWith('[') && part.endsWith(']') ? (
      <span
        key={i}
        style={{
          color: '#2F6451',
          fontWeight: 700,
          background: 'rgba(47,100,81,0.08)',
          borderRadius: 2,
          padding: '0 2px',
        }}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function LinkedInConnectionTemplatesPage() {
  return (
    <>
      <HowToSchema
        name="LinkedIn Connection Message Templates"
        description="12 ready-to-use templates for connection, outreach, follow-up, and re-engagement on LinkedIn B2B."
        url="https://trychattie.com/resources/linkedin-connection-templates"
        totalTime="PT10M"
        steps={[
          { name: 'Choose the template for your conversation stage', text: 'Use connection templates for new contacts, outreach after acceptance, follow-up for no reply, and re-engagement for cold leads.' },
          { name: 'Personalize with prospect profile data', text: 'Replace bracketed fields with real information: name, company, role, recent posts.' },
          { name: 'Adjust tone to the prospect profile', text: 'C-level requires more direct language. Founders respond well to peers. SDRs prefer technical context.' },
          { name: 'Send manually on LinkedIn', text: 'Paste the template in the message box and review before sending — never use automation for mass outreach.' },
        ]}
      />
      <BreadcrumbSchema items={[
        { name: 'Blog', url: 'https://trychattie.com/blog' },
        { name: 'Resources', url: 'https://trychattie.com/resources/linkedin-connection-templates' },
        { name: 'LinkedIn Connection Templates', url: 'https://trychattie.com/resources/linkedin-connection-templates' },
      ]} />
      <BlogNav lang="en" />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <p
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 700,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              color: '#2F6451',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ display: 'inline-block', width: 14, height: 2, background: 'currentColor' }} />
            Free resource
          </p>
          <h1
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            LinkedIn B2B<br />Message Templates
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#555', lineHeight: 1.65, maxWidth: 560 }}>
            12 ready-to-use templates for consultative B2B prospecting on LinkedIn.
          </p>

          <ChecklistDownload lang="en" />
        </div>

        {/* Template sections */}
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: '2.5rem' }}>
            {/* Section header */}
            <div
              style={{
                borderLeft: '4px solid #2F6451',
                paddingLeft: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              <h2
                style={{
                  fontFamily: "'Sherika', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {section.title}
              </h2>
            </div>

            {/* Templates */}
            {section.templates.map((tpl) => (
              <div
                key={tpl.label}
                style={{
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0 #000',
                  background: '#fff',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Sherika', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#2F6451',
                    marginBottom: '0.6rem',
                  }}
                >
                  {tpl.label}
                </p>
                <p
                  style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    margin: 0,
                    color: '#1a1a1a',
                  }}
                >
                  {highlightBrackets(tpl.text)}
                </p>
              </div>
            ))}
          </div>
        ))}

        {/* Bottom CTA */}
        <div
          className="card-brutalist"
          style={{ background: '#E57B33', color: '#FAFBF3', padding: '2rem', marginTop: '3rem' }}
        >
          <p
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: '1.25rem',
              marginBottom: '0.5rem',
            }}
          >
            Want to know when each message gets read?
          </p>
          <p style={{ marginBottom: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
            Chattie tracks opens, replies, and conversation context — all without leaving LinkedIn.
          </p>
          <a
            href="https://trychattie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta-post"
          >
            Try Chattie →
          </a>
        </div>
      </main>

      <style>{`
        @media print {
          nav, footer, .btn-cta-post, [data-newsletter] { display: none !important; }
          body { background: white; }
          main { padding: 1rem !important; max-width: 100% !important; }
          [style*="boxShadow"] { box-shadow: none !important; }
        }
      `}</style>

      <BlogFooter lang="en" />
    </>
  )
}

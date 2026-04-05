import type { Metadata } from 'next'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { ChecklistDownload } from '@/components/checklist-download'
import { HowToSchema } from '@/components/howto-schema'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'

export const metadata: Metadata = {
  title: 'LinkedIn B2B Follow-Up Script: 4-Week Cadence | Chattie',
  description: 'Complete LinkedIn B2B follow-up script: 4-week cadence with templates for each stage. Stop losing deals to the follow-up gap. Free.',
  alternates: {
    canonical: 'https://trychattie.com/resources/linkedin-followup-script',
  },
}

const cadenceSteps = [
  {
    day: 'Day 1',
    tag: 'Connection accepted',
    color: '#66BAC6',
    heading: 'First message',
    description: 'Thank them for connecting without pitching. Open with a genuine observation or a low-commitment question. The goal is to start a conversation, not close a deal.',
    script: 'Hey [Name], thanks for connecting. I noticed you work with [relevant context from profile] — that\'s an area I spend a lot of time in. Quick question: is [specific problem] something you\'re actively thinking about right now?',
    tip: 'If the lead recently commented on something or published a post, mention it here. Personalization beats any template.',
  },
  {
    day: 'Days 3–5',
    tag: 'Follow-Up 1',
    color: '#E4C1F9',
    heading: 'Add value, don\'t chase',
    description: 'If there\'s no reply, come back with a different angle: a data point, an article, or a perspective that\'s genuinely useful for their profile. Never start with "Just following up..." or "Circling back...".',
    script: 'Hey [Name], wanted to share [data/article/insight] that I thought was relevant for people working in [lead\'s context]. No action needed — just figured it might be useful.',
    tip: 'The best value-add follow-up is one the lead would have saved even if they weren\'t buying from you.',
  },
  {
    day: 'Days 7–10',
    tag: 'Follow-Up 2',
    color: '#F4B13F',
    heading: 'Reframe — ask a direct question',
    description: 'On the second attempt, change the angle. Don\'t repeat your previous argument. Ask a more direct question about the problem — it forces a yes-or-no answer and clarifies real interest.',
    script: 'Hey [Name], tried once before — totally understand if things are busy. Quick question: is [specific problem] something you\'re prioritizing right now, or is it genuinely not the right moment?',
    tip: 'Questions that accept "no" as a valid answer generate more honest replies than questions that only admit "yes".',
  },
  {
    day: 'Day 14',
    tag: 'Follow-Up 3',
    color: '#B7C3B0',
    heading: 'Break-up — close the loop with respect',
    description: 'Three attempts with no reply is the market standard. Close the cycle graciously and leave the door open. No frustration, no guilt-tripping. A well-written break-up message often gets a response.',
    script: 'Hey [Name], last one from me. If this isn\'t the right time, no worries at all — I can revisit down the road. Just let me know either way.',
    tip: 'Nearly 30% of well-written break-up messages get a reply. Silence is rarely rejection — it\'s usually timing.',
  },
  {
    day: 'Days 30–45',
    tag: 'Re-engagement',
    color: '#2F6451',
    heading: 'New context, new approach',
    description: 'If the lead didn\'t reply but also didn\'t ask you to stop, wait 30–45 days and return with a new context: a product update, a new case study, news about their company, or a piece of content you published.',
    script: 'Hey [Name], it\'s been a while since I last reached out. Saw that [relevant news/change about their company] — and on our end, [something has also changed]. Still worth exploring a quick call?',
    tip: 'Re-engagement works best when there\'s a genuine reason to come back. Without a real trigger, skip this step.',
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

export default function LinkedInFollowUpScriptPage() {
  return (
    <>
      <HowToSchema
        name="LinkedIn Follow-Up Script for B2B"
        description="4-week follow-up cadence with ready-made scripts for LinkedIn B2B outreach without being annoying."
        url="https://trychattie.com/resources/linkedin-followup-script"
        totalTime="PT20M"
        steps={[
          { name: 'Week 1 — First contact', text: 'Send a personalized connection invite without pitch, referencing something specific from the prospect profile.' },
          { name: 'Week 2 — Follow-up with value', text: 'Share a relevant data point, article, or insight for the prospect\'s problem. Do not repeat the previous approach.' },
          { name: 'Week 3 — Social proof', text: 'Mention a result from a similar customer and ask a low-commitment question.' },
          { name: 'Week 4 — Clarity or pause', text: 'Ask if it makes sense to reconnect now or if it\'s better to come back another time. Respect the response.' },
        ]}
      />
      <BreadcrumbSchema items={[
        { name: 'Blog', url: 'https://trychattie.com/blog' },
        { name: 'Resources', url: 'https://trychattie.com/resources/linkedin-followup-script' },
        { name: 'LinkedIn Follow-Up Script', url: 'https://trychattie.com/resources/linkedin-followup-script' },
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
            LinkedIn B2B<br />Follow-Up Script
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#555', lineHeight: 1.65, maxWidth: 560 }}>
            A 4-week follow-up cadence with scripts for each stage — never lose a lead to silence again.
          </p>

          <ChecklistDownload lang="en" />
        </div>

        {/* Philosophy note */}
        <div
          style={{
            border: '2px solid #000',
            boxShadow: '4px 4px 0 #000',
            background: '#FAFBF3',
            padding: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          <p
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.75rem',
            }}
          >
            Why most B2B deals die in the follow-up gap
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#333', marginBottom: '0.75rem' }}>
            Most B2B sellers give up after the first or second unanswered message. The problem is that most buying decisions require between 5 and 8 touchpoints before moving forward.
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#333', margin: 0 }}>
            This cadence solves that: each stage has a different angle, a different level of commitment, and a script adapted to the lead&apos;s timing.
          </p>
        </div>

        {/* Cadence steps */}
        {cadenceSteps.map((step, index) => (
          <div key={step.day} style={{ marginBottom: '2rem' }}>
            {/* Step header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  background: step.color,
                  border: '2px solid #000',
                  padding: '0.3rem 0.75rem',
                  fontFamily: "'Sherika', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.day}
              </div>
              <div
                style={{
                  fontFamily: "'Sherika', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#2F6451',
                }}
              >
                {step.tag}
              </div>
            </div>

            {/* Step card */}
            <div
              style={{
                border: '2px solid #000',
                boxShadow: '4px 4px 0 #000',
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <div
                style={{
                  background: step.color,
                  borderBottom: '2px solid #000',
                  padding: '0.75rem 1.25rem',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Sherika', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    margin: 0,
                  }}
                >
                  {step.heading}
                </p>
              </div>

              <div style={{ background: '#FAFBF3', padding: '1.25rem' }}>
                {/* Description */}
                <p
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    color: '#444',
                    marginBottom: '1.25rem',
                  }}
                >
                  {step.description}
                </p>

                {/* Script */}
                <div
                  style={{
                    border: '2px solid #000',
                    boxShadow: '4px 4px 0 #000',
                    background: '#fff',
                    padding: '1rem 1.25rem',
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
                      marginBottom: '0.5rem',
                    }}
                  >
                    Script
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
                    {highlightBrackets(step.script)}
                  </p>
                </div>

                {/* Tip */}
                <p
                  style={{
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    color: '#666',
                    margin: 0,
                    paddingLeft: '0.875rem',
                    borderLeft: '3px solid #2F6451',
                    fontStyle: 'italic',
                  }}
                >
                  {step.tip}
                </p>
              </div>
            </div>

            {/* Connector line between steps (except last) */}
            {index < cadenceSteps.length - 1 && (
              <div
                style={{
                  width: 2,
                  height: 24,
                  background: '#ccc',
                  margin: '0 auto',
                }}
              />
            )}
          </div>
        ))}

        {/* When to stop */}
        <div
          style={{
            border: '2px solid #000',
            boxShadow: '4px 4px 0 #000',
            background: '#FAFBF3',
            padding: '1.5rem',
            marginTop: '1rem',
            marginBottom: '3rem',
          }}
        >
          <p
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: '1rem',
              marginBottom: '1rem',
              borderLeft: '4px solid #E57B33',
              paddingLeft: '0.75rem',
            }}
          >
            When to stop
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              fontSize: '0.875rem',
              lineHeight: 1.7,
              color: '#333',
            }}
          >
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>3 follow-ups</strong> with no reply = market standard. Send the break-up and archive.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>4 follow-ups</strong> = absolute maximum. Only if you have a genuine trigger (news, event, job change).
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>They asked you to stop?</strong> Stop immediately, mark as inactive, never return.
            </li>
            <li>
              <strong>Negative reply?</strong> Thank them, ask if you can check back in [X months], and respect their answer.
            </li>
          </ul>
        </div>

        {/* Bottom CTA */}
        <div
          className="card-brutalist"
          style={{ background: '#E57B33', color: '#FAFBF3', padding: '2rem', marginTop: '1rem' }}
        >
          <p
            style={{
              fontFamily: "'Sherika', sans-serif",
              fontWeight: 900,
              fontSize: '1.25rem',
              marginBottom: '0.5rem',
            }}
          >
            Want Chattie to run this cadence for you?
          </p>
          <p style={{ marginBottom: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
            Chattie organizes your leads, reminds you of pending follow-ups, and keeps the context of every conversation — no spreadsheet or photographic memory required.
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

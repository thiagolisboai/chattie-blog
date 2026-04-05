import type { Metadata } from 'next'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { ChecklistDownload } from '@/components/checklist-download'
import { HowToSchema } from '@/components/howto-schema'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'

export const metadata: Metadata = {
  title: 'LinkedIn Prospecting Checklist | Chattie',
  description: '30-point LinkedIn B2B prospecting checklist: profile, outreach, follow-up and tools. Free download.',
  alternates: {
    canonical: 'https://trychattie.com/resources/linkedin-prospecting-checklist',
    languages: {
      en: 'https://trychattie.com/resources/linkedin-prospecting-checklist',
      'x-default': 'https://trychattie.com/resources/linkedin-prospecting-checklist',
      'pt-BR': 'https://trychattie.com/pt-br/recursos/checklist-prospeccao-linkedin',
    },
  },
}

const sections = [
  {
    title: '1. Profile as a commercial asset',
    color: '#66BAC6',
    items: [
      'Professional photo, good lighting, neutral background',
      'Banner communicates value proposition visually',
      'Headline: "I help [profile] achieve [outcome]" (not just job title)',
      '"About" section in first person, focused on the client',
      'Active featured link (website, calendar, or resource)',
      'Recent experience with concrete results listed',
    ],
  },
  {
    title: '2. ICP definition',
    color: '#E4C1F9',
    items: [
      'Job title and seniority level defined',
      'Industry and company size mapped',
      'Specific pain you solve identified',
      'Buying triggers known (growth, role change, new budget)',
      'Validated company fit profile (at least 3 current clients)',
    ],
  },
  {
    title: '3. Outreach and first contact',
    color: '#F4B13F',
    items: [
      'Researched the profile before connecting',
      'Connection request includes specific context (not blank)',
      'Waited for acceptance before sending a message',
      'First message is NOT a pitch — opens with observation or question',
      'Message mentions something specific from their profile or recent post',
      'First message CTA is low commitment (question, not a meeting request)',
    ],
  },
  {
    title: '4. Follow-up cadence',
    color: '#B7C3B0',
    items: [
      '1st follow-up: 3–5 days after connection with no reply',
      '2nd follow-up: 7–10 days with a new angle or value',
      '3rd follow-up: 14 days — breakup or channel switch',
      'Each follow-up references the previous message',
      'No follow-up starts with "Just checking in…"',
      'Stopped after 3 attempts with no response',
    ],
  },
  {
    title: '5. Organisation and tools',
    color: '#E57B33',
    items: [
      'System in place to track every active conversation',
      'Know what stage each lead is at (new, engaged, negotiation, cold)',
      'Not relying on memory or a standalone spreadsheet',
      'Active reminder for every pending follow-up',
      'Can see who is awaiting a reply in under 30 seconds',
      'Using a social CRM (like Chattie) to maintain context',
    ],
  },
  {
    title: '6. Content supporting prospecting',
    color: '#2F6451',
    items: [
      'Publishing 2–3× per week with ICP-relevant content',
      "Engaging on prospects' posts before reaching out directly",
      'Using substantive comments to build familiarity',
      'Sharing case studies, learnings, and opinions — not just promotions',
    ],
  },
]

export default function ChecklistPage() {
  return (
    <>
      <HowToSchema
        name="LinkedIn B2B Prospecting Checklist"
        description="30-point checklist to optimize your profile, outreach, follow-up, and tools on LinkedIn."
        url="https://trychattie.com/resources/linkedin-prospecting-checklist"
        totalTime="PT15M"
        steps={[
          { name: 'Profile as a commercial asset', text: 'Optimize photo, banner, headline and About section to communicate value to your ideal buyer.' },
          { name: 'Define your ICP', text: 'Map job title, industry, company size, specific pain point, and buying triggers.' },
          { name: 'Research your prospect', text: 'Before connecting, review recent posts, job history, and company context.' },
          { name: 'Personalized connection note', text: 'Send a 2–3 line note with specific context — never a blank invite or pitch.' },
          { name: 'First message after connection', text: 'Start with a relevant question about their context, not an offer.' },
          { name: 'Follow-up cadence', text: 'Apply 3–5 follow-ups spaced at days 3, 7, and 14 with different value in each touch.' },
        ]}
      />
      <BreadcrumbSchema items={[
        { name: 'Blog', url: 'https://trychattie.com/blog' },
        { name: 'Resources', url: 'https://trychattie.com/resources/linkedin-prospecting-checklist' },
        { name: 'LinkedIn Prospecting Checklist', url: 'https://trychattie.com/resources/linkedin-prospecting-checklist' },
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
            LinkedIn Prospecting<br />Checklist
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#555', lineHeight: 1.65, maxWidth: 560 }}>
            30 points to audit your LinkedIn prospecting process — from profile to follow-up. Use as a weekly guide or review before each campaign.
          </p>

          <ChecklistDownload lang="en" />
        </div>

        {/* Checklist sections */}
        {sections.map((section) => (
          <div
            key={section.title}
            style={{
              border: '2px solid #000',
              boxShadow: '4px 4px 0 #000',
              marginBottom: '1.5rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: section.color,
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
                {section.title}
              </p>
            </div>
            <div style={{ background: '#FAFBF3' }}>
              {section.items.map((item, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.7rem 1.25rem',
                    borderBottom: i < section.items.length - 1 ? '1px solid #e8e8e0' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      marginTop: '0.15rem',
                      width: 16,
                      height: 16,
                      flexShrink: 0,
                      cursor: 'pointer',
                      accentColor: '#2F6451',
                    }}
                  />
                  {item}
                </label>
              ))}
            </div>
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
            Want Chattie to handle items 4 and 5 for you?
          </p>
          <p style={{ marginBottom: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
            Follow-up, lead organisation and conversation history — on autopilot.
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
        }
      `}</style>

      <BlogFooter lang="en" />
    </>
  )
}

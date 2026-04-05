import type { Metadata } from 'next'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { ChecklistDownload } from '@/components/checklist-download'
import { HowToSchema } from '@/components/howto-schema'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'

export const metadata: Metadata = {
  title: '12 Templates de Mensagem para LinkedIn B2B | Chattie',
  description: '12 templates prontos para prospecção no LinkedIn B2B: pedido de conexão, primeira mensagem, follow-up e reativação de leads. Gratuito.',
  alternates: {
    canonical: 'https://trychattie.com/pt-br/recursos/templates-mensagem-linkedin',
  },
}

const sections = [
  {
    title: '1. Pedido de Conexão',
    color: '#66BAC6',
    templates: [
      {
        label: 'Template A — Descoberta de ICP',
        text: 'Oi [Nome], vi que você é [cargo] na [empresa] — trabalho com [founders/SDRs/gestores] que [contexto relevante]. Faz sentido nos conectarmos.',
      },
      {
        label: 'Template B — Conteúdo compartilhado',
        text: 'Oi [Nome], li seu post sobre [tema] e concordo com [ponto específico]. Tenho trabalhado com empresas similares — vale a conexão.',
      },
      {
        label: 'Template C — Conexão em comum',
        text: 'Oi [Nome], estamos conectados com [nome em comum] e trabalho com [seu ICP]. Achei que faria sentido nos conectarmos também.',
      },
    ],
  },
  {
    title: '2. Primeira Mensagem Pós-Conexão',
    color: '#E4C1F9',
    templates: [
      {
        label: 'Template A — Problema-solução',
        text: 'Olá [Nome], obrigado pela conexão. Trabalho com [perfil específico] que normalmente enfrenta [problema]. Curioso — isso é algo relevante pra você hoje?',
      },
      {
        label: 'Template B — Conteúdo de valor',
        text: 'Olá [Nome], vi que você trabalha com [contexto]. Acabei de publicar um guia sobre [tema relevante] — pode ser útil. Me avisa se quiser o link.',
      },
      {
        label: 'Template C — Gatilho de evento',
        text: 'Olá [Nome], vi a notícia sobre [evento/contratação/lançamento da empresa]. Parabéns. Trabalho com empresas em momentos similares — se fizer sentido falar, estou por aqui.',
      },
    ],
  },
  {
    title: '3. Follow-Up',
    color: '#F4B13F',
    templates: [
      {
        label: 'Follow-Up 1 — 5 dias, valor',
        text: 'Oi [Nome], só passando para compartilhar [dado/insight/artigo] que achei relevante para quem trabalha com [contexto]. Qualquer dúvida, estou por aqui.',
      },
      {
        label: 'Follow-Up 2 — 10 dias, perspectiva diferente',
        text: 'Oi [Nome], tentei uma vez antes — entendo que a agenda aperta. Uma pergunta rápida: [problema específico] é algo que você está priorizando hoje, ou não é o momento?',
      },
      {
        label: 'Follow-Up 3 — 14 dias, breakup',
        text: 'Oi [Nome], última tentativa. Se não faz sentido agora, sem problema — posso guardar para outro momento. Só me diz.',
      },
    ],
  },
  {
    title: '4. Reativação de Lead Frio',
    color: '#B7C3B0',
    templates: [
      {
        label: 'Template A — Tempo',
        text: 'Oi [Nome], faz [tempo] desde nossa última troca. [Notícia/mudança relevante sobre a empresa deles]. Ainda faz sentido conversar?',
      },
      {
        label: 'Template B — Novo contexto',
        text: 'Oi [Nome], já conversamos antes mas o timing não estava certo. Desde então [algo mudou no produto/empresa]. Vale uma conversa rápida?',
      },
      {
        label: 'Template C — Conteúdo novo',
        text: 'Oi [Nome], lembrei de você ao publicar [novo conteúdo sobre tema relevante]. Achei que poderia ser útil. Tudo bem por aí?',
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

export default function TemplatesMensagemPage() {
  return (
    <>
      <HowToSchema
        name="Templates de Mensagem para LinkedIn B2B"
        description="12 templates prontos para conexão, abordagem, follow-up e reengajamento no LinkedIn B2B."
        url="https://trychattie.com/pt-br/recursos/templates-mensagem-linkedin"
        totalTime="PT10M"
        steps={[
          { name: 'Escolha o template pelo estágio da conversa', text: 'Use templates de conexão para novos contatos, abordagem para após aceite, follow-up para sem resposta e reengajamento para leads frios.' },
          { name: 'Personalize com dados do perfil do lead', text: 'Substitua os campos entre colchetes com informações reais: nome, empresa, cargo, posts recentes do lead.' },
          { name: 'Ajuste o tom ao perfil do prospect', text: 'C-level exige linguagem mais direta. Founders respondem bem a pares. SDRs preferem contexto técnico.' },
          { name: 'Envie manualmente no LinkedIn', text: 'Cole o template na caixa de mensagem e revise antes de enviar — nunca use automação para disparos em massa.' },
        ]}
      />
      <BreadcrumbSchema items={[
        { name: 'Blog', url: 'https://trychattie.com/pt-br/blog' },
        { name: 'Recursos', url: 'https://trychattie.com/pt-br/recursos/templates-mensagem-linkedin' },
        { name: 'Templates de Mensagem LinkedIn', url: 'https://trychattie.com/pt-br/recursos/templates-mensagem-linkedin' },
      ]} />
      <BlogNav lang="pt-BR" />

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
            Recurso gratuito
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
            Templates de Mensagem<br />para LinkedIn B2B
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#555', lineHeight: 1.65, maxWidth: 560 }}>
            12 templates prontos para usar em prospecção consultiva. Copie, adapte ao seu contexto e use.
          </p>

          <ChecklistDownload lang="pt-BR" />
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
            Quer saber quando cada template foi lido?
          </p>
          <p style={{ marginBottom: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
            O Chattie registra abertura, resposta e contexto de cada conversa — sem sair do LinkedIn.
          </p>
          <a
            href="https://trychattie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta-post"
          >
            Testar o Chattie →
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

      <BlogFooter lang="pt-BR" />
    </>
  )
}

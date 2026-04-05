import type { Metadata } from 'next'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { ChecklistDownload } from '@/components/checklist-download'
import { HowToSchema } from '@/components/howto-schema'
import { BreadcrumbSchema } from '@/components/breadcrumb-schema'

export const metadata: Metadata = {
  title: 'Script de Follow-Up no LinkedIn B2B | Cadência de 4 Semanas | Chattie',
  description: 'Script completo de follow-up para LinkedIn B2B: cadência de 4 semanas com templates por etapa para nunca perder um lead por falta de acompanhamento.',
  alternates: {
    canonical: 'https://trychattie.com/pt-br/recursos/script-follow-up-linkedin',
  },
}

const cadenceSteps = [
  {
    day: 'Dia 1',
    tag: 'Conexão aceita',
    color: '#66BAC6',
    heading: 'Primeira mensagem',
    description: 'Agradeça a conexão sem pitch. Abra com uma observação genuína ou uma pergunta de baixo comprometimento. O objetivo é iniciar conversa, não fechar negócio.',
    script: 'Olá [Nome], obrigado pela conexão. Vi que você trabalha com [contexto relevante do perfil] — é uma área em que trabalho bastante. Tenho curiosidade: [problema específico] é algo que está na sua lista de prioridades agora?',
    tip: 'Se o lead comentou algo recente ou publicou um post, mencione isso aqui. Personalização supera qualquer template.',
  },
  {
    day: 'Dias 3–5',
    tag: 'Follow-Up 1',
    color: '#E4C1F9',
    heading: 'Adicione valor sem cobrar resposta',
    description: 'Se não houve resposta, volte com um ângulo diferente: um dado, um artigo ou uma perspectiva que seja genuinamente útil para o perfil do lead. Não comece com "Só passando para verificar...".',
    script: 'Oi [Nome], só passando para compartilhar [dado/artigo/insight] que achei relevante para quem trabalha com [contexto do lead]. Sem necessidade de resposta — só achei que poderia ser útil.',
    tip: 'O melhor follow-up de valor é aquele que o lead teria guardado mesmo se não fosse para comprar de você.',
  },
  {
    day: 'Dias 7–10',
    tag: 'Follow-Up 2',
    color: '#F4B13F',
    heading: 'Mude o ângulo, faça uma pergunta direta',
    description: 'Na segunda tentativa, mude a perspectiva. Não repita o argumento anterior. Faça uma pergunta mais direta sobre o problema — ela força uma resposta de sim ou não e clarifica o interesse real.',
    script: 'Oi [Nome], tentei uma vez antes — entendo que a agenda aperta. Uma pergunta rápida: [problema específico] é algo que você está priorizando agora, ou genuinamente não é o momento?',
    tip: 'Perguntas que admitem "não" como resposta válida geram mais respostas honestas do que perguntas que só admitem "sim".',
  },
  {
    day: 'Dia 14',
    tag: 'Follow-Up 3',
    color: '#B7C3B0',
    heading: 'Breakup — encerre com respeito',
    description: 'Três tentativas sem resposta é o padrão. Feche o ciclo com educação e abertura para o futuro. Não demonstre frustração. Um "breakup" bem feito frequentemente gera respostas.',
    script: 'Oi [Nome], última tentativa da minha parte. Se não faz sentido agora, sem problema nenhum — posso guardar para outro momento. Só me avisa, de qualquer jeito.',
    tip: 'Quase 30% dos breakups bem escritos recebem resposta. O silêncio raramente é rejeição — é timing.',
  },
  {
    day: 'Dias 30–45',
    tag: 'Reativação',
    color: '#2F6451',
    heading: 'Novo contexto, nova abordagem',
    description: 'Se o lead não respondeu mas também não pediu para parar, aguarde 30 a 45 dias e volte com um contexto novo: mudança de produto, novo case, notícia sobre a empresa deles ou conteúdo recente.',
    script: 'Oi [Nome], faz um tempo desde nossa última tentativa de conversa. Vi que [notícia/mudança relevante sobre a empresa deles] — e desde então [algo mudou no nosso lado também]. Ainda faz sentido explorar uma conversa?',
    tip: 'A reativação funciona melhor quando há um motivo genuíno para voltar. Sem gatilho real, pule esta etapa.',
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

export default function ScriptFollowUpPage() {
  return (
    <>
      <HowToSchema
        name="Script de Follow-up no LinkedIn B2B"
        description="Cadência de 4 semanas com scripts prontos para follow-up no LinkedIn B2B sem parecer chato."
        url="https://trychattie.com/pt-br/recursos/script-follow-up-linkedin"
        totalTime="PT20M"
        steps={[
          { name: 'Semana 1 — Primeiro contato', text: 'Envie convite personalizado sem pitch, referenciando algo específico do perfil do lead.' },
          { name: 'Semana 2 — Follow-up com valor', text: 'Compartilhe dado, artigo ou insight relevante para o problema do lead. Não repita a abordagem anterior.' },
          { name: 'Semana 3 — Prova social', text: 'Mencione resultado de cliente similar e faça uma pergunta de baixo comprometimento.' },
          { name: 'Semana 4 — Clareza ou pausa', text: 'Pergunte se faz sentido retomar agora ou se é melhor voltar em outro momento. Respeite a resposta.' },
        ]}
      />
      <BreadcrumbSchema items={[
        { name: 'Blog', url: 'https://trychattie.com/pt-br/blog' },
        { name: 'Recursos', url: 'https://trychattie.com/pt-br/recursos/script-follow-up-linkedin' },
        { name: 'Script de Follow-up LinkedIn', url: 'https://trychattie.com/pt-br/recursos/script-follow-up-linkedin' },
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
            Script de Follow-Up<br />no LinkedIn B2B
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#555', lineHeight: 1.65, maxWidth: 560 }}>
            Cadência de 4 semanas com scripts por etapa para nunca perder um lead por falta de acompanhamento.
          </p>

          <ChecklistDownload lang="pt-BR" />
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
            Por que a maioria dos deals B2B morre no follow-up
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#333', marginBottom: '0.75rem' }}>
            A maioria dos vendedores B2B abandona o lead após a primeira ou segunda tentativa sem resposta. O problema é que a maioria das decisões de compra exige entre 5 e 8 pontos de contato antes de avançar.
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#333', margin: 0 }}>
            Esta cadência resolve isso: cada etapa tem um ângulo diferente, um nível de comprometimento diferente e um script adaptado ao timing do lead.
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

        {/* Quando parar */}
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
            Quando parar
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
              <strong>3 follow-ups</strong> sem resposta = padrão de mercado. Encerre com um breakup e arquive.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>4 follow-ups</strong> = máximo absoluto. Só se você tiver um gatilho real (notícia, evento, mudança de cargo).
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Pediu para parar?</strong> Pare imediatamente e marque como inativo. Nunca volte.
            </li>
            <li>
              <strong>Respondeu negativamente?</strong> Agradeça, pergunte se pode voltar em [X meses] e respeite a resposta.
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
            Quer que o Chattie cuide desta cadência por você?
          </p>
          <p style={{ marginBottom: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
            O Chattie organiza seus leads, lembra os follow-ups e mantém o contexto de cada conversa — sem precisar de planilha ou memória fotográfica.
          </p>
          <a
            href="https://trychattie.com/pt-br"
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

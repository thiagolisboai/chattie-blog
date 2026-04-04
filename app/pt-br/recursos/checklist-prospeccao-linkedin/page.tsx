import type { Metadata } from 'next'
import { BlogNav } from '@/components/blog-nav'
import { BlogFooter } from '@/components/blog-footer'
import { ChecklistDownload } from '@/components/checklist-download'

export const metadata: Metadata = {
  title: 'Checklist de Prospecção no LinkedIn | Chattie',
  description: 'Checklist completo de prospecção no LinkedIn B2B: 30 pontos para organizar seu perfil, abordagem, follow-up e ferramentas. Gratuito.',
  alternates: {
    canonical: 'https://trychattie.com/pt-br/recursos/checklist-prospeccao-linkedin',
    languages: {
      'pt-BR': 'https://trychattie.com/pt-br/recursos/checklist-prospeccao-linkedin',
      en: 'https://trychattie.com/resources/linkedin-prospecting-checklist',
      'x-default': 'https://trychattie.com/resources/linkedin-prospecting-checklist',
    },
  },
}

const sections = [
  {
    title: '1. Perfil como ativo comercial',
    color: '#66BAC6',
    items: [
      'Foto profissional, boa iluminação, fundo neutro',
      'Banner comunica proposta de valor visualmente',
      'Headline: "Ajudo [perfil] a [resultado]" (não só cargo)',
      'Seção "Sobre" em primeira pessoa, com foco no cliente',
      'Link de destaque ativo (site, calendário ou material)',
      'Experiências recentes com resultados concretos listados',
    ],
  },
  {
    title: '2. Definição do ICP',
    color: '#E4C1F9',
    items: [
      'Cargo e nível de senioridade definidos',
      'Setor e tamanho de empresa mapeados',
      'Dor específica que você resolve identificada',
      'Gatilhos de compra conhecidos (crescimento, mudança de cargo, novo budget)',
      'Perfil de empresa com fit já validado (ao menos 3 clientes atuais)',
    ],
  },
  {
    title: '3. Abordagem e primeiro contato',
    color: '#F4B13F',
    items: [
      'Pesquisou o perfil antes de conectar',
      'Convite com contexto específico (não em branco)',
      'Aguardou aceite antes de enviar mensagem',
      'Primeira mensagem NÃO é pitch — abre com observação ou pergunta',
      'Mensagem menciona algo específico do perfil ou post recente',
      'CTA da primeira mensagem é de baixo comprometimento (pergunta, não reunião)',
    ],
  },
  {
    title: '4. Cadência de follow-up',
    color: '#B7C3B0',
    items: [
      '1º follow-up: 3–5 dias após conexão sem resposta',
      '2º follow-up: 7–10 dias com novo ângulo ou valor',
      '3º follow-up: 14 dias — breakup ou mudança de canal',
      'Cada follow-up referencia a mensagem anterior',
      'Nenhum follow-up começa com "Só passando para verificar…"',
      'Parou após 3 tentativas sem resposta (respeitou o silêncio)',
    ],
  },
  {
    title: '5. Organização e ferramentas',
    color: '#E57B33',
    items: [
      'Tem um sistema para registrar cada conversa ativa',
      'Sabe em que estágio cada lead está (novo, engajado, negociação, frio)',
      'Não depende de memória ou planilha avulsa',
      'Tem lembrete ativo para cada follow-up pendente',
      'Consegue ver quem está aguardando resposta em menos de 30 segundos',
      'Usa ferramenta de CRM social (como o Chattie) para manter contexto',
    ],
  },
  {
    title: '6. Conteúdo como suporte à prospecção',
    color: '#2F6451',
    items: [
      'Publica 2–3x por semana com conteúdo relevante para o ICP',
      'Engaja nos posts dos prospects antes de abordar diretamente',
      'Usa comentários substantivos para criar familiaridade',
      'Compartilha cases, aprendizados e pontos de vista — não só promoções',
    ],
  },
]

export default function ChecklistPage() {
  return (
    <>
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
            Checklist de Prospecção<br />no LinkedIn B2B
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#555', lineHeight: 1.65, maxWidth: 560 }}>
            30 pontos para auditar seu processo de prospecção — do perfil ao follow-up. Use como guia semanal ou revise antes de cada campanha.
          </p>

          <ChecklistDownload lang="pt-BR" />
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
            Quer que o Chattie cuide dos itens 4 e 5 por você?
          </p>
          <p style={{ marginBottom: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
            Follow-up, organização de leads e histórico de conversa — tudo no piloto automático.
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

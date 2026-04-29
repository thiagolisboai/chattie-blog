import { getAuthor } from '@/lib/authors'

interface ArticleJsonLdProps {
  post: {
    title: string
    description: string
    publishedAt: string
    date: string
    dateModified?: string
    image: string
    imageAlt?: string       // F3.2
    canonicalUrl: string
    author?: string
    authorTitle?: string    // F1.1
    authorLinkedIn?: string // F1.1 — merged into sameAs
    tags?: string[]
    structuredData?: string
    slug?: string
  }
  lang?: string
  /** Raw MDX/markdown content — used to dynamically extract FAQ Q&A when the
   *  slug isn't in the hardcoded FAQ_DATA dictionary (e.g. new Dexter posts). */
  postContent?: string
}

type FaqPair = { q: string; a: string }

/**
 * Extracts FAQ Q&A pairs from raw MDX content.
 * Supports the format: **Question?**\n\nAnswer or **Question?**\nAnswer
 */
function extractFaqFromContent(content: string): FaqPair[] {
  const FAQ_HEADING_RE = /##\s+.*(FAQ|Perguntas|Dúvidas|Respostas|Frequently Asked)/i
  const faqMatch = content.match(FAQ_HEADING_RE)
  if (!faqMatch) return []

  const faqStart = content.indexOf(faqMatch[0])
  let faqSection = content.slice(faqStart + faqMatch[0].length)

  // Stop at next H2 section or horizontal rule
  const nextSectionIdx = faqSection.search(/\n## [^#]|\n---/)
  if (nextSectionIdx !== -1) faqSection = faqSection.slice(0, nextSectionIdx)

  // Split by newline + opening ** (start of each question)
  const blocks = faqSection.split(/\n(?=\*\*[^*\n])/)
  const items: FaqPair[] = []

  for (const block of blocks) {
    const closeStarIdx = block.indexOf('**')
    if (closeStarIdx === -1) continue          // no opening ** — skip heading remnant
    const closeStarEnd = block.indexOf('**', closeStarIdx + 2)
    if (closeStarEnd === -1) continue          // no closing **
    const q = block.slice(closeStarIdx + 2, closeStarEnd).trim()
    const a = block.slice(closeStarEnd + 2).trim().replace(/\n+/g, ' ')
    if (q && a) items.push({ q, a })
  }

  return items
}

// Slugs that get HowTo schema (step-by-step guides)
const HOWTO_SLUGS: Record<string, { steps: string[] }> = {
  // PT-BR
  'follow-up-linkedin-b2b': {
    steps: [
      'Defina a cadência: 1º follow-up em 3-5 dias, 2º em 7-10 dias, 3º em 14 dias',
      'Registre o contexto da última conversa antes de escrever',
      'Abra com referência ao assunto anterior — nunca mande "só passando para verificar"',
      'Adicione valor: compartilhe conteúdo relevante, dado ou insight útil para o lead',
      'Finalize com pergunta aberta de baixo comprometimento',
      'Use o Chattie para automatizar lembretes e manter o histórico organizado',
    ],
  },
  'como-prospectar-clientes-no-linkedin': {
    steps: [
      'Defina seu ICP com clareza: cargo, setor, tamanho de empresa, dor específica',
      'Otimize seu perfil para que ele converta visitas em conexões',
      'Pesquise o lead antes de conectar: leia posts recentes e atividade',
      'Envie convite com contexto específico — nunca convite em branco',
      'Aguarde conexão ser aceita antes de qualquer mensagem de vendas',
      'Inicie conversa com pergunta relevante ao contexto do lead, não com oferta',
      'Mantenha histórico e cadência com CRM social como o Chattie',
    ],
  },
  'como-prospectar-no-linkedin-b2b': {
    steps: [
      'Defina o ICP: cargo, setor, tamanho de empresa, dor específica e sinais de timing',
      'Use filtros do LinkedIn (ou Sales Navigator) para construir lista alinhada ao ICP',
      'Otimize headline e seção "Sobre" para sustentar a abordagem comercial',
      'Conecte com nota específica referenciando post, empresa ou ponto em comum',
      'Envie primeira mensagem com contexto real e pergunta aberta — sem pitch',
      'Siga cadência de follow-up com variação de ângulo a cada 5–14 dias',
      'Qualifique no inbox com 2–3 perguntas antes de propor reunião',
    ],
  },
  'linkedin-para-gerar-leads-qualificados': {
    steps: [
      'Defina critérios de lead qualificado antes de prospectar (ICP)',
      'Filtre prospects no LinkedIn com Sales Navigator ou busca avançada',
      'Conecte com mensagem personalizada baseada no perfil do lead',
      'Inicie conversa com pergunta sobre o problema que você resolve',
      'Qualifique com 2-3 perguntas antes de apresentar a solução',
      'Registre sinais de interesse e agende follow-up sistemático',
    ],
  },
  'linkedin-para-vendas': {
    steps: [
      'Otimize headline e seção "Sobre" para atrair o comprador ideal',
      'Publique conteúdo relevante 3x por semana para construir autoridade',
      'Conecte com decisores do seu ICP com mensagem de contexto',
      'Engaje nos posts dos prospects antes de abordar diretamente',
      'Aborde com valor — compartilhe insight relevante antes de oferecer produto',
      'Mantenha cadência de follow-up com CRM social',
    ],
  },
  // EN
  'linkedin-prospecting-guide': {
    steps: [
      'Define your ICP with precision: job title, company size, industry, specific pain',
      'Optimize your LinkedIn profile to convert prospect visits into connections',
      'Research the prospect: read their recent posts and activity before connecting',
      'Send a personalized connection request with specific context — never a blank invite',
      'Wait for the connection to be accepted before sending any sales message',
      'Open with a relevant question or insight about their specific context — not a pitch',
      'Maintain conversation history and follow-up cadence with a social CRM like Chattie',
    ],
  },
  'linkedin-follow-up-b2b': {
    steps: [
      'Define your cadence: 1st follow-up in 3–5 days, 2nd in 7–10 days, 3rd in 14 days',
      'Review the full context of the last conversation before writing',
      'Open with a reference to the previous topic — never send "just checking in"',
      'Add value: share relevant content, data, or a useful insight for the lead',
      'Close with an open-ended, low-commitment question',
      'Use Chattie to automate reminders and keep conversation history organized',
    ],
  },
  'como-qualificar-leads-no-linkedin-com-ia': {
    steps: [
      'Identifique os 5 sinais de prontidão de compra: atividade recente no perfil, mudança de cargo, engajamento com seu conteúdo, pergunta direta e velocidade de resposta',
      'Classifique cada prospect em três tiers: Cold (1 sinal), Warm (2–3 sinais), Hot (4+ sinais)',
      'Priorize o tempo de follow-up nos prospects Hot e Warm — não gaste energia em Cold sem gatilho novo',
      'Use IA para agregar sinais de múltiplas fontes antes de cada abordagem',
      'Registre o tier de cada prospect no CRM social e atualize conforme novos sinais surgem',
    ],
  },
  'como-personalizar-mensagens-linkedin-em-escala': {
    steps: [
      'Construa um banco de contexto por prospect: post recente relevante, evento na empresa, histórico de interações anteriores',
      'Separe o que é permanente (value proposition, prova social) do que é específico (abertura e ponte de contexto)',
      'Escreva a abertura primeiro — a primeira frase decide se o prospect vai continuar lendo',
      'Use IA para agregar contexto antes de escrever, não para gerar a mensagem final sem sua revisão',
      'Revise como prospect: "Se eu recebesse isso, saberia que foi escrita especificamente para mim?"',
    ],
  },
  'como-otimizar-perfil-linkedin-para-vendas-b2b': {
    steps: [
      'Audite cada seção do perfil com a perspectiva do seu comprador ideal — não de um recrutador',
      'Reescreva o headline para comunicar o resultado que você entrega, não o cargo que ocupa',
      'Preencha a seção "Sobre" respondendo: qual dor você resolve, para quem e o que te diferencia',
      'Configure a seção "Em Destaque" com um case study, conteúdo de valor ou recurso relevante para o ICP',
      'Substitua fotos genéricas por foto profissional e banner que transmitam credibilidade visual',
      'Reescreva experiências focando em impacto e resultados mensuráveis, não em responsabilidades',
    ],
  },
  'como-abordar-prospects-no-linkedin': {
    steps: [
      'Pesquise o prospect antes de qualquer contato: leia posts recentes, atividade e perfil',
      'Envie pedido de conexão personalizado com contexto específico — nunca em branco ou com pitch',
      'Aguarde a conexão ser aceita e espere 24–48h antes de enviar a primeira mensagem',
      'Abra a conversa com referência ao que motivou a conexão — sem oferta direta',
      'Mantenha cadência estruturada com follow-ups que adicionam valor, não pressão',
      'Se o prospect não responder, faça follow-up com novo gatilho ou insight — nunca com "só verificando"',
    ],
  },
  'mensagem-de-conexao-linkedin-exemplos': {
    steps: [
      'Pesquise o prospect e identifique um contexto específico para a abertura da mensagem',
      'Escreva a mensagem com menos de 300 caracteres — claro, direto e sem pitch de produto',
      'Abra com referência específica: post recente, marco da empresa ou contexto compartilhado',
      'Explique brevemente por que quer se conectar, sem pressionar para uma reunião',
      'Revise como receptor: "Eu aceitaria este convite se recebesse essa mensagem?"',
      'Após a conexão aceita, registre no CRM social e inicie follow-up em 24–48h',
    ],
  },
  'pitch-de-prospeccao-linkedin': {
    steps: [
      'Defina o ICP com clareza antes de escrever qualquer mensagem de prospecção',
      'Pesquise o problema específico do prospect — personalize a dor, não o nome',
      'Estruture o pitch em 3 partes: abertura com contexto, ponte de valor, CTA de baixo compromisso',
      'Ajuste o tamanho ao canal: máx 300 chars no convite de conexão, até 5 parágrafos curtos no DM',
      'Personalize a abertura de cada mensagem — nunca replique um template palavra por palavra',
      'Meça a taxa de resposta e refine o pitch com base nos dados reais de cada ciclo',
    ],
  },
  'linkedin-para-prospeccao-b2b-guia-definitivo': {
    steps: [
      'Otimize o perfil LinkedIn para atrair o comprador ideal antes de qualquer prospecção ativa',
      'Defina e segmente seu ICP com filtros avançados do LinkedIn ou Sales Navigator',
      'Publique conteúdo relevante 2–3x por semana para aquecer leads antes da abordagem direta',
      'Aborde prospects com contexto: pedido de conexão personalizado, sem pitch inicial',
      'Execute cadência de mensagens com follow-ups que adicionam valor — não de pressão',
      'Integre LinkedIn com CRM social para rastrear cada conversa e não perder oportunidades',
    ],
  },
  'guia-completo-social-selling-linkedin': {
    steps: [
      'Otimize o perfil para o comprador ideal: headline, "Sobre" e destaque voltados para o ICP',
      'Defina 3–4 pilares de conteúdo e publique 2–3x por semana com ponto de vista claro',
      'Identifique 20–30 contas-alvo por trimestre e engaje nos conteúdos delas antes de abordar',
      'Envie pedidos de conexão personalizados com referência específica ao contexto do prospect',
      'Inicie conversas após a conexão com perguntas relevantes — sem pitch na primeira mensagem',
      'Nutra relacionamentos com follow-ups de valor ao longo de semanas ou meses',
    ],
  },
  'social-selling-b2b-metodologia-completa-linkedin-2026': {
    steps: [
      'Defina o ICP operacional e transforme em filtros precisos no LinkedIn ou Sales Navigator',
      'Otimize o perfil para o ICP: headline, seção "Sobre" e destaque voltados para o comprador',
      'Publique conteúdo com ponto de vista claro 2–3x por semana dentro dos pilares temáticos definidos',
      'Engaje estrategicamente nos posts dos prospects por 2–4 semanas antes do outreach direto',
      'Execute outreach com o framework PREC: Pesquisa, Referência, Engajamento, CTA de baixo compromisso',
      'Siga a cadência de 5 touchpoints e qualifique prospects em duas camadas: antes e após o contato',
      'Use CRM de social selling para manter histórico de conversas e follow-ups precisos no tempo certo',
    ],
  },
  'cadencia-de-prospeccao-linkedin-b2b': {
    steps: [
      'Touchpoint 1 — Conexão com contexto: envie pedido com nota curta referenciando algo específico do perfil ou empresa do prospect',
      'Touchpoint 2 — Abertura (24–48h após aceite): primeira mensagem com referência ao contexto da conexão, sem pitch',
      'Touchpoint 3 — Valor (5–7 dias depois): adicione um insight, dado ou conteúdo relevante para o problema do prospect',
      'Touchpoint 4 — Ângulo diferente (7–10 dias depois): aborde pelo ângulo do resultado — o que muda para ele especificamente se o problema for resolvido',
      'Touchpoint 5 — Encerramento com proposta de retomada (7–10 dias depois): sinalize que é sua última tentativa neste ciclo e proponha que o prospect decida o momento ideal',
      'Organize cada cadência com CRM social para acompanhar status, timing e histórico de cada prospect simultaneamente',
    ],
  },
  'filtros-avancados-linkedin-sales-navigator': {
    steps: [
      'Defina o perfil-alvo com filtros de cargo e seniority — use títulos específicos do ICP, não genéricos',
      'Aplique filtros de empresa: tamanho de headcount, setor e crescimento de equipe nos últimos 6 meses',
      'Ative filtros de timing: Changed jobs in the past 90 days e Mentioned in the news para prospects em movimento',
      'Use Spotlight filters para identificar quem já interagiu com sua empresa ou tem conexões em comum',
      'Salve a busca para receber alertas automáticos de novos prospects que entram nos critérios',
      'Exporte os resultados para o CRM ou organize no Chattie para iniciar cadência de abordagem',
    ],
  },
  'como-exportar-leads-sales-navigator': {
    steps: [
      'Defina e refine sua lista de leads no Sales Navigator com os filtros adequados ao ICP',
      'Configure a integração com CRM oficial (Salesforce ou HubSpot) no painel de Settings se disponível no seu plano',
      'Para exportação sem CRM integrado, visite os perfis manualmente e use Apollo.io para capturar e enriquecer dados',
      'Evite extensões de coleta em massa — violam os Termos de Serviço do LinkedIn e arriscam a conta',
      'Organize os leads capturados no CRM com tags de estágio e prioridade antes de iniciar outreach',
      'Atualize os dados periodicamente — exportações são snapshots estáticos e ficam desatualizadas em 60–90 dias',
    ],
  },
  // EN
  'linkedin-b2b-prospecting-cadence': {
    steps: [
      'Touchpoint 1 — Connection with context: send a request with a short note referencing something specific from the prospect\'s profile or company',
      'Touchpoint 2 — Opening (24–48h after acceptance): first message with reference to the connection context — no pitch yet',
      'Touchpoint 3 — Value (5–7 days later): share an insight, data point, or piece of content relevant to the prospect\'s problem',
      'Touchpoint 4 — Different angle (7–10 days later): approach from the outcome angle — what specifically changes for them if the problem is solved',
      'Touchpoint 5 — Closing with re-engagement offer (7–10 days later): signal this is your last touch this cycle and let them decide the right timing',
      'Use a social CRM to track each prospect\'s status, timing, and conversation history simultaneously across the full cadence',
    ],
  },
}

// FAQ data for posts with structuredData: "faq"
type FaqItem = { q: string; a: string }
const FAQ_DATA: Record<string, FaqItem[]> = {
  'como-prospectar-clientes-no-linkedin': [
    {
      q: 'Qual é a melhor abordagem para iniciar uma conversa no LinkedIn com um prospect?',
      a: 'A abordagem mais eficaz começa com contexto específico: referencie um post que a pessoa escreveu, um marco da empresa ou um interesse em comum. Envie o pedido de conexão com uma nota curta e sem pitch. Só após a conexão ser aceita, inicie a conversa com uma pergunta relevante ou insight útil — nunca com uma oferta direta.',
    },
    {
      q: 'Quantas conexões posso enviar por dia no LinkedIn sem risco de bloqueio?',
      a: 'Para uso orgânico dentro dos limites do LinkedIn, o recomendado é de 15 a 20 pedidos de conexão personalizados por dia. Ultrapassar esse volume — especialmente com convites sem nota — aumenta o risco de restrição de conta. Qualidade e personalização superam volume em resultados de longo prazo.',
    },
    {
      q: 'Como filtrar os melhores prospects no LinkedIn para prospecção B2B?',
      a: 'Use os filtros avançados de busca do LinkedIn para segmentar por cargo, setor, tamanho de empresa e localização. Para precisão maior, o Sales Navigator oferece filtros por crescimento da empresa, mudanças de cargo recentes e nível de seniority. O objetivo não é a maior lista — é a mais alinhada ao seu ICP.',
    },
  ],
  'follow-up-linkedin-b2b': [
    {
      q: 'Quantos follow-ups são necessários antes de desistir de um lead no LinkedIn?',
      a: 'A maioria das vendas B2B exige entre 5 e 8 pontos de contato antes do fechamento. Para LinkedIn, uma cadência de 3 follow-ups é o padrão mínimo: o primeiro em 3-5 dias, o segundo em 7-10 dias e o terceiro em 14 dias. Após o terceiro sem resposta, considere um break de 30-45 dias antes de uma tentativa final com ângulo diferente.',
    },
    {
      q: 'O que escrever no follow-up do LinkedIn para aumentar a taxa de resposta?',
      a: 'O erro mais comum é repetir o mesmo ângulo da abordagem original. Cada follow-up deve adicionar algo novo: um dado relevante, um caso de uso do setor do prospect ou uma pergunta diferente. O follow-up mais eficaz referencia o que o prospect disse ou fez na última interação, ou compartilha algo especificamente útil para a dor que ele mencionou.',
    },
    {
      q: 'Como saber o momento certo para fazer o follow-up no LinkedIn?',
      a: 'Sinais de aquecimento — o prospect visitou seu perfil, curtiu um post seu, ou reagiu a uma mensagem anterior — indicam o momento ideal para um follow-up imediato. Na ausência de sinais, uma cadência fixa de 5 a 10 dias entre contatos é mais eficaz do que esperar pelo "momento perfeito", que raramente chega.',
    },
  ],
  'ferramentas-para-prospeccao-no-linkedin': [
    {
      q: 'Qual é a melhor ferramenta de prospecção para LinkedIn em 2025?',
      a: 'Depende do perfil da operação. Para founders e SDRs que priorizam qualidade de relacionamento: o Chattie organiza conversas e contexto sem automação agressiva. Para times com copy validada e meta de volume: Expandi ou Waalaxy permitem sequências automatizadas. Para enriquecimento de dados e prospecção multicanal: Apollo.io. Para segmentação avançada de alto volume: Sales Navigator.',
    },
    {
      q: 'Ferramentas de automação no LinkedIn podem banir minha conta?',
      a: 'Ferramentas que simulam comportamento humano em alta velocidade — disparar 200 conexões por dia, enviar sequências automáticas sem limites — violam os termos do LinkedIn e aumentam o risco de restrição ou banimento. Ferramentas que organizam conversas existentes e sinalizam timing de follow-up, como o Chattie, operam de forma diferente e têm risco significativamente menor.',
    },
    {
      q: 'O LinkedIn Sales Navigator vale o custo para prospecção B2B?',
      a: 'Para quem prospecta ativamente 50 ou mais contas por mês, os filtros avançados e alertas de mudança de cargo do Sales Navigator se pagam em tempo economizado e leads mais qualificados. Para founders com volume menor, os filtros gratuitos do LinkedIn combinados com um CRM social como o Chattie costumam ser suficientes para começar.',
    },
  ],
  'guia-completo-social-selling-linkedin': [
    {
      q: 'Quanto tempo leva para ver resultados com social selling no LinkedIn?',
      a: 'Social selling é um investimento de longo prazo. Os primeiros 30 a 60 dias são de construção de presença e consistência de conteúdo — com poucas oportunidades visíveis. Entre 60 e 90 dias, conversas começam a surgir de forma mais orgânica. Pipeline consistente costuma aparecer entre 3 e 6 meses para quem mantém ritmo de publicação e engajamento. Quem desiste antes dos 90 dias raramente vê o retorno.',
    },
    {
      q: 'O que é o Social Selling Index (SSI) do LinkedIn e por que importa?',
      a: 'O SSI é uma pontuação de 0 a 100 que o LinkedIn calcula com base em quatro pilares: perfil completo e atraente para o comprador, conexão com as pessoas certas, publicação de conteúdo relevante e construção de relacionamentos. Profissionais com SSI alto geram significativamente mais oportunidades — não porque o número em si importa, mas porque ele reflete os comportamentos que geram resultado.',
    },
    {
      q: 'Social selling substitui o cold outreach no B2B?',
      a: 'Social selling complementa e, com o tempo, reduz a necessidade de cold outreach — mas não o substitui completamente no curto prazo. A vantagem do social selling é que as abordagens chegam com contexto e credibilidade acumulados, gerando taxas de resposta muito mais altas. A maioria das operações B2B de alta performance combina os dois.',
    },
  ],
  'como-otimizar-perfil-linkedin-para-vendas-b2b': [
    {
      q: 'Com que frequência devo atualizar o perfil do LinkedIn?',
      a: 'A cada 3-6 meses, ou sempre que mudar de cargo, lançar um produto, atingir um resultado relevante ou mudar o perfil de cliente ideal que está buscando. O título e a seção "Sobre" são os mais críticos — devem refletir o foco atual da sua operação comercial.',
    },
    {
      q: 'Devo usar o LinkedIn em inglês ou português para vender B2B no Brasil?',
      a: 'Para vender para empresas brasileiras, português é o padrão. Se você também atende clientes internacionais, considere manter o título em inglês (maior alcance de busca) e a seção "Sobre" em português com uma versão em inglês ao final. O LinkedIn permite apenas um idioma por perfil — use o do seu público principal.',
    },
    {
      q: 'Vale a pena ter LinkedIn Premium para otimizar vendas B2B?',
      a: 'Para prospecção ativa com volume médio, o LinkedIn gratuito + Sales Navigator é mais custo-efetivo do que o Premium básico. O Sales Navigator oferece filtros avançados e alertas que impactam diretamente resultados de vendas. O Premium Career ou Business tem pouco diferencial para quem foca em vendas B2B.',
    },
  ],
  'automacao-linkedin-o-que-e-permitido': [
    {
      q: 'O LinkedIn pode banir minha conta permanentemente por usar automação?',
      a: 'Sim, em casos de violação grave e repetida. A maioria das restrições iniciais são temporárias — de 24 horas a 7 dias. Contas com histórico de violações repetidas podem receber restrições permanentes. O risco é maior para contas novas e para quem usa ferramentas de scraping em alto volume.',
    },
    {
      q: 'Ferramentas como Expandi e Waalaxy são seguras de usar?',
      a: 'Dependem de como são configuradas. Usadas com limites conservadores (menos de 50 conexões/dia), personalização real e fora de horários suspeitos, o risco é gerenciável. Usadas no modo padrão agressivo, aumentam significativamente o risco de restrição. O histórico da conta também importa — perfis novos correm mais risco.',
    },
    {
      q: 'Existe alguma forma de automatizar o LinkedIn sem risco de banimento?',
      a: 'Ferramentas que não executam ações automaticamente na plataforma — como CRMs sociais que organizam suas conversas e sinalizam timing de follow-up — são essencialmente sem risco porque você executa cada ação manualmente. O risco vem quando a ferramenta age em seu nome no LinkedIn sem sua confirmação por ação.',
    },
  ],
  'ferramentas-de-automacao-linkedin-2026': [
    {
      q: 'O que são ferramentas de automação do LinkedIn?',
      a: 'Ferramentas de automação do LinkedIn são softwares que automatizam total ou parcialmente ações na plataforma — envio de pedidos de conexão, mensagens, follow-ups, publicação de conteúdo ou extração de dados de perfis. Existem quatro categorias principais: agendadores de conteúdo (sem risco), AI SDRs assistidos (baixo risco), ferramentas cloud de sequências (médio risco) e ferramentas de scraping/extensões de Chrome (médio-alto risco). O risco de cada categoria depende de como a ferramenta acessa o LinkedIn e do volume de ações que executa de forma autônoma.',
    },
    {
      q: 'Qual ferramenta de automação LinkedIn é mais segura em 2026?',
      a: 'Ferramentas que operam como assistentes — organizando suas conversas e sugerindo ações que você executa manualmente — têm risco próximo de zero. O Chattie é o exemplo nessa categoria. Entre as ferramentas de sequência, plataformas cloud com IP residencial dedicado como Expandi têm risco menor do que extensões de Chrome como Dux-Soup ou Phantombuster. A segurança nunca depende apenas do nome da ferramenta — depende de como você a configura e dos limites que você respeita.',
    },
    {
      q: 'Quantas conexões posso enviar por dia no LinkedIn sem risco de ban?',
      a: 'O limite conservador adotado por operadores experientes é 50 pedidos de conexão por dia. Acima de 100 por dia, o risco aumenta substancialmente. Acima de 150, especialmente com baixa taxa de aceitação, a restrição de conta é frequente. Contas novas devem começar com 20 por dia e escalar gradualmente.',
    },
    {
      q: 'Ferramentas de automação LinkedIn violam os termos de uso da plataforma?',
      a: 'Depende da categoria. Agendadores de conteúdo e CRMs sociais não violam os termos. Ferramentas de sequência que agem em seu nome operam em zona cinzenta — tecnicamente contrariam a seção 8.2 dos termos, mas são amplamente utilizadas sem consequência quando configuradas dentro de limites razoáveis. Ferramentas de scraping em massa e bots de conexão irrestrita violam os termos claramente.',
    },
    {
      q: 'Vale a pena usar automação de LinkedIn para prospecção B2B em 2026?',
      a: 'Depende do tipo de automação. Automação de volume sem personalização entrega resultados decrescentes e risco crescente de conta. Automação de inteligência — ferramentas que organizam contexto, qualificam leads e sugerem o momento certo para agir — entrega resultado crescente com risco baixo. A pergunta certa não é "devo automatizar?" mas "o que faz sentido automatizar e o que deve permanecer humano?".',
    },
  ],
  'o-que-e-um-ai-sdr': [
    {
      q: 'O que é um AI SDR e como ele funciona na prática?',
      a: 'Um AI SDR é uma ferramenta que usa inteligência artificial para executar ou apoiar tarefas de prospecção e qualificação de leads que normalmente cabem a um SDR humano. Na prática: organiza o contexto de cada conversa, prioriza quem precisa de follow-up com base em sinais de interesse, sugere próximas ações e evita que leads quentes esfriem por falta de atenção no timing certo.',
    },
    {
      q: 'Um AI SDR pode substituir completamente um SDR humano?',
      a: 'Não em vendas B2B de ticket médio ou alto. Um AI SDR substitui o trabalho mecânico — pesquisa de prospect, triagem, lembretes de follow-up, organização de pipeline. O SDR humano foca no que IA não replica: julgamento contextual, empatia, adaptação em tempo real à conversa. O resultado é um SDR humano significativamente mais produtivo, não um SDR eliminado.',
    },
    {
      q: 'Qual é a diferença entre um AI SDR e uma ferramenta de automação de LinkedIn?',
      a: 'Ferramentas de automação executam sequências predefinidas — enviam X mensagens para Y pessoas em Z dias, independente do contexto de cada conversa. Um AI SDR analisa o que aconteceu: o que o prospect disse, como reagiu, quais sinais emitiu, e ajusta a próxima ação com base nisso. A diferença na qualidade de abordagem é substancial — e o prospect percebe.',
    },
  ],
  // ── Comparativos PT-BR ────────────────────────────────────────────────────
  'chattie-vs-expandi': [
    { q: 'O Expandi é mais seguro que o Waalaxy para minha conta do LinkedIn?', a: 'Tecnicamente sim — o Expandi opera via perfil dedicado no browser, não via extensão de Chrome, o que é menos detectável pelo LinkedIn. Mas ambos automatizam ações que vão contra os Termos de Serviço do LinkedIn. O risco não é zero em nenhum dos dois casos.' },
    { q: 'O Chattie precisa de integração com o Expandi para funcionar?', a: 'Não. O Chattie funciona de forma independente, diretamente sobre o LinkedIn. Se você usa o Expandi para gerar conexões e primeiros contatos, pode importar manualmente os prospects que mostraram interesse para o Chattie.' },
    { q: 'O Expandi vale o preço para quem prospecta solo?', a: 'Depende do volume. O Expandi é uma ferramenta projetada para times e agências — o preço reflete isso. Para um founder ou consultor solo que prospecta de forma moderada, o custo raramente se justifica frente às alternativas.' },
  ],
  'chattie-vs-waalaxy': [
    { q: 'O Waalaxy pode banir minha conta do LinkedIn?', a: 'O LinkedIn proíbe automação de ações em seus Termos de Serviço. O Waalaxy opera via extensão de Chrome e tenta simular comportamento humano para reduzir o risco de detecção. O risco existe, mas é gerenciável se você mantém volumes dentro dos limites recomendados.' },
    { q: 'O Chattie envia mensagens por mim?', a: 'Não. O Chattie é um CRM social — ele organiza suas conversas, mantém contexto e sinaliza quem precisa de follow-up. A mensagem em si é sempre escrita e enviada por você, preservando a autenticidade da conversa.' },
    { q: 'Qual das duas ferramentas é mais barata para começar?', a: 'O Waalaxy tem plano gratuito com limites de volume, o que o torna acessível para testar. O Chattie tem modelo de preço focado no valor que entrega na gestão de relacionamentos — ideal para quem prioriza qualidade sobre volume.' },
  ],
  // ── Chattie use cases ─────────────────────────────────────────────────────
  'como-founders-usam-o-chattie': [
    { q: 'O Chattie é certo para mim se eu nunca usei CRM antes?', a: 'Sim. O Chattie foi desenhado para pessoas que não querem aprender um CRM completo. A curva de adoção é baixa porque o produto funciona sobre o LinkedIn — você não muda onde a venda acontece, só adiciona organização em cima.' },
    { q: 'Preciso ter um volume alto de leads para justificar o uso do Chattie?', a: 'Não. Founders que têm quinze conversas ativas já sentem a diferença porque o custo de perder um lead de alto valor é alto. O ponto de virada para a maioria é quando percebem que já perderam um negócio por falta de follow-up.' },
    { q: 'O Chattie funciona para outbound ou só para inbound?', a: 'Funciona para os dois. O fluxo de outbound tem estágios próprios (conexão enviada, conectado, primeira mensagem, follow-up). O inbound se beneficia do contexto e do histórico de conversa mantido pelo Chattie.' },
  ],
  'como-o-chattie-se-paga': [
    { q: 'Em quanto tempo o Chattie se paga?', a: 'Para operações com ticket médio acima de R$ 5.000, geralmente entre 1 e 3 meses de uso consistente. O retorno aparece à medida que leads esquecidos são reativados e a taxa de conversão de follow-up aumenta.' },
    { q: 'Qual a principal economia que o Chattie gera?', a: 'Principalmente tempo e oportunidades perdidas. Um vendedor que gerencia 50 contatos simultâneos sem ferramenta gasta em média 30-40% do tempo apenas procurando contexto de conversas antigas.' },
    { q: 'O Chattie funciona para operações pequenas (1-2 pessoas)?', a: 'Sim — especialmente para founders e consultores que vendem sozinhos. O principal ganho para pequenas operações é nunca mais perder um lead por esquecimento, o que é extremamente comum sem time dedicado à prospecção.' },
  ],
  // ── CRM e Social Selling ─────────────────────────────────────────────────
  'crm-para-social-selling': [
    { q: 'O que é CRM para social selling, exatamente?', a: 'É uma ferramenta que organiza conversas comerciais em redes sociais — especialmente LinkedIn — desde o primeiro contato até a qualificação do lead. Ela registra o histórico de interação, categoriza leads por intenção e sinaliza quando é hora de retomar o contato.' },
    { q: 'Qual a diferença entre CRM social e CRM tradicional?', a: 'O CRM tradicional (Pipedrive, HubSpot) atua com oportunidades formais: propostas, reuniões, negociações. O CRM social atua antes disso — nas conversas informais que ainda não chegaram ao funil, mas que determinam se o lead vai avançar.' },
    { q: 'O Chattie é um CRM para social selling?', a: 'Sim. O Chattie é um AI SDR para LinkedIn que funciona como CRM social: organiza o inbox, categoriza conversas por estágio, mantém histórico e sinaliza timing de follow-up. Foi construído especificamente para quem usa o LinkedIn como canal de prospecção ativa.' },
  ],
  // ── IA para Vendas ────────────────────────────────────────────────────────
  'ia-para-vendas-b2b': [
    { q: 'IA vai substituir minha equipe de vendas B2B?', a: 'Em B2B de ciclo longo e ticket significativo, não. O que vai acontecer é que equipes que usam IA vão superar equipes que não usam — em volume de atividade, qualidade de abordagem e precisão de follow-up.' },
    { q: 'Qual é o investimento mínimo para começar a usar IA em vendas?', a: 'Ferramentas de IA para gestão de prospecção no LinkedIn começam em valores acessíveis para quem vende de forma individual. O critério não deve ser o preço da ferramenta, mas o valor de cada lead que você está perdendo hoje.' },
    { q: 'O uso de IA em prospecção pode prejudicar minha reputação no LinkedIn?', a: 'Depende de como você usa. IA que automatiza ações em massa no LinkedIn prejudica conta e reputação. IA que organiza seu processo e sugere ações para você executar manualmente não tem esse risco.' },
  ],
  'ferramentas-de-ia-para-sdr': [
    { q: 'Ferramentas de IA para SDR funcionam para o mercado B2B brasileiro no LinkedIn?', a: 'A maioria das ferramentas de IA para SDR foi construída para o mercado americano. Tecnicamente funcionam para LinkedIn Brasil, mas bases de dados de enriquecimento como Apollo e Clay têm cobertura menor para empresas brasileiras. Para prospecção no Brasil, LinkedIn Sales Navigator combinado com Chattie para gestão de conversas é o stack mais confiável — sem depender de dados externos que podem estar desatualizados para empresas nacionais.' },
    { q: 'Qual é a diferença entre AI SDR e uma ferramenta de automação de LinkedIn?', a: 'Uma ferramenta de automação de LinkedIn executa ações em seu lugar — envia conexões, dispara sequências, faz follow-up automático em seu nome. Um AI SDR usa inteligência artificial para tornar suas ações mais precisas e bem informadas, mantendo você no loop de cada mensagem. A diferença de performance é real: outreach humano, contextualizado e enviado individualmente, converte significativamente melhor que sequências automatizadas.' },
    { q: 'Preciso de todas as 3 categorias de ferramentas para prospectar no LinkedIn?', a: 'Não necessariamente. Para quem está começando: gestão de conversas (Chattie) resolve o problema mais urgente — perda de contexto e follow-ups esquecidos. Targeting fica por conta do LinkedIn Search nativo. Conteúdo de posts fica por conta de IA generativa como rascunhador. À medida que o volume e o orçamento crescem, Sales Navigator e enriquecimento fazem sentido como próximos passos.' },
    { q: 'Como evitar que ferramentas de IA tornem meu outreach genérico?', a: 'A regra prática: qualquer mensagem que a ferramenta gera automaticamente precisa ser lida e editada por você antes de enviar. Se você está enviando outputs de IA sem editar, o prospect vai perceber. O uso correto de IA generativa para mensagens é como um rascunhador com contexto: te dá uma base informada, mas o que transforma a base em mensagem que converte é a sua edição.' },
    { q: 'Vale investir em ferramentas de IA para SDR se eu faço prospecção de baixo volume?', a: 'Para 1-10 prospects por semana, uma planilha simples resolve. Para 20-40 prospects simultâneos em estágios diferentes de conversa, ferramentas de gestão como o Chattie pagam por si mesmas em tempo economizado e contexto preservado. O ponto de inflexão é quando você começa a perder follow-ups, esquecer o que foi discutido ou deixar prospects quentes esfriarem por falta de sistema.' },
  ],
  'como-qualificar-leads-no-linkedin-com-ia': [
    { q: 'O que significa qualificar um lead no LinkedIn?', a: 'Qualificar um lead no LinkedIn significa determinar se um prospect tem, ao mesmo tempo, um problema relevante, autoridade ou influência para agir sobre ele e timing que sugere que a conversa é útil agora. Fit de ICP é apenas o primeiro filtro. Qualificação é o que determina quem, dentro do ICP, merece atenção prioritária no momento — com base em sinais de comportamento, não em critérios estáticos.' },
    { q: 'IA consegue qualificar leads automaticamente pelo LinkedIn?', a: 'IA consegue agregar sinais de comportamento e priorizar prospects com base em atividade recente, mas não substitui o julgamento humano sobre fit de produto e contexto de negócio. O papel correto da IA em qualificação é reduzir o trabalho de pesquisa e tornar os sinais visíveis, não tomar a decisão de quem qualificar.' },
    { q: 'Quantos sinais preciso ver antes de abordar um prospect no LinkedIn?', a: 'Um sinal forte — como visita ao perfil combinada com mudança de cargo recente — já justifica uma abordagem personalizada. Três ou mais sinais simultâneos indicam que o timing está quente e a abordagem pode ser mais direta e assertiva. Zero sinal: continue o aquecimento passivo com engajamento de conteúdo antes de tentar mensagem direta.' },
    { q: 'Qual a diferença entre qualificação e prospecção no LinkedIn?', a: 'Prospecção é encontrar prospects que correspondem ao ICP — é uma questão de targeting e volume de lista. Qualificação é determinar, dentro dos prospects encontrados, quem tem timing de compra e merece abordagem prioritária agora — é uma questão de priorização por sinal. A maioria das estratégias de LinkedIn foca em prospecção e subestima qualificação, resultando em listas grandes com conversas de baixa qualidade.' },
    { q: 'Como saber se um prospect está pronto para comprar?', a: 'Nenhum sinal garante compra. Mas a combinação de comportamento ativo — visita ao perfil, engajamento com conteúdo, pesquisa sobre o problema — com eventos de timing como mudança de cargo, expansão ou captação de rodada aumenta significativamente a probabilidade de uma conversa relevante. O objetivo da qualificação com IA é aumentar a proporção de conversas com prospects que têm timing real, não buscar certeza.' },
  ],
  'como-personalizar-mensagens-linkedin-em-escala': [
    { q: 'É possível personalizar mensagens no LinkedIn em escala sem usar IA?', a: 'Possível, mas com limite prático. Sem IA para agregar contexto, personalização real é viável até aproximadamente 10-15 prospects ativos simultâneos. Acima disso, a pesquisa por prospect começa a consumir mais tempo do que a escrita — e a qualidade cai inevitavelmente. IA não resolve a escrita, mas resolve o tempo de pesquisa, o que estende o limite para 40-50 conversas com personalização mantida.' },
    { q: 'Como saber se minha personalização no LinkedIn está funcionando de verdade?', a: 'Taxa de resposta é o indicador principal. Para outreach com contexto relevante, 15-25% de resposta é alcançável. Abaixo de 10%, o problema geralmente está na personalização ou na relevância do contexto — não no canal. Teste prático: peça para alguém de fora ler suas últimas 5 mensagens e dizer qual era o contexto específico de cada uma. Se não souber dizer, a personalização não ficou visível.' },
    { q: 'Preciso personalizar o follow-up no LinkedIn também?', a: 'Sim — e o follow-up tem uma vantagem: você já tem o contexto da conversa anterior. Um follow-up que referencia o que foi discutido e adiciona algo novo é radicalmente mais eficaz do que "só passando para ver se você teve chance de ler minha mensagem anterior". A regra prática: sem contexto novo, sem mensagem nova.' },
    { q: 'Qual o tamanho ideal de mensagem personalizada no LinkedIn em B2B?', a: 'Mensagens entre 50 e 120 palavras têm resultado consistentemente melhor em primeira abordagem. Mensagem longa sinaliza que você precisa demais explicar para convencer. A personalização deve ser aparente na primeira ou segunda linha — não depender de que o prospect chegue ao final.' },
    { q: 'IA pode escrever mensagens personalizadas de prospecção por mim?', a: 'IA pode gerar drafts úteis quando você fornece o contexto completo: perfil do prospect, histórico da conversa, o que você quer comunicar e qual o tom da marca. O output serve como ponto de partida, não como versão final. Mensagens enviadas diretamente do output de IA sem edição humana são percebidas como tal pelos prospects — e o resultado cai para o nível de template genérico.' },
  ],
  // ── LinkedIn Leads ────────────────────────────────────────────────────────
  'linkedin-para-gerar-leads-qualificados': [
    { q: 'Quantos leads qualificados dá para gerar por mês no LinkedIn?', a: 'Para founders e SDRs com método consistente, 15 a 40 conversas qualificadas por mês é um número realista sem automação agressiva. O número varia conforme o ICP e a intensidade da operação.' },
    { q: 'Qual é a diferença entre lead e conexão no LinkedIn?', a: 'Conexão é qualquer pessoa que aceitou seu convite. Lead qualificado é alguém que demonstrou interesse real: respondeu sua mensagem, fez uma pergunta sobre o que você oferece ou sinalizou abertura para conversar.' },
    { q: 'É melhor gerar leads por conteúdo ou por prospecção ativa?', a: 'Os dois se complementam. Conteúdo atrai e aquece — faz com que quando você aborde, o lead já te conheça. Prospecção ativa gera velocidade — você não espera o lead te encontrar.' },
  ],
  // ── LinkedIn para Vendas ──────────────────────────────────────────────────
  'linkedin-para-vendas-b2b': [
    { q: 'Quantos seguidores preciso para gerar vendas com autoridade no LinkedIn?', a: 'Não existe número mínimo. Perfis com 500 conexões qualificadas geram mais negócio do que perfis com 10.000 seguidores sem critério. O que importa é a relevância da sua rede para o seu ICP — não o tamanho dela.' },
    { q: 'Com que frequência devo postar no LinkedIn para construir autoridade em vendas B2B?', a: '2 a 3 vezes por semana é um ritmo sustentável e eficiente. Mais importante do que a frequência é a consistência: aparecer todo mês com conteúdo relevante vale mais do que uma enxurrada de posts por uma semana e sumir por um mês.' },
    { q: 'Como sei se meu posicionamento no LinkedIn está claro para meu ICP?', a: 'Pergunte para alguém que não te conhece ver seu perfil e dizer em uma frase o que você faz e para quem. Se a resposta for vaga ou errada, o posicionamento precisa de ajuste antes de qualquer esforço de prospecção.' },
  ],
  'linkedin-para-vendas-consultivas': [
    { q: 'Por que o LinkedIn é melhor do que o cold call para vendas consultivas?', a: 'Porque ele permite construir contexto antes do primeiro contato direto. No LinkedIn, o lead já te conhece pelo seu conteúdo, perfil e interações antes de receber uma mensagem — o que reduz resistência e aumenta receptividade.' },
    { q: 'Quanto tempo devo investir no LinkedIn para vendas consultivas por semana?', a: 'Entre 3 e 5 horas semanais divididas em publicação de conteúdo (1h), interação com leads e comentários (1-2h) e prospecção ativa com mensagens personalizadas (1-2h). Consistência importa mais do que volume semanal.' },
    { q: 'Devo postar todo dia no LinkedIn para gerar resultado em vendas consultivas?', a: 'Não necessariamente. 2 a 3 publicações por semana com conteúdo relevante superam 7 posts mediocres. O que importa é que o conteúdo reforce seu posicionamento e responda às dores do seu ICP.' },
  ],
  'linkedin-para-vendas': [
    { q: 'Como começar a vender no LinkedIn do zero?', a: 'Comece estruturando seu perfil como argumento comercial (não currículo), defina seu ICP com clareza e inicie conexões com contexto — comentando posts antes de enviar mensagem direta. A primeira semana deve ser de observação e interação, não de pitch.' },
    { q: 'Qual o melhor horário para enviar mensagens no LinkedIn?', a: 'Terça a quinta entre 8h e 10h da manhã tendem a ter melhores taxas de resposta. Mas o fator mais importante não é o horário — é a relevância da mensagem. Uma mensagem contextualizada às 14h supera uma genérica às 8h.' },
    { q: 'Quantas mensagens de follow-up devo enviar no LinkedIn?', a: 'Em geral, 2 a 3 follow-ups espaçados (3, 7 e 14 dias) são suficientes. Mais do que isso sem resposta é sinal para pausar e tentar outro canal ou outro momento.' },
  ],
  // ── Conceituais PT-BR ─────────────────────────────────────────────────────
  'o-que-e-social-selling': [
    { q: 'O que é social selling, em uma frase?', a: 'Social selling é o uso estratégico de redes sociais profissionais — especialmente o LinkedIn — para construir relacionamentos com potenciais clientes e gerar oportunidades de venda de forma natural, sem cold call ou spam.' },
    { q: 'Social selling funciona para qualquer tipo de empresa B2B?', a: 'Sim, mas funciona melhor em vendas com ticket médio mais alto, ciclo de decisão mais longo e necessidade de confiança antes do fechamento — como consultorias, SaaS, serviços profissionais e qualquer produto que exija uma conversa antes da compra.' },
    { q: 'Qual a diferença entre social selling e spam no LinkedIn?', a: 'A diferença está na personalização e no timing. Spam é mensagem genérica enviada em volume, sem contexto, empurrando produto logo no primeiro contato. Social selling é abordagem contextualizada, no momento certo, construída sobre uma relação mínima prévia.' },
  ],
  'o-que-e-um-crm-social': [
    { q: 'O que é CRM social, em resumo?', a: 'CRM social é uma ferramenta que organiza conversas comerciais em redes sociais — especialmente o LinkedIn — desde o primeiro contato. Ele registra quem interagiu, o que foi dito, qual o status da conversa e quando fazer follow-up.' },
    { q: 'CRM social substitui o Pipedrive ou HubSpot?', a: 'Não. Ele complementa. O CRM social atua na fase pré-funil — antes do lead ter uma oportunidade formal. Quando o lead está pronto, ele "sobe" para o CRM tradicional com histórico completo.' },
    { q: 'Para que tipo de empresa o CRM social faz mais sentido?', a: 'Para qualquer empresa que usa o LinkedIn como canal ativo de prospecção e precisa organizar as conversas que vêm de lá. Funciona especialmente bem para consultorias, SaaS B2B, agências e founders que vendem diretamente.' },
  ],
  'vender-no-linkedin-sem-estrategia': [
    { q: 'Por que minhas mensagens no LinkedIn não recebem resposta?', a: 'As causas mais comuns são: mensagem genérica sem contexto, abordagem muito cedo (sem aquecimento prévio), pitch na primeira mensagem, ou perfil fraco que não sustenta o discurso. Revise um desses pontos por vez.' },
    { q: 'Como saber se minha abordagem no LinkedIn está funcionando?', a: 'Monitore: taxa de aceite do convite (deve ficar acima de 30%), taxa de resposta à primeira mensagem (meta: acima de 15%), e quantas conversas avançam para reunião. Se algum número está muito baixo, o problema está nessa etapa específica.' },
    { q: 'Quantas mensagens de follow-up são aceitáveis antes de desistir de um prospect?', a: 'Em geral, 2 a 3 follow-ups são suficientes, com espaçamento de 5 a 10 dias entre cada um. Após o terceiro sem resposta, pause por 30 dias e tente com um ângulo completamente diferente.' },
  ],
  // ── AI SDR vs SDR Humano PT-BR ────────────────────────────────────────────
  'ai-sdr-vs-sdr-humano': [
    { q: 'IA vai substituir SDRs em vendas B2B complexas?', a: 'Em vendas B2B com ticket médio-alto, ciclos longos e múltiplos decisores, não. IA substitui as partes repetitivas — pesquisa, triagem, organização, alertas. As partes que exigem julgamento contextual, empatia e adaptação em tempo real continuam sendo território humano. O resultado esperado não é menos SDRs — é SDRs mais produtivos.' },
    { q: 'Qual o impacto real de IA na produtividade de um SDR?', a: 'Em operações com stack de IA bem implementada, SDRs tipicamente reportam aumento de 40–80% em capacidade de gestão de prospects simultâneos — ou seja, um SDR com IA cobre o trabalho que antes exigia 1,5 a 2 SDRs. Se isso resulta em menos contratações ou mais volume depende dos objetivos de crescimento da empresa.' },
    { q: 'O uso de IA em prospecção prejudica o relacionamento com prospects?', a: 'Depende do que a IA faz. IA que opera em background — organizando pipeline, preservando contexto, sugerindo timing — é invisível ao prospect. IA que envia mensagens autônomas sem revisão humana é detectável por compradores B2B experientes e compromete a credibilidade da abordagem.' },
    { q: 'Vale a pena usar AI SDR para prospecção de baixo volume?', a: 'Para menos de 20 prospects simultâneos, a maioria das ferramentas de IA é exagero — uma planilha estruturada resolve. O ponto de inflexão é quando você começa a perder follow-ups ou deixar prospects quentes esfriarem. Para volumes acima de 30–40 prospects ativos, a vantagem de uma ferramenta como o Chattie se paga rapidamente.' },
  ],
  // ── Novos PT-BR — Cluster Sales Navigator + Qualificação ─────────────────
  'linkedin-sales-navigator-vale-a-pena': [
    { q: 'O Sales Navigator pode causar bloqueio ou restrição na conta do LinkedIn?', a: 'Não. O Sales Navigator é um produto oficial do LinkedIn — não há risco de restrição por usar a ferramenta dentro dos parâmetros normais de uso. O risco de bloqueio está associado ao uso de extensões de terceiros que automatizam ações, não ao Sales Navigator em si.' },
    { q: 'Posso testar o Sales Navigator antes de pagar?', a: 'Sim. O LinkedIn oferece trial gratuito de 30 dias para novos usuários do Sales Navigator. É o suficiente para avaliar se os filtros avançados e os alertas de job change fazem diferença para o seu processo específico.' },
    { q: 'Sales Navigator substitui um CRM?', a: 'Não. O Sales Navigator é uma ferramenta de descoberta e monitoramento de prospects — ele ajuda a encontrar quem abordar e a acompanhar sinais de timing. Para gerenciar pipeline, organizar conversas e registrar histórico de interações, você ainda precisa de um CRM ou ferramenta como o Chattie para a parte de conversas no LinkedIn.' },
    { q: 'O Sales Navigator funciona bem para founders vendendo sozinhos?', a: 'Depende do volume e da especificidade do ICP. Se o founder está em fase de descoberta — ainda testando quem é o cliente ideal — o LinkedIn gratuito com método costuma ser suficiente. O Sales Navigator agrega mais quando o ICP está claro e a prospecção já tem volume e consistência.' },
    { q: 'Como saber se meu volume justifica o Sales Navigator?', a: 'Uma referência prática: se você está abordando menos de 20 prospects por semana, o LinkedIn gratuito provavelmente resolve. Entre 20 e 50 abordagens semanais, depende da especificidade do ICP. Acima de 50 abordagens semanais com ICP específico, o Sales Navigator quase sempre se paga pelo tempo economizado em pesquisa e pela precisão das listas.' },
  ],
  'como-identificar-decisores-no-linkedin': [
    { q: 'Como saber se alguém tem autoridade de compra só pelo cargo no LinkedIn?', a: 'Cargo é ponto de partida, não confirmação. Um VP em uma empresa de 500 pessoas tem autoridade de compra real. Um VP em uma startup de 8 pessoas pode ser um cargo operacional sem orçamento próprio. O que confirma autoridade é a combinação de cargo + equipe subordinada + sinais de atividade sobre o problema.' },
    { q: 'Vale a pena abordar o influenciador se você não tem acesso ao decisor?', a: 'Sim, com a estratégia certa. O influenciador pode ser o melhor ponto de entrada numa conta onde o decisor é inacessível diretamente. A abordagem correta é construir convicção nele para que ele leve internamente — material que faça o caso, linguagem de negócio que ele possa usar.' },
    { q: 'Qual a diferença entre decisor, influenciador e champion?', a: 'Decisor é quem tem autoridade orçamentária — quem assina ou aprova o gasto. Influenciador é quem tem opinião relevante sobre a decisão sem ter autoridade final. Champion é o influenciador que está ativo do seu lado e vai trabalhar internamente para viabilizar a compra.' },
    { q: 'Como o Sales Navigator ajuda a identificar decisores melhor que o LinkedIn gratuito?', a: 'O Sales Navigator permite combinar filtros de senioridade, função, crescimento de headcount e mudança de cargo recente de forma simultânea. Isso significa que você pode criar uma lista de VPs de Vendas em empresas de 50–200 pessoas que contrataram recentemente — em poucos cliques, em vez de pesquisa manual perfil a perfil.' },
    { q: 'Em que momento da conversa eu pergunto se o prospect é o decisor?', a: 'Depois que você estabeleceu que existe interesse no problema — não antes. Se você pergunta sobre processo de decisão na primeira mensagem, soa como qualificação mecânica. Espere ter construído algum contexto e interesse genuíno. "Se isso fizer sentido para você, como é o processo de avaliação aí?" é uma pergunta de colaboração, não de checklist.' },
  ],
  'cadencia-de-prospeccao-linkedin-b2b': [
    { q: 'Quantos touchpoints são o máximo em uma cadência de LinkedIn?', a: 'Cinco touchpoints em 30 dias é o limite razoável para uma cadência fria. Mais do que isso sem nenhuma resposta é pressão — e no LinkedIn, pressão tem consequência de reputação. Se o prospect não respondeu após cinco tentativas bem espaçadas com valor real em cada uma, suspendir a cadência e retornar em 60 a 90 dias com um novo gatilho é mais eficaz.' },
    { q: 'Quanto tempo devo esperar entre o pedido de conexão e a primeira mensagem?', a: 'Espere o prospect aceitar a conexão antes de qualquer mensagem. Após o aceite, aguarde 24 a 48 horas para a primeira mensagem. Mandar no mesmo momento em que o aceite acontece denuncia automação e reduz a percepção de personalização.' },
    { q: 'Devo usar o Sales Navigator para gerenciar cadências de LinkedIn?', a: 'O Sales Navigator é útil para identificação e monitoramento de prospects. Mas não é uma ferramenta de gestão de cadência. Para acompanhar onde cada prospect está na sequência, o que já foi enviado e quando enviar o próximo touchpoint, você precisa de uma camada adicional — seja planilha, CRM ou uma plataforma como o Chattie construída para esse fluxo no LinkedIn.' },
    { q: 'Como abordar um prospect que rejeitou a conexão no LinkedIn?', a: 'Se o prospect rejeitou o pedido de conexão, não reenvie imediatamente. Espere pelo menos 30 dias antes de tentar novamente — e quando tentar, mude o contexto da nota de conexão. Se o rejeite for recorrente, considere interagir com o conteúdo dele publicamente, solicitar apresentação via conexão em comum ou aguardar um gatilho de contexto mais forte.' },
    { q: 'É possível automatizar cadências de LinkedIn sem perder qualidade?', a: 'Automação total de mensagens no LinkedIn viola os termos de uso e cria risco de banimento. Mas automação de gestão — alertas de timing, registro de histórico, sinalização de status — é não apenas possível como necessária para volume. O que não pode ser automatizado é o conteúdo de cada touchpoint: precisa de referência específica ao contexto do prospect.' },
  ],
  'icp-linkedin-como-definir-perfil-cliente-ideal': [
    { q: 'O que é ICP e por que ele importa para prospecção no LinkedIn?', a: 'ICP (Ideal Customer Profile) é a descrição precisa do tipo de empresa e do perfil de pessoa que tem mais probabilidade de comprar seu produto e de ter sucesso com ele. No LinkedIn, ICP importa porque a plataforma tem mais de 1 bilhão de usuários — sem filtros precisos, você prospecta as pessoas erradas e desperdiça tempo e reputação.' },
    { q: 'Qual é a diferença entre ICP e persona?', a: 'ICP define o tipo de empresa (firmografia, tamanho, setor, estágio). Persona define o indivíduo dentro dessa empresa (cargo, seniority, motivações, dores). Para prospecção no LinkedIn, você precisa dos dois: o ICP define com que empresas você trabalha, a persona define com que pessoas dentro dessas empresas você fala.' },
    { q: 'Quantas personas de ICP devo ter ao mesmo tempo?', a: 'Para founders e SDRs que prospectem sozinhos, trabalhar com mais de duas personas simultaneamente fragmenta atenção e dificulta a personalização real. Escolha a persona com maior potencial de conversão, valide, e só então expanda. Menos personas com abordagem mais precisa supera mais personas com abordagem vaga.' },
    { q: 'Como saber se meu ICP está errado sem esperar muitos meses?', a: 'O sinal mais rápido é a taxa de resposta à primeira mensagem. Se você está abordando pessoas com personalização razoável e a taxa fica consistentemente abaixo de 10%, o ICP provavelmente está errado — cargo, timing ou dimensão de problema. Trinta abordagens personalizadas com taxa abaixo de 10% já é evidência suficiente para revisar.' },
    { q: 'É possível ter um ICP bom sem Sales Navigator?', a: 'Sim. O LinkedIn gratuito tem filtros de cargo, setor, tamanho aproximado e localização — suficientes para começar. O que você perde sem Sales Navigator é principalmente a dimensão de timing: alertas de mudança de cargo, filtros de crescimento de headcount e acesso a perfis fora da rede de primeiro grau.' },
  ],
  // ── Novos Comparativos PT-BR ──────────────────────────────────────────────
  'expandi-vs-waalaxy': [
    { q: 'Posso usar Expandi e Waalaxy juntos?', a: 'Não faz sentido. As duas ferramentas resolvem o mesmo problema — automação de outreach no LinkedIn — e usar as duas ao mesmo tempo só aumenta o risco de conta sem adicionar funcionalidade nova. Se você está tentando decidir entre as duas, use o comparativo. Se já escolheu uma e está funcionando, não há razão para adicionar a outra.' },
    { q: 'O Expandi é mesmo mais seguro que o Waalaxy?', a: 'Mais seguro em um vetor específico: a arquitetura cloud é menos detectável do que extensão de Chrome. Isso não significa que o Expandi é seguro de forma absoluta — automação em volume sempre carrega risco. A diferença é de grau, não de natureza.' },
    { q: 'O Waalaxy em 2026 ainda vale a pena com o risco de extensão?', a: 'Depende do contexto. Para quem está começando, com volume baixo e orçamento limitado, o Waalaxy ainda entrega valor. O risco de extensão é real, mas gerenciável com volumes conservadores. O problema aparece quando o volume escala sem cuidado ou quando a conta já está no radar do LinkedIn.' },
    { q: 'Qual das duas tem melhor integração com CRM?', a: 'O Expandi tem integrações mais maduras com HubSpot, Pipedrive e outros via Zapier ou API direta. O Waalaxy tem integrações disponíveis, mas com menos profundidade de dados — adequado para fluxos simples, menos adequado para sincronização bidirecional com CRM complexo.' },
    { q: 'E se eu não quiser automatizar nada — existe alguma opção?', a: 'Sim. Se o objetivo é organizar prospecção manual no LinkedIn sem correr risco com automação, o Chattie é construído exatamente para esse caso: CRM social, zero automação, zero risco de conta.' },
  ],
  'linkedin-vs-email-prospeccao': [
    { q: 'LinkedIn é melhor do que e-mail para prospecção B2B?', a: 'Não existe "melhor" absoluto — existe melhor para o seu contexto. O LinkedIn supera o e-mail quando o ICP é ativo na rede, o ticket é médio-alto e a venda exige relacionamento progressivo. O e-mail supera o LinkedIn quando o ICP não usa a rede ativamente e o volume é prioritário. Para a maioria das operações B2B, os dois funcionam melhor juntos do que separados.' },
    { q: 'Qual canal tem melhor taxa de resposta — LinkedIn ou e-mail?', a: 'Em estimativas de mercado, o LinkedIn com personalização real costuma entregar taxas de resposta entre 10% e 25% em abordagens frias — acima da média do e-mail frio, que fica entre 1% e 5% para listas não aquecidas. Mas esses números variam muito com a qualidade da segmentação, do copy e do contexto.' },
    { q: 'Como combinar LinkedIn e e-mail na prospecção sem parecer insistente?', a: 'A chave é sequência com contexto, não repetição com volume. A lógica correta é: LinkedIn primeiro para identificar, aquecer e abrir contato direto; e-mail depois como segundo canal se o lead não respondeu. Em cada etapa, o conteúdo da mensagem deve evoluir — nunca repetir. Respeitar intervalos de 5 a 7 dias entre cada touchpoint evita a sensação de assédio.' },
    { q: 'Quais ferramentas usar para prospectar no LinkedIn e no e-mail ao mesmo tempo?', a: 'Para e-mail: Apollo.io, Instantly ou Lemlist para sequências com rastreamento. Para LinkedIn: o Chattie organiza as conversas da inbox, categoriza leads por estágio e controla o timing de follow-up sem automação agressiva. A combinação mais eficiente: Sales Navigator (segmentação) + Chattie (organização LinkedIn) + Apollo ou Instantly (e-mail).' },
  ],
  'linkedin-sales-navigator-vs-gratuito': [
    { q: 'Sales Navigator vale mais a pena para founders ou para SDRs?', a: 'Depende do volume e do uso. Para founders vendendo sozinhos com menos de 20 abordagens por semana, o LinkedIn gratuito com bom método costuma ser suficiente. Para SDRs com metas de volume, a ferramenta compensa mais cedo — especialmente os filtros de seniority e o acesso expandido a perfis fora da rede.' },
    { q: 'Quanto custa o Sales Navigator em reais?', a: 'O preço oficial é USD 99/mês no plano Core (cobrado anualmente) e USD 149/mês no Advanced. A conversão em BRL varia com o câmbio — consulte a página de preços do LinkedIn para o valor atualizado. Em geral, gira entre R$ 500 e R$ 800/mês para o Core.' },
    { q: 'É possível prospectar bem no LinkedIn sem pagar nada?', a: 'Sim — especialmente em volumes baixos e com ICP amplo. O gratuito cobre pesquisa básica por cargo, setor e localização, e permite envio de convites com nota e mensagens para conexões de primeiro grau. O que falta é granularidade de filtro, alertas automáticos e InMails.' },
    { q: 'O Sales Navigator substitui um CRM?', a: 'Não. O Sales Navigator organiza listas de leads e contas dentro da plataforma, mas não substitui um CRM para gestão de pipeline e histórico de relacionamento. Ele tem integração nativa com Salesforce e HubSpot, mas a operação comercial completa ainda precisa de um sistema de registro externo.' },
    { q: 'O que é o Account IQ do Sales Navigator?', a: 'Account IQ é um recurso que agrupa insights sobre empresas salvas — como movimentações recentes, mudanças de liderança, notícias e tendências de crescimento. É útil para preparar abordagens com contexto antes de entrar em contato com um decisor. Disponível nos planos Advanced.' },
    { q: 'Posso cancelar o Sales Navigator se não valer a pena?', a: 'Sim, mas atenção ao modelo de cobrança. O plano anual tem desconto mas cobra o período inteiro — se cancelar antes do vencimento, pode não ter reembolso proporcional. O plano mensal é mais flexível mas mais caro por mês. Se quiser testar, comece pelo mensal e avalie por dois ciclos completos antes de migrar para o anual.' },
  ],
  // ── EN posts ──────────────────────────────────────────────────────────────
  'linkedin-automation-what-is-allowed': [
    { q: 'Can LinkedIn permanently ban my account for using automation?', a: 'Yes, in cases of serious and repeated violations. Most initial restrictions are temporary — from 24 hours to 7 days. Accounts with a history of repeated violations can receive permanent restrictions. The risk is higher for new accounts and for those using high-volume scraping tools.' },
    { q: 'Are tools like Expandi and Waalaxy safe to use?', a: 'It depends on how they are configured. Used with conservative limits (fewer than 50 connections/day), real personalization and outside suspicious hours, the risk is manageable. Used in aggressive default mode, they significantly increase the risk of account restriction.' },
    { q: 'Is there any way to automate LinkedIn with zero ban risk?', a: 'Tools that do not execute actions automatically on the platform — such as social CRMs that organize your conversations and signal follow-up timing — carry essentially zero risk because you execute each action manually. Risk comes when the tool acts on your behalf in LinkedIn without your per-action confirmation.' },
    { q: 'What is the safe daily connection limit on LinkedIn?', a: 'Community consensus across LinkedIn power users points to 50 connections per day as a conservative ceiling for accounts in good standing. New accounts, or those that have previously received warnings, should start much lower — around 10–15 per day — and ramp up gradually over weeks.' },
    { q: 'Does LinkedIn treat founders and SDR teams differently when it comes to automation detection?', a: 'LinkedIn\'s detection systems are account-based, not role-based. But the stakes are different: a founder whose personal profile is their primary commercial asset faces much higher reputational risk from a suspension than a company account used for outbound. That asymmetry should factor into any automation decision.' },
  ],
  'linkedin-prospecting-tools-2026': [
    { q: 'Which LinkedIn prospecting tool is safest for account protection?', a: 'LinkedIn Sales Navigator is safest because it is LinkedIn\'s own product. Chattie is a close second because it does not send automated messages — every message is written and sent by you. Both carry essentially zero account risk. Automation tools that act on your behalf carry progressively higher risk based on volume and detection patterns.' },
    { q: 'Is LinkedIn Sales Navigator worth the price for B2B prospecting?', a: 'For high-volume teams with a well-defined ICP and active use of job change alerts and advanced filters, yes — the time saved in research and the precision of the lists generated justify the cost. For founders or solo operators under 20 outreach touchpoints per week, free LinkedIn with a structured method is often sufficient to start.' },
    { q: 'Can I use multiple LinkedIn prospecting tools at the same time?', a: 'Yes, but with caution. Never stack two automation platforms simultaneously — overlapping automated actions compound account risk. The healthy stack combines tools with different functions: Sales Navigator for targeting, Chattie for conversation management, Apollo or Clay for data enrichment.' },
    { q: 'What is the difference between Expandi and Waalaxy?', a: 'Waalaxy is simpler and has a free tier, making it easier to start with. It also has native email integration for multichannel cadences. Expandi operates via a cloud-based browser rather than a Chrome extension, which is architecturally less detectable by LinkedIn. Expandi also has more granular conditional logic for sequences.' },
    { q: 'How do I know if my prospecting problem is the tool or the message?', a: 'Assume message problem first. Before switching tools, test your outreach message manually — write ten personalized messages without any tool assistance and measure the response rate. If you get above 15%, the tool is not the bottleneck. Below 10% with genuine personalization indicates a targeting or message problem that no tool can fix.' },
    { q: 'Can Chattie replace a CRM entirely?', a: 'Not entirely — Chattie fills the gap between first LinkedIn contact and formal CRM entry. It manages the early conversation stage: organizing DMs, preserving context, signaling follow-up timing. When a lead is ready to move to a formal proposal or contract stage, the history from Chattie complements whatever CRM you use for deals.' },
  ],
  'ai-for-b2b-sales': [
    { q: 'Is AI ready to fully automate B2B prospecting?', a: 'Not for complex B2B with longer sales cycles and multiple stakeholders. AI currently handles well the research, enrichment, prioritization, and timing signals that make outreach more precise — roughly 40–60% of a prospector\'s preparation time. The conversation itself, especially in consultative sales, still requires human judgment and contextual adaptation.' },
    { q: 'What is the difference between AI personalization and template personalization?', a: 'Template personalization inserts merge fields — name, company, job title — into a fixed structure. AI personalization builds the message from actual prospect context: recent posts, company announcements, role changes, pain points inferred from behavior. The difference in reply rates between the two approaches is significant in competitive categories.' },
    { q: 'How do I know if a sales AI tool is actually using AI?', a: 'Ask two questions: what data does it use to make decisions, and does its behavior change based on outcomes? A tool that uses fixed rules regardless of prospect behavior is not AI — it is conditional automation. Genuine AI learns from signals and adapts its recommendations.' },
    { q: 'How long does it take to see ROI from AI in B2B sales?', a: 'Research and enrichment improvements are visible within days to weeks. Reply rate improvements from better targeting and timing: 4–6 weeks of consistent use. Follow-up discipline improvements and pipeline growth: 60–90 days. Forecasting and pattern recognition benefits: one to two quarters of data accumulation.' },
    { q: 'Does using AI in B2B prospecting damage prospect relationships?', a: 'It depends on what AI does. AI that operates in the background — organizing your pipeline, surfacing context, suggesting timing — is invisible to prospects and does not damage relationships. AI that sends autonomous messages that feel templated is detectable by experienced B2B buyers and does damage trust.' },
  ],
  'linkedin-for-b2b-sales': [
    { q: 'How long does it take to build a LinkedIn authority that generates B2B pipeline?', a: 'Expect 60–90 days before you see early signals — inbound connection requests, DMs referencing your content, comments from target accounts. Meaningful pipeline from LinkedIn authority typically materializes between months 4 and 6 for sellers who post consistently 2–3 times per week and engage strategically with their target accounts.' },
    { q: 'Do I need a large LinkedIn following to sell B2B through the platform?', a: 'No. 1,500 highly relevant connections in your ICP outperforms 20,000 general followers for B2B sales. LinkedIn is not a broadcast channel — it is a relationship channel. Reach matters less than relevance. A post seen by 200 decision-makers in your ICP is worth more than a viral post seen by 50,000 people outside it.' },
    { q: 'What should I post on LinkedIn to attract B2B buyers?', a: 'Post about the problems your buyers are trying to solve — in their language, not yours. Share your perspective on industry patterns you observe. Write about specific situations your clients face and how you think about them. Avoid posting about your product features or company updates — buyers do not follow you to learn about your product; they follow you to get smarter about their problems.' },
    { q: 'Are LinkedIn comments more important than posts for B2B sales?', a: 'In the early stages of building presence, yes. Commenting on posts by your target accounts and industry peers reaches beyond your existing network — the comment is visible to all followers of the original post. Strategic commenting on the right conversations can generate more relevant visibility than posting to a small following.' },
  ],
  'linkedin-for-b2b-founders': [
    { q: 'How many LinkedIn connections does a B2B founder need to start generating pipeline?', a: 'You do not need a large network to start. Founders with under 500 connections have generated pipeline from LinkedIn by focusing on targeted outreach to the right people rather than volume. A network of 200 highly relevant decision-makers who engage with your content is worth more than 5,000 loosely connected professionals outside your ICP.' },
    { q: 'Should I use LinkedIn automation as a founder?', a: 'Use it with caution and a clear understanding of what you are automating. Tools that send automated messages without per-message human review are high-risk — they remove the personalization that makes founder outreach work and risk account restrictions. Tools that organize conversations, surface follow-up reminders, and help you track pipeline stage are different: they support your workflow without acting on your behalf.' },
    { q: 'How do I talk about my product without sounding like I am pitching?', a: 'Wait until the prospect has named a problem that your product solves. At that point, you are not pitching — you are responding to something they raised. Spend the first two or three messages asking questions about their situation. When the prospect describes the pain, you can respond: "that is exactly the problem [Product] addresses — would it be useful to walk through how we approach it?" That framing is honest, timely, and does not feel like an unsolicited pitch.' },
    { q: 'How long before founder-led LinkedIn sales generates predictable revenue?', a: 'Early signals — replies to outreach, inbound DMs, calls booked from content — typically appear within 45 to 60 days of consistent execution. Predictable monthly pipeline usually takes 90 to 120 days. Predictable revenue, where you can plan around LinkedIn as a reliable source, takes 4 to 6 months. The founders who see results commit to the 90-day minimum before evaluating whether the channel is working.' },
    { q: 'What kind of LinkedIn content actually brings in B2B buyers?', a: 'Content that names the specific problem your buyers are dealing with — in the exact language they use — consistently performs better than general industry content or product-focused posts. Posts structured around a situation your ICP recognizes generate comments and DMs from people who see themselves in the description. That is the pipeline signal you are looking for.' },
    { q: 'When should a founder hire an AI SDR for LinkedIn instead of doing it manually?', a: 'When the process is documented and the bottleneck is operational — too many conversations to track, too many follow-ups to manage, threads falling through — rather than strategic. An AI SDR is not a replacement for the founder doing early validation work. It is a force-multiplier once the playbook is proven: it keeps the machine running at higher volume without the founder spending more time on it.' },
  ],
  // ── EN posts ──────────────────────────────────────────────────────────────
  'ai-sdr-vs-human-sdr': [
    { q: 'Should an early-stage startup hire an SDR or use AI tools first?', a: 'Neither — founders should do their own outbound first. You need to understand the conversation before you hire someone to have it or automate it. Once you\'ve personally closed 10-15 deals through outbound, then consider whether the constraint is time (hire an SDR) or process efficiency (augment with AI tools).' },
    { q: 'What\'s the realistic headcount impact of adding AI SDR tools?', a: 'In fully deployed AI-assisted SDR workflows, teams typically report productivity increases of 40-80% per SDR — meaning one SDR does the work that previously required 1.5-2. Whether that leads to fewer hires or higher quota depends on company stage and growth targets.' },
    { q: 'Does using AI in sales development damage prospect relationships?', a: 'AI that operates transparently — helping you be more responsive, contextual, and consistent — doesn\'t damage relationships. The risk is in the quality and authenticity of the output, not the presence of AI in the process.' },
  ],
  'linkedin-follow-up-b2b': [
    { q: 'How many times should I follow up with a LinkedIn prospect who isn\'t responding?', a: 'Three touches is a reasonable ceiling for a cold prospect who hasn\'t shown any signal of interest. After that, move to a long-term nurture track — engage with their content occasionally, but stop sending DMs.' },
    { q: 'What\'s the best LinkedIn follow-up message after a prospect said "not now"?', a: 'Wait at least 6–8 weeks. When you follow up, reference the original conversation and give them a specific reason to revisit it — a new customer result, a changed market condition, or a trigger in their own company.' },
    { q: 'Should I mention in my follow-up that I\'m following up?', a: 'No. "I\'m following up on my message from last week" adds no value and makes the message feel like a task. Instead, lead with something new — a piece of content, a different angle, or a relevant observation.' },
  ],
  'linkedin-prospecting-guide': [
    { q: 'How many LinkedIn connection requests should I send per day?', a: 'Stay under 20–25 per day to avoid triggering LinkedIn\'s limits. Quality matters more than volume — twenty targeted, personalized connection requests outperform 200 generic ones in both acceptance rate and conversation quality.' },
    { q: 'Should I use LinkedIn InMail or connection requests for prospecting?', a: 'Start with connection requests — they\'re free and, when targeted correctly, have reasonable acceptance rates. InMail is useful when the prospect is definitively outside your existing network and you can\'t find a warm path in.' },
    { q: 'What\'s a good LinkedIn response rate to aim for?', a: 'For cold outreach with no prior relationship, 10–20% response rate is solid. With warmer context — you\'ve engaged with their content, you have mutual connections, you reference something specific — 25–35% is achievable.' },
  ],
  'linkedin-prospecting-with-ai': [
    { q: 'Does LinkedIn allow AI prospecting tools?', a: 'LinkedIn\'s Terms of Service prohibit scraping profile data at scale and fully automated actions — mass connection sending and automated message sequences sent without per-message user action. Tools that assist your research and organize conversations without taking automated actions on the platform are generally compliant.' },
    { q: 'How many LinkedIn messages should I send per day with AI assistance?', a: 'With AI assistance, 10-15 highly personalized, contextually timed messages per day consistently outperform 100 generic ones. If your acceptance rate drops below 30%, the bottleneck is targeting and message relevance, not volume.' },
    { q: 'What\'s the difference between AI-assisted LinkedIn prospecting and LinkedIn automation?', a: 'LinkedIn automation executes pre-set actions on a schedule regardless of context. AI-assisted prospecting uses intelligence to inform what a human does — you read signals, adapt your message, and decide when to act.' },
  ],
  'linkedin-social-selling-guide': [
    { q: 'What is the LinkedIn Social Selling Index (SSI)?', a: 'The SSI is LinkedIn\'s scoring system that measures how effectively you use the platform for social selling across four pillars: professional brand, finding the right people, engaging with insights, and building relationships. Scores above 70 correlate with significantly better prospecting outcomes.' },
    { q: 'How long does LinkedIn social selling take to show results?', a: 'Expect 60–90 days before you see consistent inbound pipeline from content. Outreach results can come faster — within the first 2–4 weeks if you\'re targeting correctly and personalizing well. The compounding returns kick in at 6–12 months of consistent effort.' },
    { q: 'How often should I post on LinkedIn for social selling?', a: 'Two to three times per week is a sustainable baseline for most B2B sellers. Daily is better for reach, but only if you can maintain quality. Dropping from daily to once a week hurts your algorithmic momentum more than posting 3x weekly from the start.' },
  ],
  'building-linkedin-authority-for-b2b': [
    { q: 'How long does it take to build LinkedIn authority for B2B?', a: 'The first 30 days produce almost no visible results — your profile is rebuilt and you\'re building habits, but the audience doesn\'t know you yet. By day 60, you start to see early indicators: higher connection acceptance rates, occasional inbound engagement from prospects, profile views from people in your ICP. By day 90, with consistent effort, you should have measurable changes in outreach response rates and at least a few inbound pipeline conversations initiated through LinkedIn.' },
    { q: 'How many followers do you need to have LinkedIn authority?', a: 'You don\'t need a large following to build authority for B2B sales purposes. Authority is vertical, not horizontal — it\'s about depth of recognition among your specific ICP, not breadth of reach across a general audience. A seller with 800 followers, 600 of whom are exactly the buyers they target, is in a stronger position than someone with 15,000 followers accumulated through viral posts that attracted the wrong audience.' },
    { q: 'What should I post on LinkedIn to build B2B authority?', a: 'Post about the intersection of your genuine expertise and your buyer\'s real problems. Pick 4–6 specific topics that sit at that intersection — your content pillars — and rotate through them consistently. Every week, include at least one post that takes a specific, defensible position rather than offering generic advice. The POV post format generates more trust-building engagement than educational content because it reveals your judgment, not just your knowledge.' },
    { q: 'Is it better to post every day or a few times per week on LinkedIn?', a: 'For authority building, consistency matters more than frequency. Two to three high-quality posts per week, sustained for 12 weeks, produces better results than daily posting that declines in quality. If you can maintain quality, daily posting accelerates reach. But the more common outcome of daily posting is gradual dilution — frequency stays up while substance drops off, and your audience learns to scroll past you.' },
    { q: 'How is LinkedIn authority different from LinkedIn social selling?', a: 'Social selling is the broader practice of using LinkedIn to find, nurture, and convert prospects through relationship-building. LinkedIn authority is a component of social selling — specifically the credibility that makes every other social selling activity more effective. You can do social selling without authority, but building authority makes connection requests, engagement, and outreach dramatically more effective.' },
  ],
  'linkedin-social-selling-index-ssi-guide': [
    { q: 'What is a good LinkedIn SSI score?', a: 'For B2B sellers who use LinkedIn as a primary prospecting channel, 70 or above is the practical target. Scores in the 51–70 range indicate consistent activity with room to improve. Scores below 50 typically reflect either an incomplete profile or irregular engagement. LinkedIn\'s internal data shows the strongest correlation between SSI and sales outcomes for sellers in the 70+ range.' },
    { q: 'How often does LinkedIn update your SSI score?', a: 'LinkedIn updates SSI scores every 24 hours. The score reflects activity from the trailing 90 days, with more recent activity weighted more heavily. This means improvements you make today will appear in tomorrow\'s score, but erasing a gap takes weeks of consistent activity — not a single day of effort.' },
    { q: 'Does LinkedIn SSI affect post reach or algorithmic visibility?', a: 'No. LinkedIn has not confirmed any direct connection between SSI score and content reach. A high SSI does not give your posts broader distribution. What it does reflect is a pattern of behaviors — regular posting, active engagement, targeted connection-building — that independently tend to produce better pipeline results. Optimize for the behaviors, not for the score.' },
    { q: 'Can I have a high SSI without Sales Navigator?', a: 'Yes. Three of the four pillars (Professional Brand, Engage With Insights, and Build Relationships) score based on behaviors available to all LinkedIn users. Pillar 2 (Find the Right People) has more inputs available to Sales Navigator subscribers, but free users can still score reasonably by using LinkedIn\'s standard Boolean search, saving searches, and actively viewing prospect profiles. A committed free user can reach 65–70 SSI.' },
    { q: 'How long does it take to improve LinkedIn SSI?', a: 'Pillar 1 (Professional Brand) can improve within one week through profile optimization and publishing. Pillars 2 and 3 typically show meaningful movement within two to three weeks of daily activity. Pillar 4 (Build Relationships) is the slowest — expect four to six weeks before connection-building habits produce score movement. Total time to go from a score of 40 to a score of 70: approximately 30–45 days of consistent daily effort.' },
    { q: 'Does SSI matter if I am not in a formal sales role?', a: 'SSI is most relevant for founders, SDRs, AEs, consultants, and anyone who actively prospects through LinkedIn. If your LinkedIn use is primarily for networking or passive visibility, SSI is less actionable. That said, the four behaviors SSI measures — a credible profile, targeted search, meaningful engagement, and relationship-building — are valuable for anyone building a professional presence, not just salespeople.' },
  ],
  'linkedin-social-selling-vs-spam': [
    { q: 'What is the difference between social selling and spamming on LinkedIn?', a: 'Social selling is relationship-led outreach defined by relevance, context, and genuine personalization. Spam is volume-first outreach that ignores the recipient\'s context and treats all prospects identically regardless of individual signal. The clearest behavioral markers of social selling are: research before contact, a first message that doesn\'t pitch, follow-ups that add new context, and a defined stopping criterion.' },
    { q: 'Does using automation tools automatically make LinkedIn outreach spam?', a: 'No. Automation is a tool, not a category of behavior. Automation used to scale volume without improving the quality or relevance of individual contacts makes spam worse. Automation used to improve ICP targeting, surface follow-up timing, or draft messages that humans then review and personalize can support social selling without compromising it.' },
    { q: 'What reply rate should I expect from LinkedIn social selling outreach?', a: 'Reply rates vary considerably by industry, seniority level, and message quality. Outreach with genuine personalization and no pitch in the first message tends to see reply rates between 15–30% among people who accepted the connection. Generic sequences typically see 3–8% among the same population. The most meaningful benchmark is your own historical data.' },
    { q: 'How many follow-up messages are too many?', a: 'Two to four follow-up messages over two to three weeks is the range most experienced LinkedIn prospectors converge on. Beyond that, the incremental value of additional messages decreases sharply and the probability of a negative experience for the recipient increases. The more important variable than message count is what each follow-up adds: new information, a different framing, a relevant development.' },
    { q: 'Can I tell if my LinkedIn outreach is being perceived as spam?', a: 'Yes, through several signals. A connection request acceptance rate below 25% suggests your request framing isn\'t landing well. A reply rate below 5–8% among connected prospects suggests first messages aren\'t resonating. The indirect test: read your last five sent messages as if you were receiving them from a stranger. If you\'d delete them without responding, you\'ve answered the question.' },
    { q: 'Does LinkedIn penalize spam outreach?', a: 'LinkedIn actively monitors behavioral signals associated with spam: high connection rejection rates, reports of "I don\'t know this person," message sending velocity, and patterns consistent with automation misuse. The consequences escalate from temporary sending restrictions to account suspension. Beyond platform penalties, the channel-level consequence is that genuine replies become harder to generate over time.' },
  ],
  'what-is-an-ai-sdr': [
    { q: 'Is an AI SDR the same as a sales automation tool?', a: 'Not exactly. Sales automation tools execute pre-defined sequences — they send message A, then B, then C on a fixed schedule, regardless of what happened in between. An AI SDR uses intelligence to adapt: if a prospect engaged with your post, the AI adjusts the next action accordingly.' },
    { q: 'Can an AI SDR replace a human SDR entirely?', a: 'In high-volume, low-touch sales motions — sub-$5k ACV, transactional buying process, short cycles — autonomous AI SDRs can handle most top-of-funnel work. In consultative B2B sales with complex buying committees and longer cycles, the human SDR remains essential.' },
    { q: 'How is Chattie different from other AI SDRs?', a: 'Chattie is an assisted AI SDR focused specifically on LinkedIn. It doesn\'t send messages automatically — you write and send every message yourself. What Chattie does: organizes your conversations by pipeline stage, surfaces who needs follow-up, and preserves full conversation context.' },
  ],
  // ── Phase A — PT-BR new posts ──────────────────────────────────────────────
  'mensagem-inmail-linkedin-exemplos': [
    { q: 'InMail é pago?', a: 'Sim. O recurso de InMail está disponível apenas em contas LinkedIn Premium (Premium Career, Business, Sales Navigator ou Recruiter). Cada plano tem uma cota mensal de créditos de InMail. Se o prospect responde sua mensagem, o crédito é devolvido — o que torna a taxa de resposta ainda mais importante financeiramente.' },
    { q: 'Qual a diferença entre InMail e mensagem normal?', a: 'A mensagem normal só pode ser enviada para suas conexões de 1º grau. A InMail permite contatar qualquer usuário do LinkedIn, independentemente do grau de conexão. Além disso, a InMail tem linha de assunto, o que cria um contexto de e-mail dentro da plataforma — algo que a mensagem comum não oferece.' },
    { q: 'Qual taxa de resposta esperar de InMails B2B?', a: 'Depende do nível de personalização. InMails genéricas ficam abaixo de 5%. Com personalização básica (nome + cargo), chegam a 10–15%. Com gatilho de contexto real (post recente, mudança de cargo, evento da empresa), é possível atingir 25–35%. A média geral de InMails B2B fica entre 10% e 20%.' },
    { q: 'Posso enviar InMail sem Sales Navigator?', a: 'Sim, mas com menos créditos. O LinkedIn Premium comum dá entre 5 e 15 créditos mensais, dependendo do plano. O Sales Navigator oferece mais créditos e, mais importante, ferramentas de segmentação que ajudam a identificar quem vale o crédito. Para prospecção B2B em volume, o Sales Navigator faz diferença.' },
  ],
  'como-escrever-mensagem-linkedin-sem-parecer-vendedor': [
    { q: 'Por que minha mensagem não recebe resposta no LinkedIn?', a: 'As causas mais comuns são: abertura genérica sem contexto específico, pitch de produto na primeira mensagem, CTA que pede muito comprometimento logo no início (reunião de 30 minutos), ou mensagem longa demais que o prospect não leu até o final. Revise esses quatro pontos antes de mudar qualquer outra coisa.' },
    { q: 'Devo mencionar meu produto na primeira mensagem?', a: 'Não como regra geral. O objetivo da primeira mensagem é conseguir uma resposta — não fechar uma venda. Mencionar o produto antes de criar contexto e confiança aumenta a barreira de resposta. Existe uma exceção: se o prospect já demonstrou interesse (visitou seu perfil, reagiu a um post seu), aí faz sentido ser mais direto.' },
    { q: 'Como personalizar mensagem sem gastar 20 minutos por prospect?', a: 'Defina um processo de coleta de contexto antes de escrever: 3 minutos no perfil (cargo atual, tempo na empresa, posts recentes), 2 minutos nas notícias da empresa (vagas abertas, expansão, produto novo). Com esse contexto em mãos, a mensagem escreve em 5 minutos. Para volume maior, ferramentas de IA que leem o perfil e geram um rascunho reduzem esse tempo para menos de 2 minutos por prospect.' },
    { q: 'Qual o tamanho ideal de uma mensagem de prospecção no LinkedIn?', a: 'Entre 60 e 120 palavras para a primeira mensagem. O suficiente para estabelecer contexto, levantar um problema relevante e fazer uma pergunta. Mais do que isso, o prospect não lê até o final. Menos do que isso, falta substância para criar interesse.' },
  ],
  'filtros-avancados-linkedin-sales-navigator': [
    { q: 'Quantos filtros posso combinar no Sales Navigator ao mesmo tempo?', a: 'Não há um limite fixo. Na prática, o Sales Navigator permite combinar dezenas de critérios simultaneamente. O limite real não é técnico: é a precisão da lista resultante. A recomendação é começar com 4-6 filtros principais, avaliar o tamanho da lista (idealmente entre 100 e 500 resultados para trabalho manual), e ajustar conforme necessário.' },
    { q: 'O filtro de job change funciona para mudanças de empresa ou só de cargo?', a: 'Os dois. O filtro "Changed jobs in the past 90 days" captura tanto mudanças de empresa quanto promoções e mudanças de cargo dentro da mesma empresa. Para prospecção B2B, ambos os casos são relevantes: quem trocou de empresa está num ambiente novo sem contratos herdados, e quem foi promovido ganhou orçamento novo.' },
    { q: 'Sales Navigator atualiza os resultados dos filtros automaticamente?', a: 'Os resultados de uma busca manual não se atualizam sozinhos — você precisa refazer a busca. O que se atualiza automaticamente são as Saved Searches: ao salvar uma busca, o Sales Navigator re-executa os filtros periodicamente e notifica sobre novos leads que entraram nos critérios desde a última verificação.' },
    { q: 'Como usar o Sales Navigator para Account-Based Marketing (ABM)?', a: 'O fluxo de ABM no Sales Navigator tem duas etapas: primeiro, montar a lista de contas-alvo via Account Search com critérios certos; depois, dentro dessas contas salvas, usar o Lead Search filtrando "contacts at saved accounts" para identificar os decision makers relevantes. Salve as contas e leads para receber alertas de mudanças.' },
  ],
  'como-exportar-leads-sales-navigator': [
    { q: 'O LinkedIn permite exportar dados de perfis para CSV diretamente?', a: 'Não de forma geral. O LinkedIn não oferece um botão de exportação para CSV acessível a todos os usuários do Sales Navigator. A exportação de dados de leads só está disponível via integração com CRMs oficiais (Salesforce ou HubSpot) nos planos Advanced e Advanced Plus. Fora dessas integrações, o LinkedIn não fornece mecanismo nativo de exportação em massa de dados de perfis.' },
    { q: 'Como exportar leads do Sales Navigator sem CRM pago?', a: 'Sem um CRM integrado, as opções oficiais são limitadas a copiar dados manualmente. A alternativa mais prática é usar ferramentas de enriquecimento como Apollo.io — que tem plano gratuito com créditos limitados — para capturar dados de perfis visitados via extensão de Chrome. Você visita os perfis manualmente no Sales Navigator, e o Apollo captura e enriquece os dados.' },
    { q: 'Usar extensão para exportar leads do Sales Navigator pode banir minha conta?', a: 'Sim. Extensões que automatizam a coleta de dados de perfis em massa violam os Termos de Serviço do LinkedIn. O LinkedIn detecta ativamente comportamentos não humanos e aplica restrições que vão desde limitação temporária de funcionalidades até suspensão permanente da conta. Para quem usa o LinkedIn como canal principal de prospecção, o risco não compensa.' },
    { q: 'Os dados exportados do Sales Navigator ficam atualizados automaticamente?', a: 'Não. Exportações são snapshots estáticos do momento da exportação. Uma vez que os dados saem do Sales Navigator para um CSV ou CRM, eles não se atualizam automaticamente quando a pessoa muda de cargo, empresa, ou outras informações do perfil. É por isso que listas exportadas deterioram com o tempo.' },
  ],
  'linkedin-headline-para-vendas-b2b': [
    { q: 'Quantos caracteres tem o headline do LinkedIn?', a: 'O LinkedIn permite até 220 caracteres no headline. A maioria dos perfis usa menos de 80 caracteres — o que significa que você tem 140 caracteres de vantagem sobre a concorrência se usar a fórmula correta. Em dispositivos móveis, os primeiros 60-70 caracteres aparecem sem precisar expandir, então coloque o elemento mais importante no início.' },
    { q: 'Devo colocar emojis no headline do LinkedIn para vendas B2B?', a: 'Com moderação, emojis podem ajudar na legibilidade. Use no máximo 1-2 emojis por headline e escolha os neutros e profissionais. Emojis excessivos transmitem falta de seriedade para compradores em segmentos mais conservadores como financeiro, jurídico ou industrial. Teste com e sem e observe o impacto nas visualizações de perfil.' },
    { q: 'O headline do LinkedIn aparece nas buscas do Google?', a: 'Sim. O LinkedIn indexa perfis publicamente e o Google frequentemente ranqueia perfis do LinkedIn nas primeiras posições para buscas de pessoas. Palavras-chave relevantes no headline aumentam a chance de aparecer em buscas relacionadas. Inclua naturalmente os termos que seu cliente ideal usaria ao buscar alguém com o que você oferece.' },
    { q: 'Devo escrever o headline em português ou inglês?', a: 'Se você vende para empresas brasileiras, português é o padrão. A maioria dos compradores B2B no Brasil usa o LinkedIn em português e pesquisa em português. A exceção: se você prospecta multinacionais com processos internos em inglês, um headline em inglês pode ampliar o alcance — mas vai reduzir a conversão no mercado local.' },
  ],
  'linkedin-about-section-exemplos-para-vendedores': [
    { q: 'Quantos caracteres tem a seção Sobre do LinkedIn?', a: 'A seção Sobre do LinkedIn permite até 2.600 caracteres. O LinkedIn exibe apenas os primeiros 300 caracteres aproximadamente antes do botão "ver mais". Isso reforça a importância de colocar o elemento mais forte — o gancho — absolutamente no início do texto, antes de qualquer linha de apresentação ou contexto.' },
    { q: 'Devo escrever em 1ª ou 3ª pessoa na seção Sobre?', a: 'Primeira pessoa, sempre. A seção Sobre é um espaço de voz pessoal — e compradores B2B que chegam até lá estão avaliando se querem uma conversa com você. Terceira pessoa soa como uma bio de assessoria de imprensa, cria distância desnecessária. Primeira pessoa é direta, é humana, e converte melhor em qualquer contexto de vendas.' },
    { q: 'O texto da seção Sobre aparece nas buscas do Google?', a: 'Sim, mas com limitações. O Google indexa a versão pública do perfil do LinkedIn, e o conteúdo da seção Sobre é parcialmente indexado. Palavras-chave relevantes podem contribuir para que seu perfil apareça em buscas específicas. Mas o impacto principal da seção Sobre na visibilidade do Google é secundário ao headline, que tem mais peso no título da página indexada.' },
    { q: 'Com que frequência devo atualizar a seção Sobre?', a: 'Sempre que mudar de foco comercial, de segmento de cliente ou de oferta principal. Para ajustes táticos — um número novo, um resultado recente, um CTA diferente — uma revisão trimestral é suficiente. Trate como uma página de vendas ativa: se você mudaria o copy da landing page, mude a seção Sobre.' },
  ],
  'mensagem-de-reconexao-linkedin': [
    { q: 'Depois de quanto tempo é aceitável enviar mensagem de reconexão no LinkedIn?', a: 'Depende do contexto. Para leads que sumiram no meio de uma conversa ativa, de 14 a 21 dias é o período certo. Para prospects que disseram "não agora" ou conexões frias, espere pelo menos 90 dias. Para contatos de eventos, reconecte em até 30 dias — depois disso o contexto se perde.' },
    { q: 'Devo mencionar que a conversa parou na mensagem de reconexão?', a: 'Sim, quando houve uma conversa real. Fingir que o histórico não existe soa artificial e pode gerar estranheza no prospect. A referência ao passado deve ser leve — "a gente tinha começado uma conversa sobre X" — sem culpar ou cobrar. O objetivo é criar familiaridade, não criar constrangimento.' },
    { q: 'Qual o tamanho ideal de uma mensagem de reconexão?', a: 'Entre 3 e 5 linhas curtas. O prospect não tem contexto fresco para absorver uma mensagem longa. Seja breve, específico e termine com um CTA claro de baixo atrito. Se precisar de mais espaço para contextualizar, o problema não é o tamanho — é o pitch está embutido na reconexão cedo demais.' },
    { q: 'E se o prospect ignorar a mensagem de reconexão também?', a: 'Espere mais 30 a 60 dias, encontre um novo gatilho e tente uma vez mais. Após duas tentativas de reconexão sem resposta, adicione o contato a um fluxo passivo — continue engajando com os posts deles no feed sem enviar mensagens diretas. O objetivo é manter presença sem pressão.' },
  ],
  // ── Phase B — EN new posts ───────────────────────────────────────────────────
  'qualify-linkedin-leads-with-ai': [
    { q: 'What does qualifying a lead on LinkedIn actually mean?', a: 'Qualifying a LinkedIn lead means determining whether a prospect simultaneously has a relevant problem, the authority or influence to act on it, and timing that suggests the conversation is useful now. ICP fit is only the first filter. Qualification determines who, within the ICP, deserves priority attention at this moment — based on behavioral signals, not static criteria.' },
    { q: 'Can AI automatically qualify leads on LinkedIn?', a: 'AI can aggregate behavioral signals and prioritize prospects based on recent activity, but it does not replace human judgment about product fit and business context. The correct role of AI in qualification is reducing research work and making signals visible, not making the decision about who to qualify. That decision still requires the context that the seller has about the market, the product, and the prospect.' },
    { q: 'How many signals do I need before reaching out to a prospect?', a: 'One strong signal — such as a profile visit combined with a recent job change — already justifies a personalized approach. Three or more simultaneous signals indicate that timing is hot and the approach can be more direct. Zero signals: continue passive warming through content engagement before attempting a direct message.' },
    { q: 'What is the difference between qualification and prospecting on LinkedIn?', a: 'Prospecting is finding prospects who match the ICP — a question of targeting and list volume. Qualification is determining, among those prospects, who has purchase timing and deserves priority outreach now — a question of signal-based prioritization. Most LinkedIn strategies underinvest in qualification, which produces large lists with low-quality conversations.' },
  ],
  'personalize-linkedin-messages-at-scale': [
    { q: 'Is it possible to personalize LinkedIn messages at scale without AI?', a: 'It is possible, but with a practical ceiling. Without AI to aggregate context, real personalization is viable up to roughly 10 to 15 active simultaneous prospects. Above that, research per prospect starts consuming more time than writing — and personalization quality drops inevitably. AI extends the practical limit to 40 to 50 conversations with personalization maintained.' },
    { q: 'How do I know if my personalization is actually working?', a: 'Reply rate is the primary indicator. For outreach with genuinely relevant context, 15 to 25% reply rates are achievable on LinkedIn. Below 10%, the problem is usually in personalization quality or context relevance — not in the channel. A practical test: ask someone outside your company to read your last five sent messages and identify the specific context behind each one.' },
    { q: 'Do I need to personalize follow-up messages too?', a: 'Yes — and follow-ups have an advantage: you already have the context of the previous conversation. A follow-up that references what was discussed and adds something new is radically more effective than just checking in. The practical rule: no new context means no new message. Engage with the prospect\'s public content until you have a real trigger to re-engage.' },
    { q: 'What is the ideal length for a personalized LinkedIn message in B2B?', a: 'Messages between 50 and 120 words consistently perform better on first outreach. Personalization should be apparent in the first or second line — it should not require the prospect to reach the end to notice it. If you need more than 120 words to make your point, the proposition probably is not clear yet.' },
  ],
  'optimize-linkedin-profile-for-b2b-sales': [
    { q: 'How often should I update my LinkedIn profile?', a: 'Every 3 to 6 months, or whenever you change roles, launch a product, hit a notable result, or shift your ideal customer focus. The headline and About section are the most critical — they should always reflect your current commercial positioning. An outdated headline is actively hurting your conversion rate.' },
    { q: 'Should I write my LinkedIn profile in English even if I sell in non-English markets?', a: 'It depends on your primary buyer. If your ICP operates primarily in English — multinationals, international tech companies — an English profile can expand your reach significantly. If you are selling to local SMBs who operate in their native language, write in that language. Optimize for your primary buyer\'s language first.' },
    { q: 'Is LinkedIn Premium worth it for B2B sales prospecting?', a: 'For active prospecting at moderate volume, LinkedIn Free plus Sales Navigator is more cost-effective than Basic Premium. Sales Navigator offers the features that directly drive results: job change alerts, seniority and company-size filters, account lists, and profile view notifications.' },
    { q: 'What is the biggest mistake sellers make in their LinkedIn About section?', a: 'Writing about themselves instead of the buyer. Most About sections are mini-autobiographies. Buyers do not care about your journey — they care whether you can solve their specific problem. The first paragraph of your About section should name the problem you solve, for whom, and with what kind of result.' },
  ],
  'crm-for-social-selling': [
    { q: 'What is a social CRM, exactly?', a: 'A social CRM is a tool that organizes commercial conversations on social networks — especially LinkedIn — from the first contact through lead qualification. Unlike traditional CRMs that track formal deals, a social CRM tracks the pre-pipeline stage: the conversations that have not yet become formal opportunities but might, with the right follow-up at the right time.' },
    { q: 'What is the difference between a social CRM and a traditional CRM?', a: 'Traditional CRMs (Salesforce, HubSpot, Pipedrive) operate in the in-pipeline stage — they track opportunities that already exist as formal records. A social CRM operates upstream, in the pre-pipeline stage, where relationships are being built and interest is being gauged. The social CRM feeds qualified, warmed-up leads into the traditional CRM with context already built up.' },
    { q: 'Can I just use LinkedIn Sales Navigator as my social CRM?', a: 'Sales Navigator is excellent for finding and filtering prospects, and it has basic CRM features. However, it does not organize your actual conversations or surface follow-up timing based on conversation status. It is a prospecting and research tool — Sales Navigator helps you find the right people; a social CRM helps you manage the conversations with those people once contact has been made.' },
    { q: 'At what volume does a social CRM become necessary?', a: 'A spreadsheet is manageable when you are running 10 to 15 active conversations per week. Once you are consistently above 20 to 25 active conversations in various stages, the cost of manual tracking — lost leads, missed follow-ups, context decay — starts to exceed the cost of the tool.' },
  ],
  'linkedin-for-qualified-lead-generation': [
    { q: 'How many qualified leads can I realistically generate on LinkedIn per month?', a: 'Founders and SDRs with a solid method typically generate 15 to 40 qualified conversations per month without aggressive automation. With well-calibrated tools, that number can scale — but quality tends to drop if personalization is not maintained at higher volumes.' },
    { q: 'What is the difference between a LinkedIn connection and a qualified lead?', a: 'A connection is anyone who accepted your invite. A qualified lead is someone who has shown genuine interest: they responded to your message, asked a specific question about what you offer, or signaled openness to a conversation. Not every connection becomes a lead — the goal is to identify which ones are worth nurturing.' },
    { q: 'How do I qualify a lead within LinkedIn without moving off-platform too early?', a: 'Watch for engagement signals: did they respond with more than one sentence? Did they ask a follow-up question? Did they mention a specific problem? These are qualification signals. Tools like Chattie help you categorize leads by intent level and maintain conversation history so you can act at the right moment.' },
    { q: 'Is it better to generate leads through content or active prospecting?', a: 'Both, and they work best together. Content attracts and warms leads — so when you reach out, the prospect already has some familiarity with you. Active prospecting creates velocity — you do not wait for the lead to find you. Content alone is a showcase; prospecting alone feels cold. Together, they compound.' },
  ],
  'linkedin-mistakes-killing-your-pipeline': [
    { q: 'Why are my LinkedIn messages getting no replies?', a: 'The most common causes: generic message without context, outreach too early with no warm-up, pitch in the first message, or a weak profile that does not support what you are saying. Fix one of these at a time and track the impact on your reply rate.' },
    { q: 'How do I know if my LinkedIn outreach is actually working?', a: 'Track three numbers: connection acceptance rate (aim for above 30%), reply rate to first message (target: above 15%), and how many conversations advance to a call or next step. If any of those numbers is significantly below target, the problem is in that specific stage — focus your optimization there.' },
    { q: 'How many follow-up messages are acceptable before moving on?', a: 'Two to three follow-ups are typically enough, spaced 5 to 10 days apart. After the third with no response, pause for 30 days and re-approach with a completely different angle — or redirect your energy to more receptive leads.' },
    { q: 'Should I use automation to send LinkedIn messages?', a: 'With extreme caution. Mass automation increases the risk of account restriction and undermines the personalization that makes LinkedIn outreach work. Tools that organize and prioritize (like Chattie) are generally safer and more effective than tools that blast messages at volume.' },
  ],
  'ideal-customer-profile-for-linkedin-b2b': [
    { q: 'What is an ICP and why does it matter for LinkedIn prospecting?', a: 'ICP (Ideal Customer Profile) is a precise description of the type of company and the type of person most likely to buy your product and succeed with it. On LinkedIn, ICP matters because the platform has over a billion users — without precise filters, you prospect the wrong people and waste time and reputation. With a well-defined ICP, reply rates increase consistently.' },
    { q: 'What is the difference between ICP and persona?', a: 'ICP defines the type of company (firmographics, size, industry, stage). Persona defines the individual within that company (title, seniority, motivations, pain points). For LinkedIn prospecting, you need both: ICP defines which companies you work with, persona defines which people within those companies you talk to.' },
    { q: 'How many ICP personas should I work with at the same time?', a: 'For founders and solo SDRs, working with more than two personas simultaneously is a recipe for generic outreach. Each additional persona fragments attention and makes real personalization harder. Pick the persona with the highest conversion potential, validate it, and only then expand.' },
    { q: 'How do I know if my ICP is wrong without waiting months for data?', a: 'The fastest signal is reply rate to your first message. If you are approaching people with reasonable personalization and reply rate is consistently below 10%, your ICP is likely off. You do not need six months of data: 30 personalized outreach attempts with a sub-10% reply rate is already sufficient evidence to revise.' },
  ],
  'linkedin-b2b-prospecting-cadence': [
    { q: 'How many touchpoints are the maximum for a LinkedIn cadence?', a: 'Five touchpoints over 30 days is the reasonable limit for a cold cadence. More than that without any response is pressure — and on LinkedIn, pressure has reputation consequences. If the prospect has not responded after five well-spaced attempts, pausing the cadence and returning in 60 to 90 days with a new trigger is more effective than continuing to push.' },
    { q: 'How long should I wait between the connection request and the first message?', a: 'Wait for the prospect to accept before sending any message. After acceptance, wait 24 to 48 hours for the first message. Sending at the exact moment acceptance happens signals automation and reduces perceived personalization. The 24-to-48-hour window is short enough to show attentiveness without appearing like surveillance.' },
    { q: 'Should I use Sales Navigator to manage LinkedIn cadences?', a: 'Sales Navigator is useful for prospect identification and monitoring — job change alerts, advanced search filters, CRM integration. But it is not a cadence management tool. To track where each prospect is in the sequence and when to send the next touchpoint, you need an additional layer — whether that is a structured spreadsheet, CRM, or a platform like Chattie built for this LinkedIn workflow.' },
    { q: 'How should I approach a prospect who declined my connection request?', a: 'If a prospect declined, do not resend immediately. Wait at least 30 days before trying again — and when you do, change the context of the connection note. If the decline is recurring, consider alternative approaches: engage with their content publicly, request an introduction through a mutual connection, or wait for a stronger context trigger.' },
  ],
  // ── Phase C: PT-BR posts ─────────────────────────────────────────────────
  'social-selling-index-linkedin': [
    { q: 'O Social Selling Index é gratuito?', a: 'Sim. O SSI básico está disponível para qualquer usuário do LinkedIn, inclusive nas contas gratuitas, acessando diretamente linkedin.com/sales/ssi. Usuários com Sales Navigator têm acesso a dados históricos e comparações mais detalhadas dentro do painel do Sales Navigator, mas o score em si não exige assinatura paga.' },
    { q: 'Um SSI alto garante mais vendas?', a: 'Não. O SSI mede comportamentos associados a boas práticas de social selling, mas não garante conversão. Um score alto indica que você está usando a plataforma de forma estratégica — perfil otimizado, prospecção qualificada, engajamento consistente, construção de rede relevante. Esses comportamentos aumentam as probabilidades de resultado, mas o SSI por si só não fecha negócios. A qualidade da abordagem, a relevância da oferta e o fit com o ICP são os fatores decisivos.' },
    { q: 'Com que frequência o SSI é atualizado?', a: 'O SSI é atualizado diariamente pelo LinkedIn. Variações de 1 a 3 pontos entre dias consecutivos são normais e refletem o peso decrescente de ações mais antigas. Se você teve uma semana intensa de atividade e depois ficou inativo por alguns dias, o score tende a cair ligeiramente antes de estabilizar. O que importa é a tendência semanal e mensal, não o número do dia.' },
    { q: 'Meu SSI afeta o alcance dos meus posts no LinkedIn?', a: 'O LinkedIn não confirma oficialmente uma relação direta entre SSI e alcance de posts. Os comportamentos que elevam o SSI — publicar conteúdo relevante, engajar com outros usuários, ter uma rede ativa — são os mesmos que o algoritmo do LinkedIn recompensa com maior distribuição. Se o seu SSI está crescendo por razões corretas, é razoável esperar correlação com maior alcance — mas a causalidade vai no sentido inverso: a qualidade dos comportamentos impacta os dois, não o score em si.' },
  ],
  'como-construir-autoridade-linkedin-b2b': [
    { q: 'Quanto tempo leva para construir autoridade no LinkedIn B2B?', a: 'Os primeiros sinais de autoridade — pedidos de conexão aceitos mais facilmente, respostas mais receptivas a mensagens, comentários espontâneos de prospects — costumam aparecer entre 60 e 90 dias de execução consistente. Uma presença reconhecível dentro do seu nicho, com inbound espontâneo e posicionamento consolidado, leva de 6 a 12 meses.' },
    { q: 'Preciso postar todo dia para ter autoridade no LinkedIn?', a: 'Não. Postar todo dia pode prejudicar se a qualidade cair pela pressão de volume. O que constrói autoridade é consistência temática e qualidade percebida — não frequência máxima. Dois ou três posts por semana com profundidade e perspectiva genuína superam sete posts diários genéricos em qualquer janela de tempo.' },
    { q: 'Como saber se meu conteúdo está funcionando para vendas B2B?', a: 'Os indicadores que importam comercialmente: (1) quem está curtindo e comentando — são prospects do seu ICP ou audiência genérica? (2) Você está recebendo pedidos de conexão inbound de pessoas do seu público-alvo? (3) Alguém mencionou seu conteúdo em uma conversa comercial? (4) Sua taxa de aceitação de pedidos de conexão está crescendo? Se os números de engajamento são altos mas nenhum desses sinais aparece, o conteúdo pode estar bem distribuído para a audiência errada.' },
    { q: 'É possível ter autoridade no LinkedIn sem muitos seguidores?', a: 'Sim — e esse é um dos pontos mais mal compreendidos sobre autoridade no LinkedIn B2B. Um founder com 800 conexões altamente qualificadas (decisores do setor que ele atende, ex-clientes, parceiros estratégicos) e que publica conteúdo relevante para esse grupo tem mais autoridade comercial do que um perfil com 50.000 seguidores genéricos. Profundidade com o público certo é a métrica que importa.' },
  ],
  'social-selling-vs-spam-linkedin': [
    { q: 'Usar ferramentas de automação no LinkedIn é spam?', a: 'Não necessariamente. Automação é um meio, não uma característica da mensagem. Uma ferramenta de automação bem configurada, com critérios de ICP claros, personalização real e limites de volume razoáveis, pode operar dentro dos parâmetros de social selling. O problema é quando a automação é usada para escalar volume sem critério — aí a automação amplifica o spam.' },
    { q: 'Quantas mensagens posso enviar por dia sem ser spam?', a: 'O número em si não define spam — a qualidade define. Na prática, contas que operam com qualidade tendem a enviar menos mensagens por dia exatamente porque passam mais tempo qualificando quem recebe mensagem. Uma operação de 20 a 30 contatos por dia com alto critério de personalização produz melhores resultados do que 200 mensagens genéricas — e com muito menos risco para a conta.' },
    { q: 'O LinkedIn detecta e pune práticas de spam?', a: 'Sim. O LinkedIn usa sinais comportamentais para identificar contas que operam fora dos padrões: alta taxa de rejeição em pedidos de conexão, denúncias de "não conheço essa pessoa", padrões de envio que parecem automação, volume de mensagens acima dos limites por período. As punições vão de restrição temporária até suspensão de conta. Em casos graves, o LinkedIn pode banir a conta permanentemente.' },
    { q: 'Como saber se minha abordagem está sendo percebida como spam?', a: 'Os sinais mais diretos: taxa de aceitação de conexão abaixo de 25-30%, taxa de resposta a mensagens abaixo de 5-8%, aumento de denúncias ou bloqueios, e feedbacks negativos explícitos de prospects. Outra verificação simples: leia sua última mensagem enviada e pergunte se ela faria sentido especificamente para aquele prospect, ou se poderia ter sido enviada para qualquer pessoa com aquele cargo.' },
  ],
  'linkedin-para-founders-b2b': [
    { q: 'Quanto tempo por dia um founder deve dedicar ao LinkedIn para gerar pipeline?', a: 'Entre 1h e 1h30 por dia, divididos em dois blocos, são suficientes para manter uma operação de prospecção ativa nos estágios iniciais. Mais do que isso geralmente significa que o processo não está estruturado. Menos do que 45 minutos por dia tende a resultar em conversas paradas e pipeline estagnado.' },
    { q: 'É melhor o founder fazer a prospecção ou contratar um SDR logo?', a: 'Antes de ter um ICP validado e uma mensagem que demonstravelmente funciona, contratar um SDR é prematuro. O founder deve fazer prospecção pelo menos até ter dados suficientes para documentar o que funciona — tipicamente os primeiros 10 a 20 clientes fechados. Depois disso, com processo documentado, o SDR consegue replicar com muito mais eficiência.' },
    { q: 'Como um founder evita parecer desesperado ao prospectar no LinkedIn?', a: 'O sinal de desespero numa abordagem de prospecção geralmente vem de dois lugares: abertura que é muito claramente um pitch disfarçado, e follow-up excessivo quando não há resposta. A solução para o primeiro é focar a primeira mensagem em genuinamente entender o contexto do prospect. A solução para o segundo é ter critérios claros de desistência — dois ou três contatos com espaçamento razoável, então pare.' },
    { q: 'Um AI SDR pode substituir o founder na prospecção?', a: 'Parcialmente — e com critério. Um AI SDR consegue assumir as partes operacionais: identificar prospects dentro do ICP, enviar primeiros contatos personalizados, gerenciar follow-ups e organizar o pipeline. Isso libera o founder para focar nas conversas que estão avançando. O que um AI SDR não substitui é a credibilidade do founder nas conversas com C-level e em negociações complexas.' },
  ],
  'automacao-mensagens-linkedin-segura': [
    { q: 'O LinkedIn bane contas por usar automação?', a: 'O LinkedIn pode restringir ou banir contas por comportamento automatizado — mas o que aciona a restrição não é o uso de uma ferramenta específica, mas o padrão de comportamento gerado na plataforma. Ferramentas que executam ações automaticamente na interface do LinkedIn geram sinais que o sistema de detecção identifica. Já ferramentas que operam fora da interface — como assistentes de IA que ajudam a redigir mensagens — não geram esses sinais.' },
    { q: 'Quantas mensagens posso enviar por dia com automação sem risco?', a: 'Não existe um número universal publicado pelo LinkedIn. Relatos de usuários e experiência prática indicam que, para mensagens enviadas manualmente (mesmo que redigidas com auxílio de IA), volumes de 20 a 50 mensagens por dia são amplamente considerados seguros para contas com histórico estabelecido. Para pedidos de conexão, a maioria dos profissionais experientes recomenda não ultrapassar 20 a 30 por dia.' },
    { q: 'Qual a diferença entre automação proibida e automação assistida no LinkedIn?', a: 'Automação proibida, nos termos do ToS do LinkedIn, é aquela em que um sistema executa ações na plataforma em lugar do usuário sem intervenção humana no momento da ação. Automação assistida é aquela em que a tecnologia trabalha antes ou depois da interação com a plataforma: pesquisa, redação de rascunhos, organização de pipeline — mas o clique final na plataforma sempre é feito pelo humano.' },
    { q: 'Usar o Chattie pode resultar em banimento da minha conta LinkedIn?', a: 'O Chattie foi projetado com o modelo de automação assistida: a IA trabalha na preparação e personalização das mensagens, mas o envio é sempre executado manualmente pelo usuário. Esse design significa que o comportamento gerado na conta do LinkedIn é indistinguível de uso humano normal — porque é uso humano normal. Não há acesso à API do LinkedIn por parte da ferramenta, não há ações automatizadas na plataforma.' },
  ],
  'como-usar-ia-para-vendas-b2b-linkedin': [
    { q: 'Preciso de conhecimento técnico para usar IA em vendas B2B?', a: 'Não, para a maioria das aplicações práticas. Usar um LLM como ChatGPT ou Claude para ajudar a redigir mensagens, pesquisar contexto de prospects ou analisar padrões de ICP não requer nenhum conhecimento técnico além de saber escrever prompts claros. Ferramentas de IA especializadas em vendas B2B, como o Chattie, são projetadas para profissionais comerciais sem background técnico.' },
    { q: 'Qual o ROI real de implementar IA no processo de vendas B2B?', a: 'O benefício mais mensurável e imediato tende a ser na redução de tempo gasto em pesquisa e redação: relatos de usuários indicam que a fase de preparação de uma abordagem personalizada — que pode levar 15 a 30 minutos manualmente — pode ser reduzida para 3 a 5 minutos com IA. Para um SDR fazendo 20 abordagens por semana, isso representa horas recuperadas por semana.' },
    { q: 'Ferramentas de IA para vendas B2B funcionam para qualquer tamanho de empresa?', a: 'Ferramentas de IA para vendas B2B são especialmente eficazes para founders e profissionais que precisam prospectar sem dedicação exclusiva (onde IA maximiza o tempo disponível), e equipes que querem escalar volume sem contratar proporcionalmente. Para empresas menores ou equipes enxutas, soluções prontas como o Chattie oferecem acesso a capacidades de IA sem necessidade de infraestrutura técnica interna.' },
    { q: 'Como garantir que a IA não comprometa a autenticidade das minhas mensagens no LinkedIn?', a: 'A chave está em tratar IA como colaboradora de redação, não como substituta da sua voz. Use IA para gerar o rascunho com base em contexto real do prospect, revise sempre antes de enviar e faça ajustes que reflitam sua linguagem e estilo pessoal. O teste prático: releia cada mensagem antes de enviar e pergunte "eu diria exatamente isso?". IA deve deixar suas mensagens mais informadas e mais eficientes — não mais genéricas.' },
  ],
  'abm-no-linkedin-account-based-marketing': [
    { q: 'ABM no LinkedIn vale a pena para empresas pequenas ou só para enterprise?', a: 'ABM faz sentido para qualquer empresa onde o ticket médio justifica o investimento por conta — independentemente do tamanho da empresa que está fazendo ABM. Uma startup com produto de alto ticket se beneficia de ABM tanto quanto uma empresa grande. O que define a viabilidade não é o tamanho de quem vende, mas o valor do contrato e a complexidade do processo de compra do cliente.' },
    { q: 'Quantas contas-alvo devo trabalhar em paralelo numa operação ABM no LinkedIn?', a: 'Uma regra prática: contas Tier 1 com tratamento completo exigem em torno de 2 a 4 horas por conta por mês para manutenção ativa de relacionamento e personalização real de mensagens. Para um founder ou SDR que dedica 30% do tempo a ABM, isso significa entre 8 e 15 contas Tier 1 sendo trabalhadas em paralelo com qualidade. Adicione mais contas Tier 2 e Tier 3 com menor intensidade.' },
    { q: 'Como personalizar mensagens para múltiplos decisores dentro da mesma conta?', a: 'O ponto de partida é entender o papel de cada pessoa no processo de compra antes de escrever qualquer mensagem. O decisor orçamentário quer entender impacto no negócio e retorno sobre investimento. O campeão interno quer entender como a solução resolve a dor operacional. O avaliador técnico quer entender segurança, integração e esforço de implementação. Use o que você sabe sobre a conta como contexto compartilhado — mas adapte o ângulo ao que importa para cada perfil.' },
    { q: 'O que diferencia uma conta ABM de uma conta de prospecção normal?', a: 'A diferença não está na empresa em si — está em como você a aborda. A mesma empresa pode ser tratada como conta de prospecção normal (um lead numa lista) ou como conta ABM (mapeamento de stakeholders, aquecimento ativo, personalização por papel, acompanhamento de longo prazo). Contas ABM são aquelas onde você está disposto a investir semanas de relacionamento antes de fazer uma oferta — e onde um único fechamento paga o esforço de toda a operação.' },
  ],
  'tendencias-vendas-b2b-2026-o-que-muda-na-prospeccao': [
    { q: 'As tendências de vendas B2B para 2026 valem para empresas pequenas ou só para grandes times?', a: 'Valem especialmente para empresas pequenas. Founders e consultores solo têm volume limitado de abordagens — o que torna a qualidade de cada contato ainda mais crítica. As ferramentas de IA que antes eram caras ou complexas demais agora estão acessíveis para operações de um ou dois SDRs, o que nivela o campo.' },
    { q: 'O LinkedIn vai continuar sendo o principal canal de prospecção B2B no Brasil?', a: 'Sim, pelo menos no horizonte de 2026. O LinkedIn concentra os decisores B2B brasileiros e tem menor fricção do que e-mail frio para primeiro contato. A limitação é de abordagem, não de canal — volume sem personalização gera ban e silêncio. A plataforma favorece quem usa com critério.' },
    { q: 'O que é prospecção baseada em sinais (signal-based prospecting)?', a: 'É a prática de usar eventos observáveis no comportamento do lead — como abertura de vagas, publicações sobre problemas específicos, rodadas de investimento ou mudanças de cargo — para determinar o momento e o ângulo da abordagem. Em vez de trabalhar com listas estáticas e cadências fixas, o SDR aciona o contato quando o sinal indica maior receptividade.' },
    { q: 'Cold e-mail ainda funciona em 2026?', a: 'Funciona, mas como canal secundário coordenado com LinkedIn — não como canal único. E-mail frio com lista limpa, copy com contexto real e cadência curta ainda gera resposta. Sequências longas com copy genérico, não. O e-mail perdeu protagonismo para o LinkedIn no B2B brasileiro, mas não desapareceu.' },
    { q: 'Quanto tempo leva para ver resultado numa operação de prospecção reestruturada?', a: 'Benchmarks de outbound B2B indicam que os primeiros sinais de melhora (aumento de taxa de aceitação e resposta) aparecem em 2 a 4 semanas após ajuste de ICP e abordagem. Pipeline concreto — reuniões qualificadas consistentes — costuma aparecer entre 45 e 90 dias, dependendo do ciclo de venda do produto.' },
  ],
  'como-prospectar-no-linkedin-b2b': [
    { q: 'Quantas mensagens de prospecção posso enviar por dia no LinkedIn sem risco?', a: 'Para uso orgânico dentro dos limites da plataforma, o recomendado é até 15 a 20 pedidos de conexão por dia e até 20 a 30 mensagens de follow-up. Ultrapassar esses volumes — especialmente com textos idênticos — aumenta o risco de restrição da conta. Volume com qualidade supera volume com spam em todos os indicadores de resultado.' },
    { q: 'Qual é a taxa de resposta esperada em prospecção B2B no LinkedIn?', a: 'Com ICP definido, abordagem com contexto e copy personalizada, taxas de resposta entre 15% e 30% são alcançáveis para mensagens iniciais. Follow-ups bem estruturados podem elevar a taxa de conversão total da cadência. Taxas abaixo de 10% geralmente indicam problema de ICP, copy genérica ou abordagem precoce.' },
    { q: 'Preciso do LinkedIn Premium ou Sales Navigator para prospectar B2B?', a: 'Não necessariamente. A versão gratuita permite prospecção eficiente com os filtros de busca padrão. O Sales Navigator adiciona filtros avançados, alertas de atividade e maior volume de buscas salvas — útil para quem prospecta com volume acima de 50 leads por semana.' },
    { q: 'Qual o momento certo para propor uma reunião em prospecção no LinkedIn?', a: 'Quando você tem evidência de fit e interesse: a pessoa respondeu de forma substantiva a pelo menos uma mensagem, o timing é confirmado como ativo e o problema que você resolve está presente na conversa. Propor reunião antes de qualificar minimamente reduz comparecimento e desperdiça agenda dos dois lados.' },
  ],
}

// Comparison slugs get ItemList schema (product/tool comparisons)
type ComparisonItem = { name: string; description: string; url: string }
const COMPARISON_SLUGS: Record<string, { items: ComparisonItem[] }> = {
  'chattie-vs-expandi': {
    items: [
      { name: 'Chattie', description: 'AI SDR para LinkedIn — organiza conversas, mantém contexto e sinaliza follow-ups sem automação agressiva na plataforma', url: 'https://trychattie.com' },
      { name: 'Expandi', description: 'Ferramenta de automação de LinkedIn com sequências personalizadas, lógica condicional e relatórios para times de SDR', url: 'https://expandi.io' },
    ],
  },
  'chattie-vs-waalaxy': {
    items: [
      { name: 'Chattie', description: 'AI SDR para LinkedIn — organiza conversas, mantém contexto e sinaliza follow-ups sem automação agressiva na plataforma', url: 'https://trychattie.com' },
      { name: 'Waalaxy', description: 'Ferramenta de automação LinkedIn + email multicanal com sequências automáticas e plano gratuito com limites de volume', url: 'https://waalaxy.com' },
    ],
  },
  'ai-sdr-vs-human-sdr': {
    items: [
      { name: 'AI SDR', description: 'Software de inteligência artificial para prospecção e desenvolvimento de vendas — escala atividades repetitivas e libera SDRs para conversas de maior valor', url: 'https://trychattie.com' },
      { name: 'Human SDR', description: 'Sales Development Representative — profissional essencial para julgamento contextual, conversas consultivas e ciclos de venda complexos', url: 'https://trychattie.com/blog/ai-sdr-vs-human-sdr' },
    ],
  },
  // ── AI SDR vs SDR Humano (PT-BR + EN par) ─────────────────────────────────
  'ai-sdr-vs-sdr-humano': {
    items: [
      { name: 'AI SDR', description: 'Sistema de inteligência artificial para prospecção e qualificação de leads — escala pesquisa, organização e timing de follow-up liberando o SDR humano para conversas de maior valor', url: 'https://trychattie.com' },
      { name: 'SDR Humano', description: 'Sales Development Representative — essencial para julgamento contextual, adaptação em conversas consultivas, negociação e ciclos de venda complexos de alto ticket', url: 'https://trychattie.com/pt-br/blog/ai-sdr-vs-sdr-humano' },
    ],
  },
  // ── Novos comparativos PT-BR ───────────────────────────────────────────────
  'expandi-vs-waalaxy': {
    items: [
      { name: 'Expandi', description: 'Ferramenta de automação de LinkedIn em cloud — sequências personalizadas com lógica condicional e menor risco de detecção que extensões de Chrome', url: 'https://expandi.io' },
      { name: 'Waalaxy', description: 'Plataforma de automação LinkedIn + email multicanal com plano gratuito e interface acessível para quem está começando em outreach estruturado', url: 'https://waalaxy.com' },
    ],
  },
  'linkedin-vs-email-prospeccao': {
    items: [
      { name: 'LinkedIn', description: 'Canal de prospecção B2B baseado em relacionamento — melhor para venda consultiva, ticket alto e ICP ativo na plataforma', url: 'https://linkedin.com' },
      { name: 'E-mail', description: 'Canal de prospecção com maior escala e rastreabilidade nativa — melhor para volume e operações com ICP que não usa LinkedIn ativamente', url: '' },
    ],
  },
  'linkedin-sales-navigator-vs-gratuito': {
    items: [
      { name: 'LinkedIn Gratuito', description: 'Versão sem custo do LinkedIn com filtros básicos de busca — suficiente para prospecção de baixo volume com ICP menos específico', url: 'https://linkedin.com' },
      { name: 'LinkedIn Sales Navigator', description: 'Plataforma premium de prospecção com filtros avançados, alertas de job change, InMails e integração com CRM — para operações B2B de volume', url: 'https://business.linkedin.com/sales-solutions/sales-navigator' },
    ],
  },
  'whatsapp-vs-linkedin-para-prospeccao-b2b': {
    items: [
      { name: 'WhatsApp', description: 'Canal de mensagens instantâneas com alta taxa de abertura — ideal para follow-ups com leads quentes, relacionamentos existentes e abordagens em mercados onde o LinkedIn tem menor penetração', url: 'https://whatsapp.com' },
      { name: 'LinkedIn', description: 'Canal de prospecção B2B profissional com contexto de negócios — melhor para primeiros contatos cold, construção de relacionamento consultivo e vendas com ticket médio-alto', url: 'https://linkedin.com' },
    ],
  },
  // ── Phase C: comparativos PT-BR ──────────────────────────────────────────
  'melhores-ferramentas-prospeccao-linkedin-2026': {
    items: [
      { name: 'Chattie', description: 'AI SDR para LinkedIn — organiza conversas, mantém contexto e sinaliza follow-ups sem automação agressiva na plataforma', url: 'https://trychattie.com' },
      { name: 'LinkedIn Sales Navigator', description: 'Produto oficial do LinkedIn para segmentação avançada, alertas de job change e integração com CRM — risco zero de banimento', url: 'https://business.linkedin.com/sales-solutions/sales-navigator' },
      { name: 'Expandi', description: 'Ferramenta de automação cloud com sequências personalizadas e lógica condicional — melhor para agências e SDRs com alto volume', url: 'https://expandi.io' },
      { name: 'Waalaxy', description: 'Plataforma de automação LinkedIn + email multicanal com plano gratuito e interface acessível para equipes pequenas', url: 'https://waalaxy.com' },
      { name: 'Apollo.io', description: 'Plataforma de enriquecimento de dados e outreach multicanal — ideal para operações que precisam de dados além do LinkedIn', url: 'https://apollo.io' },
      { name: 'Phantombuster', description: 'Ferramenta de scraping e automação modular para equipes técnicas — alto risco de detecção pelo LinkedIn', url: 'https://phantombuster.com' },
      { name: 'Dux-Soup', description: 'Automação via extensão de Chrome com risco alto de detecção — para usuários que preferem controle manual simples', url: 'https://www.dux-soup.com' },
    ],
  },
}

// Slugs that get DefinedTerm schema (conceptual definition posts)
const DEFINED_TERMS: Record<string, { name: string; description: string }> = {
  'o-que-e-social-selling': {
    name: 'Social Selling',
    description:
      'Social selling é a prática de usar redes sociais profissionais, especialmente o LinkedIn, para construir relacionamentos, gerar confiança e abrir oportunidades de vendas B2B de forma orgânica e estratégica — sem depender de cold calls ou spam de mensagens.',
  },
  'o-que-e-um-crm-social': {
    name: 'CRM Social',
    description:
      'CRM social é uma categoria de ferramenta que organiza conversas, histórico de interações e sinais de interesse em ambientes digitais como o LinkedIn, permitindo follow-ups precisos e gestão de relacionamentos comerciais em canais onde os compradores já estão ativos.',
  },
  'o-que-e-um-ai-sdr': {
    name: 'AI SDR',
    description:
      'AI SDR (AI Sales Development Representative) é um sistema que usa inteligência artificial para apoiar tarefas de prospecção e qualificação de leads — identificando prospects com perfil ideal, sugerindo o timing certo de abordagem e organizando o pipeline de conversas — mantendo o vendedor humano no controle de cada interação.',
  },
  'icp-linkedin-como-definir-perfil-cliente-ideal': {
    name: 'ICP (Ideal Customer Profile)',
    description:
      'ICP (Ideal Customer Profile) é a descrição precisa do tipo de empresa e do perfil de pessoa que tem mais probabilidade de comprar um produto e de ter sucesso com ele — definido por firmografia (tamanho, setor, estágio), cargo e seniority, sinais de timing de compra, indicadores de fit de problema e comportamento ativo na plataforma de prospecção.',
  },
  // EN
  'what-is-an-ai-sdr': {
    name: 'AI SDR',
    description:
      'An AI SDR (AI Sales Development Representative) is a system that uses artificial intelligence to support prospecting and lead qualification tasks — identifying prospects matching the ideal customer profile, suggesting optimal outreach timing, and organizing conversation pipelines — while keeping the human seller in control of every interaction.',
  },
  'what-is-social-selling-and-why-it-matters-in-b2b': {
    name: 'Social Selling',
    description:
      'Social selling is the practice of using professional social networks, especially LinkedIn, to build relationships, generate trust, and open B2B sales opportunities organically — without relying on cold calls or unsolicited message blasts. It works by positioning salespeople as credible, visible, and useful to buyers before they are ready to purchase.',
  },
  'what-is-a-social-crm-and-why-it-matters-for-linkedin-b2b': {
    name: 'Social CRM',
    description:
      'A social CRM is a category of tool that organizes conversations, interaction history, and interest signals in digital environments like LinkedIn — enabling precise follow-ups and commercial relationship management in the channels where buyers are already active, complementing traditional CRM systems that were not built for social-first prospecting.',
  },
}

export function ArticleJsonLd({ post, lang = 'pt-BR', postContent }: ArticleJsonLdProps) {
  const author = getAuthor(post.author || 'Thiago Lisboa')

  // F1.1: merge frontmatter authorLinkedIn into sameAs (takes precedence if set)
  const linkedInUrl = post.authorLinkedIn || author?.linkedin
  const authorSchema = author
    ? {
        '@type': 'Person',
        name: author.name,
        url: author.url,
        image: `https://trychattie.com${author.photo}`,
        jobTitle: post.authorTitle || author.role,
        sameAs: [
          linkedInUrl,
          ...(author.twitter ? [author.twitter] : []),
        ].filter(Boolean),
      }
    : {
        '@type': 'Person',
        name: post.author || 'Thiago Lisboa',
        url: 'https://trychattie.com',
        ...(linkedInUrl ? { sameAs: [linkedInUrl] } : {}),
        ...(post.authorTitle ? { jobTitle: post.authorTitle } : {}),
      }

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    inLanguage: lang,
    datePublished: post.publishedAt,
    dateModified: post.dateModified || post.date,
    author: authorSchema,
    publisher: {
      '@type': 'Organization',
      name: 'Chattie',
      url: 'https://trychattie.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://trychattie.com/brand/chattie-symbol.png',
      },
    },
    image: {
      '@type': 'ImageObject',
      url: post.image,
      width: 1200,
      height: 630,
      caption: post.imageAlt || post.title,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonicalUrl,
    },
    keywords: post.tags?.join(', '),
    speakable: {
      '@type': 'SpeakableSpecification',
      // #post-description = the lead paragraph (meta description rendered in <header>)
      // article.prose h2  = question-based section headings
      // article.prose p   = first paragraph after each H2 (snippable answer-first blocks)
      cssSelector: ['#post-description', 'article.prose h2', 'article.prose > p:first-of-type'],
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Chattie', item: 'https://trychattie.com' },
      {
        '@type': 'ListItem',
        position: 2,
        name: lang === 'pt-BR' ? 'Blog PT-BR' : 'Blog',
        item: lang === 'pt-BR' ? 'https://trychattie.com/pt-br/blog' : 'https://trychattie.com/blog',
      },
      { '@type': 'ListItem', position: 3, name: post.title, item: post.canonicalUrl },
    ],
  }

  // ItemList schema for comparison posts
  const comparisonData = post.slug ? COMPARISON_SLUGS[post.slug] : undefined
  const comparisonSchema = comparisonData
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: post.title,
        description: post.description,
        numberOfItems: comparisonData.items.length,
        itemListElement: comparisonData.items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          description: item.description,
          url: item.url,
        })),
      }
    : null

  // HowTo schema for step-by-step posts
  const howtoData = post.slug ? HOWTO_SLUGS[post.slug] : undefined
  const howtoSchema = howtoData
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: post.title,
        description: post.description,
        image: post.image,
        step: howtoData.steps.map((text, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: text.split(':')[0] || text.substring(0, 60),
          text,
        })),
      }
    : null

  // DefinedTerm schema for definition posts
  const termData = post.slug ? DEFINED_TERMS[post.slug] : undefined
  const termSchema = termData
    ? {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: termData.name,
        description: termData.description,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'Glossário de Social Selling e LinkedIn B2B — Chattie',
          url: 'https://trychattie.com/pt-br/blog',
        },
      }
    : null

  // FAQPage schema — prefer hardcoded FAQ_DATA, fall back to dynamic extraction from MDX content
  const hardcodedFaq = post.slug ? FAQ_DATA[post.slug] : undefined
  const faqItems: FaqPair[] | undefined =
    hardcodedFaq && hardcodedFaq.length > 0
      ? hardcodedFaq
      : (postContent ? extractFaqFromContent(postContent) : undefined)
  const faqSchema = (post.structuredData === 'faq' && faqItems && faqItems.length > 0)
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      }
    : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(baseSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {comparisonSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonSchema) }} />
      )}
      {howtoSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howtoSchema) }} />
      )}
      {termSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termSchema) }} />
      )}
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
    </>
  )
}

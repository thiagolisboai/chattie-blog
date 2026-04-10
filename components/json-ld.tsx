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
  'what-is-an-ai-sdr': [
    { q: 'Is an AI SDR the same as a sales automation tool?', a: 'Not exactly. Sales automation tools execute pre-defined sequences — they send message A, then B, then C on a fixed schedule, regardless of what happened in between. An AI SDR uses intelligence to adapt: if a prospect engaged with your post, the AI adjusts the next action accordingly.' },
    { q: 'Can an AI SDR replace a human SDR entirely?', a: 'In high-volume, low-touch sales motions — sub-$5k ACV, transactional buying process, short cycles — autonomous AI SDRs can handle most top-of-funnel work. In consultative B2B sales with complex buying committees and longer cycles, the human SDR remains essential.' },
    { q: 'How is Chattie different from other AI SDRs?', a: 'Chattie is an assisted AI SDR focused specifically on LinkedIn. It doesn\'t send messages automatically — you write and send every message yourself. What Chattie does: organizes your conversations by pipeline stage, surfaces who needs follow-up, and preserves full conversation context.' },
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
      cssSelector: ['h1', '.prose h2', '.prose > p:first-of-type'],
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

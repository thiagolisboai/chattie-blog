import { getAuthor } from '@/lib/authors'

interface ArticleJsonLdProps {
  post: {
    title: string
    description: string
    publishedAt: string
    date: string
    dateModified?: string
    image: string
    canonicalUrl: string
    author?: string
    tags?: string[]
    structuredData?: string
    slug?: string
  }
  lang?: string
}

// Slugs that get HowTo schema (step-by-step guides)
const HOWTO_SLUGS: Record<string, { steps: string[] }> = {
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

export function ArticleJsonLd({ post, lang = 'pt-BR' }: ArticleJsonLdProps) {
  const author = getAuthor(post.author || 'Thiago Lisboa')

  const authorSchema = author
    ? {
        '@type': 'Person',
        name: author.name,
        url: author.url,
        image: `https://trychattie.com${author.photo}`,
        sameAs: [author.linkedin, ...(author.twitter ? [author.twitter] : [])],
      }
    : {
        '@type': 'Person',
        name: post.author || 'Thiago Lisboa',
        url: 'https://trychattie.com',
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

  // FAQPage schema — only rendered when the slug has real Q&A data
  const faqItems = post.slug ? FAQ_DATA[post.slug] : undefined
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

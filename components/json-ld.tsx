import { getAuthor } from '@/lib/authors'

interface ArticleJsonLdProps {
  post: {
    title: string
    description: string
    publishedAt: string
    date: string
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
    dateModified: post.date,
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

  // FAQPage schema
  const faqSchema = post.structuredData === 'faq'
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [], // populated from post content via structured data
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

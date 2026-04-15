export interface AuthorCredential {
  title: string
  titlePt?: string
  url?: string
}

export interface Author {
  name: string
  slug: string
  role: string
  rolePt: string
  bio: string
  bioPt: string
  bioExpanded: string
  bioExpandedPt: string
  photo: string
  linkedin: string
  twitter?: string
  url: string
  worksFor: string
  worksForUrl: string
  expertiseAreas: string[]
  expertiseAreasPt: string[]
  credentials: AuthorCredential[]
}

export const AUTHORS: Record<string, Author> = {
  'thiago-lisboa': {
    name: 'Thiago Lisboa',
    slug: 'thiago-lisboa',
    role: 'CEO & Co-Founder at Chattie',
    rolePt: 'CEO & Co-Founder do Chattie',
    bio: 'Thiago Lisboa is the CEO and co-founder of Chattie, the AI SDR built for LinkedIn B2B prospecting. He writes about social selling, LinkedIn strategy, and AI-driven sales.',
    bioPt: 'Thiago Lisboa é CEO e co-founder do Chattie, o AI SDR criado para prospecção B2B no LinkedIn. Escreve sobre social selling, estratégia no LinkedIn e vendas com IA.',
    bioExpanded: 'Thiago Lisboa is the CEO and co-founder of Chattie — an AI SDR platform built to automate and scale LinkedIn B2B prospecting for founders, consultants, and sales teams. Before Chattie, he spent years building and operating B2B sales processes in the Brazilian market, where he identified the gap between high-volume outreach tools and genuine relationship-driven social selling. His writing focuses on the practical side of LinkedIn prospecting: message frameworks that get replies, how AI can assist without replacing human judgment, and the specific playbooks that work for B2B teams selling to decision-makers. He publishes weekly insights on LinkedIn prospecting, social selling methodology, and the evolving role of AI in B2B sales.',
    bioExpandedPt: 'Thiago Lisboa é CEO e co-founder do Chattie — plataforma de AI SDR criada para automatizar e escalar a prospecção B2B no LinkedIn para founders, consultores e equipes comerciais. Antes do Chattie, passou anos construindo e operando processos de vendas B2B no mercado brasileiro, onde identificou a lacuna entre ferramentas de alto volume e social selling baseado em relacionamento genuíno. Sua escrita foca no lado prático da prospecção no LinkedIn: estruturas de mensagem que geram resposta, como a IA pode auxiliar sem substituir o julgamento humano, e os playbooks específicos que funcionam para equipes B2B que vendem para decisores. Publica insights semanais sobre prospecção no LinkedIn, metodologia de social selling e o papel evolutivo da IA em vendas B2B.',
    photo: '/authors/thiagolisboa-profile-blogchattie.png',
    linkedin: 'https://www.linkedin.com/in/thiagolisboai',
    url: 'https://trychattie.com',
    worksFor: 'Chattie',
    worksForUrl: 'https://trychattie.com',
    expertiseAreas: [
      'LinkedIn B2B Prospecting',
      'Social Selling',
      'AI for Sales',
      'Sales Development',
      'B2B Outreach',
      'LinkedIn Sales Navigator',
    ],
    expertiseAreasPt: [
      'Prospecção B2B no LinkedIn',
      'Social Selling',
      'IA para Vendas',
      'Sales Development',
      'Outreach B2B',
      'LinkedIn Sales Navigator',
    ],
    credentials: [
      {
        title: 'CEO & Co-Founder, Chattie',
        titlePt: 'CEO & Co-Founder, Chattie',
        url: 'https://trychattie.com',
      },
      {
        title: 'LinkedIn: 4,900+ followers in B2B sales and AI SDR',
        titlePt: 'LinkedIn: +4.900 seguidores em vendas B2B e AI SDR',
        url: 'https://www.linkedin.com/in/thiagolisboai',
      },
      {
        title: 'Author of 50+ in-depth articles on LinkedIn prospecting and social selling',
        titlePt: 'Autor de 50+ artigos técnicos sobre prospecção no LinkedIn e social selling',
        url: 'https://trychattie.com/pt-br/blog',
      },
    ],
  },
}

export function getAuthor(name: string): Author | undefined {
  return Object.values(AUTHORS).find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  ) ?? AUTHORS['thiago-lisboa']
}

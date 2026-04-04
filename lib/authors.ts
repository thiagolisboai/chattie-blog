export interface Author {
  name: string
  slug: string
  role: string
  rolePt: string
  bio: string
  bioPt: string
  photo: string
  linkedin: string
  twitter?: string
  url: string
}

export const AUTHORS: Record<string, Author> = {
  'thiago-lisboa': {
    name: 'Thiago Lisboa',
    slug: 'thiago-lisboa',
    role: 'Founder & CEO at Chattie',
    rolePt: 'Founder & CEO do Chattie',
    bio: 'Thiago Lisboa is the founder of Chattie, the AI SDR built for LinkedIn B2B prospecting. He writes about social selling, LinkedIn strategy, and AI-driven sales.',
    bioPt: 'Thiago Lisboa é o fundador do Chattie, o AI SDR criado para prospecção B2B no LinkedIn. Escreve sobre social selling, estratégia no LinkedIn e vendas com IA.',
    // Drop your photo at: public/authors/thiago-lisboa.jpg (400x400px recommended)
    photo: '/authors/thiago-lisboa.jpg',
    linkedin: 'https://www.linkedin.com/in/thiago-avelino-tra/',
    url: 'https://trychattie.com',
  },
}

export function getAuthor(name: string): Author | undefined {
  return Object.values(AUTHORS).find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  ) ?? AUTHORS['thiago-lisboa']
}

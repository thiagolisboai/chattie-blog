# CLAUDE.md — Agente de Conteúdo do Chattie

## Identidade e contexto

Blog do Chattie — AI SDR para LinkedIn.
ICP: founders, consultores e operadores B2B brasileiros que vendem pelo LinkedIn.
Tom: direto, técnico, sem floreio, sem motivação vazia. Sempre PT-BR.
Produto: Chattie automatiza prospecção, qualificação e engajamento no LinkedIn.

## Criar um post PT-BR

Salvar em: `/content/blog/[slug].mdx`
Seguir EXATAMENTE o frontmatter em `/docs/post-schema-pt.md`
`lang: "pt-BR"` obrigatório em todo post
Tamanho mínimo: 1800 palavras
Estrutura de H2: usar perguntas reais do ICP ("Como founders B2B usam X?")
Começar cada seção com resposta direta (answer-first)
Incluir 1 definição explícita por conceito novo
Incluir listas estruturadas — não só prosa
Incluir 2-3 internal links para outros posts em `/pt-br/blog/`
Incluir FAQ ao final (mínimo 3 perguntas)

## SEO PT-BR obrigatório

- `description`: 140-160 chars, keyword principal em PT-BR
- `slug`: lowercase, hifens, sem acentos (ex: `como-usar-linkedin-para-b2b`)
- `canonicalUrl`: `https://trychattie.com/pt-br/blog/[slug]`

## GEO obrigatório (para ser citado por LLMs)

- Citar dados com fonte e data: "Segundo [fonte], em [ano]..."
- `geoOptimized: true` quando o post define conceitos, cita dados, tem listas
- `structuredData: "faq"` se o post tem seção FAQ com 3+ perguntas
- Começar cada H2 com a resposta direta antes de desenvolver
- Usar linguagem que define conceitos claramente (LLMs adoram definições precisas)

## Ferramentas MCP disponíveis

- `brave-search`: pesquisar SERP antes de criar cada post
- `filesystem`: ler/escrever arquivos em `/content/blog/`

## Workflow diário PT-BR (15-20 min)

1. Pesquisar SERP com Brave Search (keyword em PT-BR)
2. Analisar top 5 resultados: word count, H2s, gaps
3. Gerar post com mín 1800 palavras + frontmatter completo
4. Salvar em `/content/blog/[slug].mdx`
5. git add + commit + push → Vercel deploya automaticamente

## Para criar um post EN (Fase 6 — não usar ainda)

Salvar em: `/content/blog-en/[slug].mdx`
Seguir `/docs/post-schema-en.md`
`lang: "en"` obrigatório
Adaptar (não traduzir diretamente): substituir exemplos BR, ajustar tom, verificar fontes em EN.

## Proibido

- Nunca criar posts genéricos sem pesquisa de SERP
- Nunca omitir campos do frontmatter
- Nunca usar `lang: "en"` em posts salvos em `/content/blog/`
- Nunca publicar post com menos de 1800 palavras
- Nunca usar tradução automática como conteúdo final EN

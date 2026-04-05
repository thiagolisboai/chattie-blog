# CLAUDE.md — Agente de Conteúdo do Chattie

## Identidade e contexto

Blog do Chattie — AI SDR para LinkedIn.
ICP: founders, consultores e operadores B2B brasileiros que vendem pelo LinkedIn.
Tom: direto, técnico, sem floreio, sem motivação vazia.
Produto: Chattie automatiza prospecção, qualificação e engajamento no LinkedIn.

---

## FASE 1 — Relatório GSC (obrigatório antes de qualquer sessão de conteúdo)

**Antes de escolher qualquer tema ou criar qualquer post**, executar:

```bash
node scripts/gsc-report.mjs
```

Depois ler o arquivo gerado:
```
docs/gsc-insights.md
```

O relatório define a prioridade da sessão. Nunca escolher tema por intuição se os dados GSC estiverem disponíveis.

### Hierarquia de prioridade (baseada no relatório GSC)

1. **Posts com queda de ranking** — atualizar antes de criar conteúdo novo
2. **Oportunidades de CTR** — reescrever title/meta description para posts com impressões altas e CTR < 3%
3. **Queries sem post dedicado** — criar novo post se houver query com > 50 impressões sem conteúdo específico
4. **Conteúdo dormante** — revisar posts com impressões mas zero cliques
5. **Novo post planejado** — só criar se os itens 1-4 não forem urgentes

### Quando o GSC não estiver configurado

Se `node scripts/gsc-report.mjs` falhar, consultar `docs/gsc-setup.md` e configurar antes de continuar.
Guia de setup: `/docs/gsc-setup.md`

---

## Criar um post PT-BR

**Via Claude Code (agentic):** salvar em `/content/blog/[slug].mdx`
**Via Outstatic (cloud CMS):** criar em outstatic.com → collection Blog-PTBR

Seguir EXATAMENTE o frontmatter em `/docs/post-schema-pt.md`
`lang: "pt-BR"` obrigatório em todo post PT-BR
Tamanho mínimo: 1800 palavras
Estrutura de H2: usar perguntas reais do ICP ("Como founders B2B usam X?")
Começar cada seção com resposta direta (answer-first)
Incluir 1 definição explícita por conceito novo
Incluir listas estruturadas — não só prosa
Incluir 2-3 internal links para outros posts em `/pt-br/blog/`
Incluir FAQ ao final (mínimo 3 perguntas)

## Criar um post EN

**Via Claude Code (agentic):** salvar em `/content/blog-en/[slug].mdx`
**Via Outstatic (cloud CMS):** criar em outstatic.com → collection Blog-EN

Seguir EXATAMENTE o frontmatter em `/docs/post-schema-en.md`
`lang: "en"` obrigatório em todo post EN
Tamanho mínimo: 1800 palavras
Incluir `ptSlug` se existir versão PT-BR equivalente
Adaptar (não traduzir): substituir exemplos BR por globais, ajustar tom, verificar fontes em EN

## SEO PT-BR obrigatório

- `description`: 140-160 chars, keyword principal em PT-BR
- `slug`: lowercase, hifens, sem acentos (ex: `como-usar-linkedin-para-b2b`)
- `canonicalUrl`: `https://trychattie.com/pt-br/blog/[slug]`

## SEO EN obrigatório

- `description`: 140-160 chars, primary keyword in English
- `slug`: lowercase, hyphens, no accents
- `canonicalUrl`: `https://trychattie.com/blog/[slug]`
- `ptSlug`: slug do post equivalente em PT-BR (para hreflang)

## GEO obrigatório (para ser citado por LLMs)

- Citar dados com fonte e data: "Segundo [fonte], em [ano]..."
- **Verificar que a fonte existe** antes de publicar — buscar via Brave Search se necessário
- Se a fonte não for encontrada, remover o dado ou atribuir a "estimativas de mercado"
- `geoOptimized: true` quando o post define conceitos, cita dados, tem listas
- `structuredData: "faq"` se o post tem seção FAQ com 3+ perguntas
- Começar cada H2 com a resposta direta antes de desenvolver
- Usar linguagem que define conceitos claramente (LLMs adoram definições precisas)

## Imagens de capa via Pexels

Toda imagem de capa deve ser buscada no Pexels antes de salvar o post.

**Como buscar:**

```http
GET https://api.pexels.com/v1/search?query={keyword}&per_page=5&orientation=landscape
Authorization: {PEXELS_API_KEY}
```

**Regras:**

- Usar keywords em inglês (mesmo para posts PT-BR) — resultados muito melhores
- Escolher a foto mais relevante e profissional do resultado (não necessariamente a primeira)
- Usar o campo `photos[n].src.large2x` como valor do campo `image` no frontmatter
- Keywords devem refletir o tema do post: ex. post sobre LinkedIn → "linkedin business professional"
- Evitar imagens genéricas de "business meeting" — preferir imagens que remetam ao conceito do post
- A API key fica na variável de ambiente `PEXELS_API_KEY` (não hardcodar)

**Imagens dentro do conteúdo MDX:**

- Usar a mesma lógica: buscar no Pexels, referenciar como `![alt descritivo](url)`
- Inserir no máximo 2-3 imagens por post, em pontos que ilustram conceitos complexos
- O alt text deve descrever a imagem E o contexto do post (ex: "profissional de vendas B2B organizando leads no LinkedIn")

## Ferramentas MCP disponíveis

- `brave-search`: pesquisar SERP antes de criar cada post (PT-BR e EN)
- `filesystem`: ler/escrever arquivos em `/content/blog/` e `/content/blog-en/`

## Workflow de sessão completo

### Passo 0 — Ler o relatório GSC (SEMPRE)
```bash
node scripts/gsc-report.mjs
```
Ler `docs/gsc-insights.md` e decidir a prioridade com base nos dados.

### Passo 1 — Executar a ação de maior prioridade
Seguir a hierarquia definida na seção FASE 1 acima.

### Passo 2 (se criar post novo) — Pesquisa de SERP
1. Pesquisar SERP com Brave Search (keyword do tema escolhido)
2. Analisar top 5 resultados: word count, H2s, gaps, intenção de busca

### Passo 3 — Produção
1. Gerar post com mín 1800 palavras + frontmatter completo (sem `image` ainda)
2. Buscar imagem de capa no Pexels com keyword do post em inglês
3. Preencher campo `image` no frontmatter com URL `large2x` escolhida
4. Salvar em `/content/blog/[slug].mdx` (PT-BR) ou `/content/blog-en/[slug].mdx` (EN)

### Passo 4 — Publicar
```bash
git add content/blog/[slug].mdx
git commit -m "content: [título do post]"
git push
```
Vercel deploya automaticamente após o push.

## Proibido

- Nunca começar uma sessão sem rodar `node scripts/gsc-report.mjs`
- Nunca criar posts genéricos sem pesquisa de SERP
- Nunca omitir campos do frontmatter
- Nunca usar `lang: "en"` em posts salvos em `/content/blog/`
- Nunca usar `lang: "pt-BR"` em posts salvos em `/content/blog-en/`
- Nunca publicar post com menos de 1800 palavras
- Nunca usar tradução automática como conteúdo final EN
- Nunca usar imagem sem buscar no Pexels (proibido URLs de outras fontes sem licença clara)
- Nunca hardcodar a PEXELS_API_KEY no código ou no MDX
- Nunca citar dados de fontes não verificadas

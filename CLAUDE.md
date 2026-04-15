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
5. **Novo post do backlog** — consultar `docs/keyword-backlog.md`, escolher keyword de Alta prioridade e Baixa/Média competição

### Keyword backlog

Backlog priorizado em: `docs/keyword-backlog.md`  
Escolher sempre keywords com **Alta** prioridade. Preferir **Baixa/Média** competição quando o GSC não aponta urgência.  
Marcar como `publicado` no backlog após o deploy, com o slug do post.

### Quando o GSC não estiver configurado

Se `node scripts/gsc-report.mjs` falhar, consultar `docs/gsc-setup.md` e configurar antes de continuar.
Guia de setup: `/docs/gsc-setup.md`

---

## FASE 3 — Pipeline de tradução

**Antes de criar um post EN**, rodar:

```bash
node scripts/translation-audit.mjs
```

Isso mostra: pares completos, posts PT-BR sem par EN (com prioridade), posts EN órfãos e links quebrados.

### Regras de tradução

- **Adaptar, não traduzir** — exemplos globais, fontes em inglês, tom ajustado
- Criar par EN somente para posts PT-BR com prioridade **Alta** no backlog
- Ao criar EN: preencher `ptSlug` no novo post EN e `enSlug` no post PT-BR correspondente
- Workflow completo: `docs/translation-workflow.md`

### Verificar depois de criar/editar um par

```bash
node scripts/translation-audit.mjs
```

O par deve aparecer em "Pares completos" — não em "Links quebrados".

---

## FASE 4 — Verificação de fontes (obrigatório antes de publicar)

**Toda estatística ou dado externo citado num post deve ser verificado** antes do commit.

### Verificar durante a escrita

1. Buscar a fonte original via Brave Search: `[stat] [fonte] [ano] site oficial`
2. Confirmar que o número está na fonte primária (não em blogs que citam outros blogs)
3. Se não encontrar: remover o número ou usar linguagem sem atribuição falsa

### Rodar após escrever um post

```bash
node scripts/source-audit.mjs
```

Se retornar fontes suspeitas (exit code 1), corrigir antes do commit.
O audit também roda automaticamente no `npm run build`.

### Fontes aprovadas

LinkedIn, McKinsey & Company, HubSpot, Salesforce, Gartner, Forrester, TRA

### Fontes proibidas

Aberdeen Group, Sales Benchmark Index, Datanyze, CSO Insights, Sirius Decisions

### Se não tiver fonte verificável

- Remover o número específico
- Usar: "Benchmarks de outbound B2B indicam..." (sem atribuição)
- Usar: "É comum que equipes percam..." (estimativa sem número)

Guia completo: `docs/source-guidelines.md`

---

## FASE 5 — Diversificação de conteúdo

Rodar para ver a distribuição atual de schemas e categorias:

```bash
node scripts/content-diversity-audit.mjs
```

### Tipos de conteúdo e structuredData

| Tipo de post | structuredData | Schema JSON-LD gerado |
|-------------|---------------|----------------------|
| Artigo informacional | `"faq"` | Article + FAQ |
| Guia passo a passo | `"faq"` | Article + HowTo + FAQ |
| Definição conceitual | `"faq"` | Article + DefinedTerm + FAQ |
| Comparativo de ferramentas | `"comparison"` | Article + ItemList + FAQ |

### Regras de diversidade

- **Mínimo 50%** dos posts com schema rico além de Article (HowTo, DefinedTerm, ItemList)
- **Máximo 80%** dos posts numa única categoria
- Todo comparativo de ferramenta usa `structuredData: "comparison"` no frontmatter
- Novos posts de conceito ("o que é X") devem ser adicionados a `DEFINED_TERMS` em `json-ld.tsx`
- Novos guias passo a passo devem ser adicionados a `HOWTO_SLUGS` em `json-ld.tsx`
- Novos comparativos devem ser adicionados a `COMPARISON_SLUGS` em `json-ld.tsx`
- **Todo post com `structuredData: "faq"` deve ser adicionado a `FAQ_DATA` em `json-ld.tsx`** com mínimo 3 Q&As extraídas literalmente da seção `## FAQ` do post

### Checklist pós-publicação obrigatório (json-ld.tsx)

Após publicar qualquer post novo, verificar e atualizar `components/json-ld.tsx`:

| Condição | Ação em json-ld.tsx |
| --- | --- |
| `structuredData: "faq"` | Adicionar entrada em `FAQ_DATA` com as Q&As do post |
| Post tipo "o que é X" (conceitual) | Adicionar entrada em `DEFINED_TERMS` |
| Post tipo guia passo a passo (HowTo) | Adicionar entrada em `HOWTO_SLUGS` com os passos |
| `structuredData: "comparison"` | Adicionar entrada em `COMPARISON_SLUGS` com os itens |

**Nenhum post fica sem entrada em `FAQ_DATA` se tiver `structuredData: "faq"`.** Ignorar esse passo resulta em FAQPage schema vazio — sem rich result no Google.

### Regra de tags — normalização

- Nunca usar `"ia"` e `"inteligência-artificial"` na mesma tag list
- Usar sempre a forma completa: `"inteligência-artificial"` (PT-BR) / `"artificial-intelligence"` (EN)
- `"ia"` como tag standalone é permitido APENAS se não houver `"inteligência-artificial"` na mesma lista

### Tabelas comparativas em posts de ferramentas

Todo post da categoria `comparativos` **ou** que liste/compare ≥ 3 ferramentas deve incluir uma tabela markdown com colunas relevantes (tipo, risco, preço, melhor para). Isso se aplica mesmo que o `structuredData` seja `"faq"` (ex: posts de "melhores ferramentas de X").

### Metas de distribuição de categorias

| Categoria | Meta |
|-----------|------|
| linkedin | 30–45% |
| social-selling | 30–45% |
| comparativos | 8–15% |
| chattie | 5–15% |
| ia-para-vendas | 5–15% (novo — criar posts nessa categoria) |

---

## FASE 6 — Update loop (manutenção de posts existentes)

Rodar no início de cada sessão para identificar posts que precisam de atualização:

```bash
node scripts/update-audit.mjs
```

### Gatilhos de atualização obrigatória

- Post em queda no GSC (aparece no relatório `docs/gsc-insights.md`)
- Título ou description com ano desatualizado
- Post com mais de 6 meses sem `dateModified`

### Após atualizar um post

```bash
node scripts/set-date-modified.mjs [slug] [data]
```

**Regra:** nunca atualizar `dateModified` sem fazer pelo menos uma mudança real no conteúdo.

### Cadência mínima por tipo

- Ferramentas e comparativos: revisão a cada **3 meses**
- Guias passo a passo: revisão a cada **6 meses**
- Posts conceituais: revisão a cada **12 meses**

Workflow completo: `docs/update-workflow.md`

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

## Regra de slugs EN — prevenção de slugs idênticos

**O slug EN NUNCA deve ser idêntico ao slug PT-BR do par**, com exceção de nomes próprios de ferramentas/produtos que não têm tradução (ex: `expandi-vs-waalaxy`, `chattie-vs-expandi`).

**Por que importa:** slugs idênticos em coleções diferentes fazem ferramentas de auditoria SEO (Screaming Frog, Ahrefs, etc.) sinalizarem conteúdo duplicado potencial. A infraestrutura técnica (hreflang, canonical, `lang` HTML) está correta — mas a prevenção é mais barata que a justificativa.

**Regra prática:** muitos posts PT-BR usam termos em inglês no slug como empréstimos (`social-selling-`, `follow-up-`, `linkedin-`, `abm-`). Quando o PT-BR usa esses termos, o EN deve usar uma estrutura de frase diferente, não apenas remover os acentos.

**Exemplos de slugs a evitar:**

| PT-BR slug | EN slug ERRADO | EN slug CORRETO |
|-----------|----------------|-----------------|
| `social-selling-index-linkedin` | `social-selling-index-linkedin` (idêntico!) | `linkedin-social-selling-index-ssi-guide` |
| `social-selling-vs-spam-linkedin` | `social-selling-vs-spam-linkedin` | `linkedin-social-selling-vs-spam` |
| `follow-up-linkedin-b2b` | `follow-up-linkedin-b2b` | `linkedin-follow-up-b2b` ✅ (já usado) |
| `melhores-ferramentas-prospeccao-linkedin-2026` | `melhores-ferramentas-prospeccao-linkedin-2026` | `best-linkedin-prospecting-tools-2026` |

**Verificação obrigatória antes de criar post EN:**

```bash
node scripts/translation-audit.mjs
```

Se aparecer na seção `⚠️ Slugs idênticos`, o slug EN deve ser corrigido antes do commit.

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

# Frontmatter EN — Schema Padrão (Fase 6)

Usar EXATAMENTE este schema em todo post EN. Não omitir campos.

```yaml
---
title: "How B2B Founders Close More Deals via LinkedIn in 2025"
slug: "how-b2b-founders-close-more-linkedin-2025"
lang: "en"
date: "2025-05-01"
publishedAt: "2025-05-01T09:00:00-03:00"
dateModified: "2025-05-01"
description: "SEO meta description in English — 140-160 chars with primary keyword"
excerpt: "One or two sentences for listing card — max 100 chars"
category: "social-selling"
tags: ["linkedin", "b2b", "sales", "founder-led-sales", "chattie"]
image: "https://images.pexels.com/photos/XXXXXXX/pexels-photo-XXXXXXX.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
imageAlt: "B2B sales professional using LinkedIn — descriptive alt text ≤125 chars, keyword-relevant"
author: "Thiago Lisboa"
authorTitle: "CEO & Co-founder, Chattie"
authorBio: "Thiago Lisboa is CEO and co-founder of Chattie, AI SDR for LinkedIn. B2B sales specialist focused on social selling and prospecting automation for founders and commercial teams."
authorLinkedIn: "https://www.linkedin.com/in/thiagolisboai"
readTime: "8 min"
canonicalUrl: "https://trychattie.com/blog/how-b2b-founders-close-more-linkedin-2025"
structuredData: "faq"
geoOptimized: true
ptSlug: "founders-b2b-linkedin-2025"
---
```

## Campos obrigatórios — notas

- **`imageAlt`** — OBRIGATÓRIO. Gerado junto com a imagem do Pexels. Descrever o que está na foto + contexto do post. ≤125 chars.
- **`dateModified`** — sempre igual ao `date` na criação; atualizado em manutenção via `scripts/set-date-modified.mjs`
- **`authorTitle` / `authorBio` / `authorLinkedIn`** — injetados de `dexter.config.mjs > author` (versão em inglês para posts EN)
- **`structuredData`** — usar `"faq"` para posts informativos com FAQ, `"comparison"` para comparativos de ferramenta
- **`ptSlug`** — slug do post equivalente em PT-BR (para hreflang). Deixar vazio (`""`) se não houver par PT-BR ainda.

## structuredData valid values

- `"faq"` — informational post with FAQ section (≥ 3 questions)
- `"comparison"` — head-to-head tool comparison (requires markdown comparison table in content)

## Translation guidelines

1. Replace BR-specific examples with global examples
2. Adjust cultural references
3. Verify data sources have English versions
4. Review tone for global audience (more formal than PT-BR)
5. `imageAlt` must be in English — translate if adapting from PT-BR post

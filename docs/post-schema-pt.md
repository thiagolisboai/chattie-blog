# Frontmatter PT-BR — Schema Padrão

Usar EXATAMENTE este schema em todo post PT-BR. Não omitir campos.

```yaml
---
title: "Como founders B2B fecham mais pelo LinkedIn em 2025"
slug: "founders-b2b-linkedin-2025"
lang: "pt-BR"
date: "2025-04-03"
publishedAt: "2025-04-03T09:00:00-03:00"
dateModified: "2025-04-03"
description: "Meta description SEO em PT-BR — 140-160 caracteres com keyword principal"
excerpt: "Resumo para card de listagem — 1-2 frases em PT-BR, máx 100 chars"
category: "social-selling"
tags: ["linkedin", "b2b", "vendas", "founder-led-sales", "chattie"]
image: "/pt-br/blog/og/founders-linkedin-2025.jpg"
imageAlt: "Founders B2B fechando vendas pelo LinkedIn — profissional de vendas B2B no LinkedIn"
author: "Thiago Lisboa"
authorTitle: "CEO & Co-founder, Chattie"
authorBio: "Thiago Lisboa é CEO e co-founder do Chattie, AI SDR para LinkedIn. Especialista em vendas B2B, social selling e automação de prospecção para founders e equipes comerciais brasileiras."
authorLinkedIn: "https://www.linkedin.com/in/thiago-lisboa/"
readTime: "8 min"
canonicalUrl: "https://trychattie.com/pt-br/blog/founders-b2b-linkedin-2025"
structuredData: "article"
geoOptimized: true
enSlug: ""
---
```

## Categorias válidas

- `social-selling`
- `linkedin`
- `b2b`
- `ia-para-vendas`
- `chattie`

## Regras de slug

- Lowercase
- Hifens (sem underscores)
- Sem acentos (usar transliteração: "como-usar" não "como-utsar")
- Máx 60 chars

## Regras de description

- 140-160 caracteres
- Incluir keyword principal
- Em PT-BR natural, não robotizado

## Campos EEAT (obrigatórios — gerados automaticamente pelo Dexter)

- `author` — nome do autor (injetado de `dexter.config.mjs > author.name`)
- `authorTitle` — cargo e empresa (injetado de `author.title`)
- `authorBio` — bio curta 1-2 frases (injetado de `author.bio`)
- `authorLinkedIn` — URL do LinkedIn (injetado de `author.linkedIn`)
- `dateModified` — data da última modificação real do conteúdo (mantida automaticamente)

## structuredData

- `article` — post padrão
- `faq` — post com seção FAQ com 3+ perguntas
- `howto` — post tipo tutorial passo a passo

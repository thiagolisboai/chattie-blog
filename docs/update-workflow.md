# Update Workflow — Chattie Blog

> Princípio: **atualizar é tão importante quanto criar**. Posts indexados que perdem relevância
> prejudicam autoridade de domínio. Posts atualizados com `dateModified` recente ganham
> vantagem de frescor no Google.

---

## Quando atualizar um post

### Gatilhos obrigatórios (prioridade máxima)
- Post aparece em "Maiores quedas de ranking" no `docs/gsc-insights.md`
- Título ou description contém ano desatualizado (ex: "2025" em 2026)
- Fonte citada foi atualizada ou invalidada

### Gatilhos recomendados
- Post tem mais de 6 meses sem `dateModified`
- Produto Chattie lançou feature nova relevante ao tópico
- Concorrente novo surgiu (posts de comparativo)
- LinkedIn anunciou mudança de política (posts sobre automação)

---

## Passo a passo de atualização

### 1. Rodar o audit

```bash
node scripts/update-audit.mjs
```

Escolher o post com maior prioridade na lista.

### 2. O que revisar no post

- [ ] Título e description — ano atualizado, keyword ainda relevante
- [ ] Estatísticas e dados — verificar com `node scripts/source-audit.mjs` após editar
- [ ] Links internos — links quebrados ou posts removidos
- [ ] CTAs — URLs de produto corretas (trychattie.com/pt-br ou trychattie.com)
- [ ] Exemplos e ferramentas citadas — ainda existem, preços corretos
- [ ] "Como funciona o LinkedIn" — mudanças de interface ou política

### 3. Atualizar dateModified

```bash
node scripts/set-date-modified.mjs [slug] [data]
# Exemplo:
node scripts/set-date-modified.mjs ferramentas-para-prospeccao-no-linkedin 2026-04-15
```

**Nunca atualizar `dateModified` sem fazer pelo menos uma mudança real no conteúdo.**
Google penaliza "freshness washing" (atualizar a data sem mudar o conteúdo).

### 4. Verificar audits

```bash
node scripts/source-audit.mjs
node scripts/update-audit.mjs
```

### 5. Commit com convenção clara

```bash
git add content/blog/[slug].mdx
git commit -m "content(update): [slug] — [o que mudou em 1 linha]"
git push
```

---

## Sinais de que um post precisa de reescrita (não só update)

Se um post tem mais de um ano, está ranqueando na posição 15-30 para keyword principal
e o conteúdo ficou desatualizado em mais de 30%, considere reescrever do zero:
- Manter o mesmo slug (preserva links e autoridade acumulada)
- Atualizar `date` para a data atual
- Remover `publishedAt` antigo se o conteúdo for completamente novo

---

## Cadência recomendada

| Tipo de post | Frequência de revisão |
|-------------|----------------------|
| Ferramentas e comparativos | A cada 3 meses (preços e features mudam) |
| Guias "como fazer" | A cada 6 meses |
| Posts conceituais ("o que é") | A cada 12 meses |
| Posts de caso de uso | Quando o produto mudar relevantemente |

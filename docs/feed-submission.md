# Feed Submission — Chattie Blog RSS

> Tier 5 Item 19 — RSS feeds sem submissão a agregadores  
> Script de submissão: `node scripts/submit-feeds.mjs`

## Feeds ativos

| Lang  | URL |
|-------|-----|
| PT-BR | https://trychattie.com/feed.xml |
| EN    | https://trychattie.com/en/feed.xml |

Ambos os feeds são descobertos automaticamente via `<link rel="alternate">` no `<head>` do site.

---

## Agregadores — status de submissão

| Agregador      | PT-BR submetido | EN submetido | Data       | Notas |
|---------------|-----------------|--------------|------------|-------|
| Feedly         | [ ]             | [ ]          | —          |       |
| NewsBlur       | [ ]             | [ ]          | —          |       |
| Inoreader      | [ ]             | [ ]          | —          |       |
| Perplexity     | automático      | automático   | —          | rastreia via sitemap/descoberta automática |

**Após submeter:** marcar a checkbox com `[x]` e preencher a data.

---

## Como submeter — passo a passo

### Feedly

1. Acesse [feedly.com](https://feedly.com) e faça login (ou crie conta)
2. Clique em **+ Add Content** → **RSS feed**
3. Cole a URL do feed: `https://trychattie.com/feed.xml`
4. Confirme a adição → repita para `https://trychattie.com/en/feed.xml`
5. A indexação ocorre automaticamente em até 24h

**Link direto:**
- PT-BR: `https://feedly.com/i/subscription/feed/https%3A%2F%2Ftrychattie.com%2Ffeed.xml`
- EN: `https://feedly.com/i/subscription/feed/https%3A%2F%2Ftrychattie.com%2Fen%2Ffeed.xml`

### NewsBlur

1. Acesse [newsblur.com](https://newsblur.com) e crie conta gratuita
2. Clique em **+ Add a site** → cole a URL do feed
3. Repita para o feed EN

**Link direto:**
- PT-BR: `https://newsblur.com/?url=https%3A%2F%2Ftrychattie.com%2Ffeed.xml`
- EN: `https://newsblur.com/?url=https%3A%2F%2Ftrychattie.com%2Fen%2Ffeed.xml`

### Inoreader

1. Acesse [inoreader.com](https://www.inoreader.com) e crie conta
2. **Subscribe** → cole a URL do feed → confirme
3. Repita para o feed EN

### Perplexity Browse (automático)

Não requer ação manual. O Perplexity rastreia páginas e feeds via:
- `<link rel="alternate" type="application/rss+xml">` no `<head>` ✅ (já implementado em `app/layout.tsx`)
- Sitemap XML em `/sitemap.xml`
- Descoberta de links internos

---

## OPML — submissão em massa (opcional)

Para registrar ambos os feeds de uma vez em qualquer reader:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Chattie Blog Feeds</title>
  </head>
  <body>
    <outline text="Chattie Blog PT-BR" type="rss" xmlUrl="https://trychattie.com/feed.xml" htmlUrl="https://trychattie.com/pt-br/blog"/>
    <outline text="Chattie Blog EN" type="rss" xmlUrl="https://trychattie.com/en/feed.xml" htmlUrl="https://trychattie.com/blog"/>
  </body>
</opml>
```

Salvar como `feeds.opml` e importar em qualquer agregador via **Import OPML**.

---

## Verificar se o feed está sendo indexado

Após submissão, verificar em:
1. Feedly: pesquisar "Chattie" no campo de busca do Feedly
2. Google: `site:trychattie.com/feed.xml` (confirma que Google rastreia)
3. Ahrefs/Semrush: verificar backlinks de `feedly.com` ou `newsblur.com` ao domínio

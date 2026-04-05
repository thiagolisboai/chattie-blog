# Setup — Google Search Console API

## Passo a passo (uma vez, ~10 minutos)

### 1. Criar ou selecionar um projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto novo (ex: `chattie-blog-tools`) ou selecione um existente

### 2. Ativar a Search Console API

1. No projeto, vá em **APIs & Services → Library**
2. Busque **"Google Search Console API"**
3. Clique em **Enable**

### 3. Criar a Service Account

1. Vá em **IAM & Admin → Service Accounts**
2. Clique em **Create Service Account**
3. Nome: `chattie-blog-gsc`
4. Clique em **Create and Continue** (não precisa de papel/role aqui)
5. Clique em **Done**
6. Na lista, clique na service account criada
7. Aba **Keys → Add Key → Create new key → JSON**
8. O arquivo `.json` será baixado — guarde com segurança

### 4. Adicionar a service account ao GSC

1. Acesse [search.google.com/search-console](https://search.google.com/search-console)
2. Selecione a propriedade `trychattie.com`
3. **Configurações → Usuários e permissões → Adicionar usuário**
4. Email: o email da service account (ex: `chattie-blog-gsc@seu-projeto.iam.gserviceaccount.com`)
5. Permissão: **Restrito** (somente leitura — é o suficiente)
6. Clique em **Adicionar**

### 5. Configurar variáveis de ambiente

Abra o arquivo `.env.local` na raiz do projeto e adicione:

```
GSC_KEY_FILE=/caminho/absoluto/para/chattie-blog-gsc.json
GSC_SITE_URL=https://trychattie.com/
```

**Exemplo no Windows:**
```
GSC_KEY_FILE=C:/Users/tlisb/Documents/chattie-blog-gsc.json
```

### 6. Testar

```bash
node scripts/gsc-report.mjs
```

Se tudo estiver correto, o relatório será gerado em `docs/gsc-insights.md`.

Para analisar um período maior (ex: 60 dias):
```bash
node scripts/gsc-report.mjs --days=60
```

---

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `GSC_KEY_FILE não configurado` | Variável não setada no .env.local | Adicionar `GSC_KEY_FILE=/caminho/para/key.json` |
| `403 Forbidden` | Service account sem acesso ao GSC | Adicionar o email no GSC (passo 4) |
| `Error: No data returned` | Propriedade GSC errada | Verificar se `GSC_SITE_URL` bate com a propriedade no GSC |
| `insufficient_scope` | API não habilitada | Habilitar "Google Search Console API" no GCP (passo 2) |

---

## O que o relatório gera

O script produz `docs/gsc-insights.md` com:

- **Visão geral**: cliques, impressões, CTR médio e posição média do período
- **Oportunidades de CTR**: posts que aparecem muito mas são pouco clicados (title fraco)
- **Queries sem post dedicado**: buscas onde o domínio aparece mas sem conteúdo específico
- **Top 10 páginas**: o que já está funcionando
- **Maiores subidas**: posts que ganharam posição (entender o padrão)
- **Maiores quedas**: posts que precisam de atualização urgente
- **Conteúdo dormante**: impressões mas zero cliques (candidatos à reescrita)
- **Ações recomendadas**: lista priorizada para a sessão de conteúdo

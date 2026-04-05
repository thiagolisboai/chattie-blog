# Translation Workflow — Chattie Blog

> Princípio: **adaptar, não traduzir**. Posts EN não são versões automáticas dos PT-BR.
> São artigos independentes com exemplos globais, fontes em inglês e tom ajustado para o mercado internacional.

---

## Quando criar um par EN

Criar versão EN quando o post PT-BR:
- Aborda um tópico com demanda global (AI SDR, automação LinkedIn, Sales Navigator)
- Tem prioridade **Alta** no `docs/keyword-backlog.md`
- Já está consolidado (mín. 2 semanas publicado, sem correções pendentes)

**Não traduzir:**
- Posts muito focados no mercado BR (ex: "como o Chattie se paga" com referências a reais, cultura BR)
- Posts duplicados — se já existe EN cobrindo o mesmo tema, criar um novo é desperdício

---

## Passo a passo

### 1. Rodar o audit

```bash
node scripts/translation-audit.mjs
```

Escolher um post de **Alta prioridade** na lista "PT-BR sem par EN".

### 2. Pesquisar SERP em inglês

Buscar a keyword EN equivalente via Brave Search antes de escrever.

Analisar top 5 resultados: word count, H2s, ângulo, intenção de busca.
O EN pode ter intenção ligeiramente diferente do PT-BR — respeitar isso.

### 3. Escrever o post EN

- Salvar em `/content/blog-en/[en-slug].mdx`
- Seguir EXATAMENTE o frontmatter em `docs/post-schema-en.md`
- `lang: "en"` obrigatório
- `ptSlug`: slug do post PT-BR equivalente
- Mínimo 1800 palavras
- Adaptar exemplos para contexto global (não citar empresas BR específicas)
- Buscar fontes em inglês (não traduzir fontes PT-BR)
- Buscar imagem no Pexels com keyword em inglês

### 4. Atualizar o post PT-BR

Abrir o post PT-BR correspondente e preencher `enSlug` com o slug do novo post EN:

```yaml
enSlug: "novo-slug-en"
```

### 5. Verificar par

```bash
node scripts/translation-audit.mjs
```

O par deve aparecer em "Pares completos". Se ainda aparecer em "Links quebrados", checar:
- `enSlug` no post PT-BR bate com o `slug` do arquivo EN
- `ptSlug` no post EN bate com o `slug` do arquivo PT-BR

### 6. Commit e push

```bash
git add content/blog-en/[slug].mdx content/blog/[pt-slug].mdx
git commit -m "content(en): [título do post EN]"
git push
```

---

## Checklist por post EN

- [ ] SERP pesquisada (keyword EN)
- [ ] Frontmatter completo (todos os campos de `post-schema-en.md`)
- [ ] `ptSlug` preenchido
- [ ] Post PT-BR atualizado com `enSlug`
- [ ] Mínimo 1800 palavras
- [ ] Exemplos adaptados para contexto global
- [ ] Fontes em inglês verificadas (não inventadas)
- [ ] Imagem buscada no Pexels
- [ ] `node scripts/translation-audit.mjs` mostra par completo

---

## Nomenclatura de slugs EN

| PT-BR slug | EN slug sugerido |
|------------|-----------------|
| automacao-linkedin-o-que-e-permitido | linkedin-automation-what-is-allowed |
| chattie-vs-expandi | chattie-vs-expandi |
| chattie-vs-waalaxy | chattie-vs-waalaxy |
| ferramentas-para-prospeccao-no-linkedin | linkedin-prospecting-tools |
| ia-para-vendas-b2b | ai-for-b2b-sales |
| linkedin-para-vendas-b2b | linkedin-for-b2b-sales |
| o-que-e-um-crm-social | what-is-a-social-crm |
| como-otimizar-perfil-linkedin-para-vendas-b2b | optimize-linkedin-profile-for-b2b-sales |
| crm-para-social-selling | crm-for-social-selling |
| linkedin-para-gerar-leads-qualificados | linkedin-for-qualified-lead-generation |
| linkedin-para-vendas-consultivas | linkedin-for-consultative-sales |
| o-que-e-social-selling | what-is-social-selling |
| vender-no-linkedin-sem-estrategia | selling-on-linkedin-without-strategy |

---

## Posts EN órfãos (precisam de par PT-BR)

| EN slug | PT-BR sugerido | Status |
|---------|---------------|--------|
| ai-sdr-vs-human-sdr | sdr-ia-vs-sdr-humano | pendente |
| linkedin-prospecting-with-ai | prospectar-linkedin-com-ia | pendente |

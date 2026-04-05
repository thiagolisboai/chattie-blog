# Diretrizes de Fontes — Chattie Blog

> Regra central: **nunca publicar dado com fonte que não foi verificada**.
> Se não encontrar a fonte, remover o número ou atribuir a "estimativas de mercado".

---

## Fontes verificadas e confiáveis (usar sem restrição)

| Fonte | Como citar |
|-------|-----------|
| LinkedIn oficial | "Segundo o LinkedIn (ano)..." ou "(LinkedIn, ano)" |
| LinkedIn Sales Solutions | "Segundo o LinkedIn Sales Solutions (ano)..." |
| McKinsey & Company | "Segundo a McKinsey & Company (ano)..." — verificar URL |
| HubSpot State of Marketing/Sales | "Segundo o HubSpot (ano)..." — relatório anual público |
| Salesforce State of Sales | "Segundo a Salesforce (ano)..." — relatório anual público |
| Gartner | "Segundo o Gartner (ano)..." — verificar se dado é público |
| Forrester | Idem Gartner |
| TRA (dado interno) | "Segundo dados da TRA..." — dado de cliente/parceiro |

## Como verificar uma fonte

Antes de usar qualquer estatística:

```
1. Buscar via Brave Search: "[stat exato] [fonte] [ano] site oficial"
2. Confirmar que o número aparece na fonte original (não em blogs que citam blogs)
3. Verificar o ano — relatórios de 2020 não devem ser atribuídos a 2024
4. Se não encontrar: remover o número ou usar "estimativas de mercado"
```

## Fontes suspeitas (nunca citar sem verificação real)

Essas fontes são frequentemente citadas incorretamente em conteúdo de marketing:

| Fonte | Por que suspeita |
|-------|-----------------|
| Aberdeen Group | Adquirida pela HFS Research. Relatórios pagos. Dados de 2010-2015 circulam online com anos errados. |
| Sales Benchmark Index (SBI) | Relatórios pagos, raramente citados com URL pública. |
| Datanyze | Empresa de dados de contato, não publica benchmarks de conversão social. |
| CSO Insights | Adquirida pela MHI Group. Maioria dos relatórios arquivados. |
| Sirius Decisions | Integrada à Forrester. Dados circulam sem contexto. |

## Fontes proibidas

- Qualquer estatística sem URL verificável
- Dados atribuídos a "estudos internos" sem identificação
- Números em formato "X% das empresas fazem Y" sem fonte nomeada
- Referenciar "pesquisa de X (2024)" sem ter lido a pesquisa

## Templates de citação segura

**Dado com fonte verificada:**
> "Segundo o LinkedIn (2024), profissionais com alto SSI geram 45% mais oportunidades."

**Dado sem fonte precisa (usar com parcimônia):**
> "Benchmarks de outbound B2B indicam que mensagens personalizadas têm taxa de resposta 2 a 3x maior."

**Estimativa sem fonte:**
> "É comum que equipes sem ferramenta percam entre 15% e 25% das oportunidades por falta de acompanhamento."

**Dado nunca verificado → remover o número:**
> ~~"Segundo a Aberdeen Group (2024), 47% maior conversão..."~~ → "Operações com follow-up estruturado apresentam conversão consistentemente mais alta."

---

## Rodando a auditoria

```bash
node scripts/source-audit.mjs           # só fontes suspeitas (modo rápido)
node scripts/source-audit.mjs --strict  # inclui todos os avisos
```

O audit roda automaticamente antes do build (`npm run build`).
Se retornar código de saída 1 (fontes suspeitas encontradas), o build falha.

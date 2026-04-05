/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     DEXTER — Arquivo de Configuração                    ║
 * ║                                                                          ║
 * ║  Configure aqui todos os comportamentos do agente de conteúdo.          ║
 * ║  Não é necessário modificar código — apenas este arquivo.               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * COMO USAR:
 *   Edite os valores abaixo e faça commit. O Dexter lerá as novas
 *   configurações na próxima execução — local ou via GitHub Actions.
 *
 * VARIÁVEIS DE AMBIENTE (em .env.local ou GitHub Secrets) continuam sendo
 * necessárias para chaves de API. Este arquivo controla COMPORTAMENTO,
 * não credenciais.
 */

export default {

  // ──────────────────────────────────────────────────────────────────────────
  // 1. PUBLICAÇÃO
  // ──────────────────────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────────────────────
  // 0. AUTOR (EEAT — E-E-A-T signals)
  // Dados do autor dos posts gerados. Injetados automaticamente no frontmatter
  // de cada post e usados para Person schema markup no JSON-LD do blog.
  // ──────────────────────────────────────────────────────────────────────────

  author: {
    /**
     * Nome completo — exibido no byline e no frontmatter `author`.
     */
    name: 'Thiago Lisboa',

    /**
     * Cargo e empresa — exibido abaixo do nome e no Person schema.
     * Ex: "CEO & Co-founder, Chattie"
     */
    title: 'CEO & Co-founder, Chattie',

    /**
     * Bio curta (1-2 frases) — exibida na seção "Sobre o Autor" ao final do post.
     * Deve mencionar área de expertise relevante ao blog.
     */
    bio: 'Thiago Lisboa é CEO e co-founder do Chattie, AI SDR para LinkedIn. Especialista em vendas B2B, social selling e automação de prospecção para founders e equipes comerciais brasileiras.',

    /**
     * URL do perfil LinkedIn — usada no Person schema (sameAs) e no byline.
     * Deixe em branco para omitir o link.
     */
    linkedIn: 'https://www.linkedin.com/in/thiagolisboai',

    /**
     * URL do avatar/foto do autor — opcional, usada no byline visual.
     * Deixe em branco para usar avatar padrão.
     */
    avatarUrl: '',
  },

  publishing: {
    /**
     * Modo de publicação padrão para execuções manuais (workflow_dispatch).
     *   "direct" — commit e push direto para main (Vercel deploya automaticamente)
     *   "pr"     — cria Pull Request para revisão humana antes de publicar
     *   "dry-run"— gera o post mas não salva nem commita (útil para testar)
     */
    mode: 'direct',

    /**
     * Execuções agendadas (cron) sempre usam PR mode, independente de `mode`.
     * Recomendado: true — evita publicação automática sem revisão.
     * false → execuções agendadas seguem o `mode` acima.
     */
    scheduledRunsRequireReview: false,

    /**
     * URL de destino do CTA final em todos os posts gerados.
     */
    ctaUrl: 'https://trychattie.com/pt-br',

    /**
     * Autor dos commits gerados pelo Dexter.
     */
    gitAuthor: {
      name:  'Thiago Lisboa',
      email: 'dexter@trychattie.com',
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. AGENDAMENTO
  // ──────────────────────────────────────────────────────────────────────────

  schedule: {
    /**
     * Expressão cron para execuções automáticas (UTC).
     * Alterar aqui documenta a intenção — para efetuar a mudança no GitHub
     * Actions, atualize também o campo `cron` em .github/workflows/content-agent.yml.
     *
     * Exemplos:
     *   '0 11 * * 1,3,5'   → seg/qua/sex às 8h BRT (padrão atual)
     *   '0 11 * * 1'        → apenas segunda-feira
     *   '0 11 * * 1-5'      → dias úteis
     *   '0 14 * * 2,4'      → ter/qui às 11h BRT
     */
    cron: '0 11 * * 1,3,5',

    /**
     * Descrição legível do agendamento (usada em logs e dashboard).
     */
    cronDescription: 'Segunda, Quarta e Sexta às 8h BRT',

    /**
     * Impede publicar mais de um post por dia.
     * false → permite múltiplos posts no mesmo dia (use com cuidado).
     */
    deduplicateDaily: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. CONTEÚDO
  // ──────────────────────────────────────────────────────────────────────────

  content: {
    /**
     * Mínimo de palavras aceito para publicar um post.
     * Posts abaixo desse limite são rejeitados e o agente para com erro.
     * O brief pede 1800 palavras; este limite tem 200 de tolerância.
     */
    minWordCount: 1600,

    /**
     * Mínimo de palavras solicitado no brief ao modelo.
     * Deve ser maior que minWordCount.
     */
    targetWordCount: 1800,

    /**
     * Mínimo de perguntas exigidas na seção FAQ.
     * Relevante quando structuredData: "faq" está definido.
     */
    minFaqQuestions: 3,

    /**
     * Mínimo de internal links que o post deve conter.
     * O brief solicita 2-3; este valor aparece nas instruções.
     */
    minInternalLinks: 2,

    /**
     * Velocidade de leitura para calcular o campo `readTime`.
     * Palavras por minuto.
     */
    wordsPerMinute: 200,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PIPELINE DE QUALIDADE
  // Cada item pode ser ligado (true) ou desligado (false) individualmente.
  // ──────────────────────────────────────────────────────────────────────────

  quality: {
    /**
     * T1.4 — Verificação de afirmações estatísticas via Brave Search.
     * Afirmações não verificadas são reescritas pelo modelo.
     * Desligar reduz tempo e custo, mas aumenta risco de dados incorretos.
     */
    groundingVerify: true,

    /**
     * Fase 4 — Auditoria de fontes proibidas (Aberdeen Group, etc.).
     * Sempre recomendado. Desligar apenas para testes.
     */
    sourceAudit: true,

    /**
     * A2 — Validação de internal links.
     * Garante que links /pt-br/blog/slug apontam para posts existentes.
     */
    internalLinkValidation: true,

    /**
     * T2.9 — Schema validation gate.
     * Exige que structuredData: "faq" tenha ## FAQ com ≥ minFaqQuestions.
     * Exige que structuredData: "comparison" tenha tabela markdown.
     */
    schemaValidation: true,

    /**
     * T3.12 — Featured snippet optimization.
     * Adiciona resposta direta no início de cada H2 para capturar position 0.
     * Faz chamadas extras à API Anthropic por seção sem resposta direta.
     */
    snippetOptimize: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. INTELIGÊNCIA
  // Funcionalidades que afetam a seleção de keywords e a qualidade do prompt.
  // ──────────────────────────────────────────────────────────────────────────

  intelligence: {
    /**
     * B2 — Análise de conteúdo dos top resultados SERP.
     * Extrai H2s e contagem de palavras dos concorrentes para diferenciação.
     * Desligar economiza tempo e requisições HTTP.
     */
    serpContentAnalysis: true,

    /**
     * T3.11 — Few-shot examples no system prompt.
     * Os 2 posts melhor avaliados são usados como referência de estilo.
     * Desligar reduz tokens do prompt.
     */
    fewShotExamples: true,

    /**
     * Número de posts usados como exemplos de estilo (few-shot).
     */
    fewShotCount: 2,

    /**
     * T4.20 — Rating mínimo para incluir post como exemplo.
     * 3 = neutro (padrão), 4 = bom, 5 = excelente.
     * Aumentar para 4 exclui posts medianos dos exemplos.
     */
    fewShotMinRating: 3,

    /**
     * T3.14 — GEO instructions explícitas no prompt.
     * Instruções para otimizar o post para citação por LLMs (ChatGPT, Perplexity).
     */
    geoInstructions: true,

    /**
     * T4.20 — Refinamentos de qualidade humana no prompt.
     * Anti-padrões e boas práticas extraídos de docs/prompt-refinements.md.
     */
    qualityRefinements: true,

    /**
     * T3.13 — Detecção de canibalização de keywords.
     * Evita criar post novo quando um existente já cobre ≥70% da keyword.
     * false → cria o post mesmo que canibalize (equivale a --force-new).
     */
    cannibalCheck: true,

    /**
     * Threshold de sobreposição para canibalização (0-1).
     * 0.70 = 70% dos tokens da keyword aparecem no título de um post existente.
     */
    cannibalThreshold: 0.70,

    /**
     * T4.18 — Verificação de tendência via Brave Search.
     * Keywords com sinal de tendência < trendThreshold recebem aviso.
     * false → seleciona keywords sem considerar sazonalidade.
     */
    trendCheck: true,

    /**
     * Score mínimo de tendência (0-1) para aceitar keyword sem aviso.
     * 0.20 = 20% dos resultados de busca mencionam o ano atual.
     */
    trendThreshold: 0.20,

    /**
     * B5 — Controle de diversidade de categorias.
     * Impede que uma categoria domine o blog.
     */
    diversityCheck: true,

    /**
     * Limites máximos por categoria (0-1 = percentual do total de posts).
     * Baseado nas metas de distribuição do CLAUDE.md.
     */
    categoryLimits: {
      'linkedin':       0.50,
      'social-selling': 0.50,
      'comparativos':   0.20,
      'chattie':        0.20,
      'ia-para-vendas': 0.20,
    },

    /**
     * C3 — Injeção de links bidirecionais nos posts relacionados.
     * Após publicar, injeta backlinks em até 3 posts relacionados.
     * Desligar evita modificar posts existentes automaticamente.
     */
    linkGraphInjection: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. AÇÕES PÓS-PUBLICAÇÃO
  // O que acontece após o post ser gerado e aprovado.
  // ──────────────────────────────────────────────────────────────────────────

  postPublish: {
    /**
     * T1.1 — Submeter URL para indexação imediata no Google.
     * Reduz tempo de indexação de dias para horas.
     * Requer: GSC_KEY_FILE com permissão de Proprietário Delegado.
     */
    googleIndexing: true,

    /**
     * T1.3 — Criar rascunho de newsletter no Beehiiv após publicação.
     * O draft fica pendente de aprovação humana antes do envio.
     * Requer: BEEHIIV_API_KEY e BEEHIIV_PUBLICATION_ID.
     *
     * CRITÉRIO DE ATIVAÇÃO (F4.2):
     * Ative quando o blog tiver ≥5 posts com CTR > 2% no GSC (sinal de audiência receptiva).
     * O dashboard em docs/dexter-dashboard.md mostra "Beehiiv: pronto para ativar" quando
     * o critério for atingido. Altere para true quando esse aviso aparecer.
     */
    beehiivDraft: false,

    /**
     * A5 — Enviar notificação por email após publicação.
     * Requer: MAIL_USERNAME, MAIL_PASSWORD e NOTIFY_EMAIL.
     */
    emailNotification: true,

    /**
     * T3.15 — Gerar rascunho de post LinkedIn após publicação.
     * Salvo em docs/linkedin-drafts/[slug].md para aprovação humana.
     * Faz 1 chamada adicional à API Anthropic por post.
     *
     * CRITÉRIO DE ATIVAÇÃO (F4.2):
     * Ative quando o fluxo de PR Mode estiver rodando consistentemente por ≥4 semanas
     * (você já revisou e aprovou ≥8 PRs sem rejeições). Isso garante que os drafts
     * LinkedIn gerados serão de qualidade suficiente para revisar e postar.
     */
    linkedinDraft: false,

    /**
     * T2.7 — Gerar dashboard unificado após cada sessão.
     * Atualiza docs/dexter-dashboard.md com métricas agregadas.
     */
    generateDashboard: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. SELEÇÃO DE KEYWORDS
  // ──────────────────────────────────────────────────────────────────────────

  keywordSelection: {
    /**
     * B1 — Priorizar queries GSC sem post dedicado antes do backlog.
     * false → sempre usa o backlog independente dos dados GSC.
     */
    preferGscGaps: true,

    /**
     * B4 — Adicionar automaticamente queries GSC ao backlog.
     * Queries com impressões > gscMinImpressions são adicionadas.
     */
    autoDiscoverFromGsc: true,

    /**
     * Impressões mínimas de uma query GSC para ser adicionada ao backlog.
     */
    gscMinImpressions: 20,

    /**
     * Impressões mínimas de um gap GSC para ser considerado como nova keyword.
     */
    gscGapMinImpressions: 30,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. CONTROLE DE CUSTOS (BUDGET GUARDRAILS)
  // ──────────────────────────────────────────────────────────────────────────

  budget: {
    /**
     * Modelo Anthropic usado para geração e reescritas.
     * Modelos disponíveis: claude-sonnet-4-6, claude-haiku-4-5-20251001
     * Haiku é ~10x mais barato mas com qualidade inferior.
     */
    anthropicModel: 'claude-sonnet-4-6',

    /**
     * Número máximo de imagens buscadas no Pexels por post.
     * Menor = menos variação; maior = mais chances de foto relevante.
     */
    pexelsResultsCount: 6,

    /**
     * Número de resultados Brave Search por busca de SERP.
     */
    serpResultsCount: 5,

    /**
     * Número de páginas SERP a scrape para análise competitiva (B2).
     * Mais páginas = melhor análise, mais lento.
     */
    serpScrapeCount: 3,

    /**
     * Delay entre chamadas à Brave Search para evitar rate limiting.
     * Em milissegundos.
     */
    searchDelayMs: 1000,

    /**
     * Delay entre chamadas de snippet optimization (entre seções H2).
     * Em milissegundos.
     */
    snippetDelayMs: 800,

    /**
     * F2.3 — Custo máximo por sessão em USD.
     * Se o acumulado de chamadas Anthropic ultrapassar este valor,
     * a sessão é interrompida com erro antes de gerar mais chamadas.
     * 0 = sem limite (não recomendado em produção).
     */
    maxCostPerSessionUSD: 3.00,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. MONITORAMENTO E MANUTENÇÃO
  // ──────────────────────────────────────────────────────────────────────────

  monitoring: {
    /**
     * T2.6 — Salvar histórico GSC em docs/gsc-history.jsonl.
     * Necessário para tendências no dashboard (T2.7).
     */
    gscHistory: true,

    /**
     * C1 — Gerar feedback-queue.md para posts com CTR ou posição fraca.
     * O feedback-loop.yml roda mensalmente.
     */
    feedbackLoop: true,

    /**
     * T4.19 — Monitorar conteúdo dos concorrentes.
     * O competitor-monitor.yml roda no dia 15 de cada mês.
     */
    competitorMonitor: true,

    /**
     * Dias mínimos de vida de um post antes de entrar no feedback loop.
     * Permite que o Google indexe e acumule dados antes de avaliar.
     */
    feedbackMinAgeDays: 30,
  },

}

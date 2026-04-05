/**
 * Load Config — helper para importar e validar dexter.config.mjs
 *
 * Garante que o config existe e tem uma estrutura válida.
 * Faz deep merge com defaults seguros para que campos ausentes
 * não quebrem o agente.
 *
 * Uso:
 *   import { config } from './load-config.mjs'
 *   if (config.postPublish.linkedinDraft) { ... }
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Safe defaults (mirrors dexter.config.mjs structure) ─────────────────────
// Used when a field is missing from the user's config file.

const DEFAULTS = {
  author: {
    name:      'Thiago Lisboa',
    title:     'CEO & Co-founder, Chattie',
    bio:       'Thiago Lisboa é CEO e co-founder do Chattie, AI SDR para LinkedIn. Especialista em vendas B2B e automação de prospecção.',
    linkedIn:  'https://www.linkedin.com/in/thiagolisboai',
    avatarUrl: '',
  },
  publishing: {
    mode:                     'pr',
    scheduledRunsRequireReview: true,
    ctaUrl:                   'https://trychattie.com/pt-br',
    gitAuthor: { name: 'Dexter', email: 'dexter@trychattie.com' },
  },
  schedule: {
    cron:              '0 11 * * 1,3,5',
    cronDescription:   'Segunda, Quarta e Sexta às 8h BRT',
    deduplicateDaily:  true,
  },
  content: {
    minWordCount:      1600,
    targetWordCount:   1800,
    minFaqQuestions:   3,
    minInternalLinks:  2,
    wordsPerMinute:    200,
  },
  quality: {
    groundingVerify:        true,
    sourceAudit:            true,
    internalLinkValidation: true,
    schemaValidation:       true,
    snippetOptimize:        true,
  },
  intelligence: {
    serpContentAnalysis: true,
    fewShotExamples:     true,
    fewShotCount:        2,
    fewShotMinRating:    3,
    geoInstructions:     true,
    qualityRefinements:  true,
    cannibalCheck:       true,
    cannibalThreshold:   0.70,
    trendCheck:          true,
    trendThreshold:      0.20,
    diversityCheck:      true,
    categoryLimits: {
      'linkedin':       0.50,
      'social-selling': 0.50,
      'comparativos':   0.20,
      'chattie':        0.20,
      'ia-para-vendas': 0.20,
    },
    linkGraphInjection: true,
  },
  postPublish: {
    googleIndexing:    true,
    beehiivDraft:      true,
    emailNotification: true,
    linkedinDraft:     true,
    generateDashboard: true,
  },
  keywordSelection: {
    preferGscGaps:        true,
    autoDiscoverFromGsc:  true,
    gscMinImpressions:    20,
    gscGapMinImpressions: 30,
  },
  budget: {
    anthropicModel:    'claude-sonnet-4-6',
    pexelsResultsCount: 6,
    serpResultsCount:  5,
    serpScrapeCount:   3,
    searchDelayMs:     1000,
    snippetDelayMs:        800,
    maxCostPerSessionUSD:  3.00,
  },
  monitoring: {
    gscHistory:          true,
    feedbackLoop:        true,
    competitorMonitor:   true,
    feedbackMinAgeDays:  30,
  },
}

// ─── Deep merge ───────────────────────────────────────────────────────────────

function deepMerge(defaults, overrides) {
  const result = { ...defaults }
  for (const key of Object.keys(overrides || {})) {
    if (
      overrides[key] !== null &&
      typeof overrides[key] === 'object' &&
      !Array.isArray(overrides[key]) &&
      typeof defaults[key] === 'object'
    ) {
      result[key] = deepMerge(defaults[key], overrides[key])
    } else {
      result[key] = overrides[key]
    }
  }
  return result
}

// ─── Load config ──────────────────────────────────────────────────────────────

let userConfig = {}

const configPath = path.join(ROOT, 'dexter.config.mjs')

if (fs.existsSync(configPath)) {
  try {
    const mod = await import(`file://${configPath}`)
    userConfig = mod.default || {}
  } catch (err) {
    console.warn(`⚠️  Erro ao carregar dexter.config.mjs: ${err.message}`)
    console.warn('   Usando configurações padrão.')
  }
} else {
  console.warn('⚠️  dexter.config.mjs não encontrado — usando configurações padrão.')
  console.warn('   Crie o arquivo na raiz do projeto para personalizar o agente.')
}

export const config = deepMerge(DEFAULTS, userConfig)

// ─── Helper: log active config on demand ─────────────────────────────────────

export function printConfig() {
  const c = config
  console.log('\n⚙️  Dexter — Configuração Ativa:')
  console.log(`   Modo de publicação:   ${c.publishing.mode}`)
  console.log(`   Crons requerem PR:    ${c.publishing.scheduledRunsRequireReview}`)
  console.log(`   Agendamento:          ${c.schedule.cronDescription}`)
  console.log(`   Modelo Anthropic:     ${c.budget.anthropicModel}`)
  console.log('')
  console.log('   Pipeline de qualidade:')
  console.log(`     Grounding verify:     ${c.quality.groundingVerify ? '✅' : '❌'}`)
  console.log(`     Source audit:         ${c.quality.sourceAudit ? '✅' : '❌'}`)
  console.log(`     Schema validation:    ${c.quality.schemaValidation ? '✅' : '❌'}`)
  console.log(`     Snippet optimize:     ${c.quality.snippetOptimize ? '✅' : '❌'}`)
  console.log(`     Link validation:      ${c.quality.internalLinkValidation ? '✅' : '❌'}`)
  console.log('')
  console.log('   Inteligência:')
  console.log(`     SERP analysis:        ${c.intelligence.serpContentAnalysis ? '✅' : '❌'}`)
  console.log(`     Few-shot examples:    ${c.intelligence.fewShotExamples ? '✅' : '❌'}`)
  console.log(`     GEO instructions:     ${c.intelligence.geoInstructions ? '✅' : '❌'}`)
  console.log(`     Cannibalization:      ${c.intelligence.cannibalCheck ? '✅' : '❌'}`)
  console.log(`     Trend check:          ${c.intelligence.trendCheck ? '✅' : '❌'}`)
  console.log(`     Link graph:           ${c.intelligence.linkGraphInjection ? '✅' : '❌'}`)
  console.log('')
  console.log('   Pós-publicação:')
  console.log(`     Google indexing:      ${c.postPublish.googleIndexing ? '✅' : '❌'}`)
  console.log(`     Beehiiv draft:        ${c.postPublish.beehiivDraft ? '✅' : '❌'}`)
  console.log(`     Email notification:   ${c.postPublish.emailNotification ? '✅' : '❌'}`)
  console.log(`     LinkedIn draft:       ${c.postPublish.linkedinDraft ? '✅' : '❌'}`)
  console.log(`     Dashboard:            ${c.postPublish.generateDashboard ? '✅' : '❌'}`)
}

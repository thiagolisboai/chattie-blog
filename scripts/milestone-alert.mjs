/**
 * milestone-alert.mjs — Alertas de anomalia e marco do Dexter
 *
 * Roda diariamente após o GSC report. Só envia email quando algo relevante
 * aconteceu — nunca envia email de "tudo igual".
 *
 * Milestones (disparam uma vez cada):
 *   first_impression   — primeira impressão orgânica
 *   first_click        — primeiro clique orgânico
 *   clicks_10          — 10 cliques acumulados
 *   clicks_50          — 50 cliques acumulados
 *   clicks_100         — 100 cliques acumulados
 *   clicks_500         — 500 cliques acumulados
 *   first_top10        — primeiro post com posição média <= 10
 *   first_top5         — primeiro post com posição média <= 5
 *   first_top3         — primeiro post com posição média <= 3
 *   posts_10           — 10 posts PT-BR publicados
 *   posts_25           — 25 posts PT-BR publicados
 *   posts_50           — 50 posts PT-BR publicados
 *   en_posts_5         — 5 posts EN publicados
 *   en_posts_10        — 10 posts EN publicados
 *
 * Anomalias (disparam toda vez que detectadas):
 *   cost_high          — custo de sessão > $2.00
 *   agent_silent       — nenhum post publicado nos últimos 7 dias úteis
 *   impressions_drop   — queda de impressões > 30% semana a semana
 *   rank_loss_spike    — 3+ posts com queda de ranking simultânea
 *
 * Estado persistido em: docs/milestone-state.json
 * Saída: exit 0 sempre (não bloqueia o workflow)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Paths ────────────────────────────────────────────────────────────────────

const STATE_FILE   = path.join(ROOT, 'docs', 'milestone-state.json')
const GSC_HISTORY  = path.join(ROOT, 'docs', 'gsc-history.jsonl')
const COST_LOG     = path.join(ROOT, 'docs', 'cost-log.jsonl')
const SESSION_LOG  = path.join(ROOT, 'docs', 'agent-session-log.md')
const BLOG_DIR     = path.join(ROOT, 'content', 'blog')
const BLOG_EN_DIR  = path.join(ROOT, 'content', 'blog-en')

// ─── State ────────────────────────────────────────────────────────────────────

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { fired: {}, lastAnomaly: {} }
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) }
  catch { return { fired: {}, lastAnomaly: {} } }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

// ─── Data loaders ─────────────────────────────────────────────────────────────

function loadGscHistory() {
  if (!fs.existsSync(GSC_HISTORY)) return []
  return fs.readFileSync(GSC_HISTORY, 'utf-8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l) } catch { return null } })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function loadCostLog() {
  if (!fs.existsSync(COST_LOG)) return []
  return fs.readFileSync(COST_LOG, 'utf-8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l) } catch { return null } })
    .filter(Boolean)
}

function loadSessionLog() {
  if (!fs.existsSync(SESSION_LOG)) return []
  const raw = fs.readFileSync(SESSION_LOG, 'utf-8')
  const entries = []
  const sections = raw.split(/\n## /).slice(1)
  for (const s of sections) {
    const dateMatch = s.match(/^(\d{4}-\d{2}-\d{2})/)
    if (dateMatch) entries.push({ date: dateMatch[1], raw: s })
  }
  return entries
}

function countPosts() {
  const pt = fs.existsSync(BLOG_DIR)
    ? fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx')).length : 0
  const en = fs.existsSync(BLOG_EN_DIR)
    ? fs.readdirSync(BLOG_EN_DIR).filter(f => f.endsWith('.mdx')).length : 0
  return { pt, en }
}

// ─── Cost helpers ─────────────────────────────────────────────────────────────

function getSessionCostToday(costLog) {
  const today = new Date().toISOString().split('T')[0]
  return costLog
    .filter(e => e.ts?.startsWith(today))
    .reduce((sum, e) => sum + (e.costUsd || 0), 0)
}

function getTotalCost(costLog) {
  return costLog.reduce((sum, e) => sum + (e.costUsd || 0), 0)
}

// ─── GSC helpers ──────────────────────────────────────────────────────────────

function latestGsc(history) {
  return history.length > 0 ? history[history.length - 1] : null
}

function previousGsc(history) {
  return history.length > 1 ? history[history.length - 2] : null
}

function impressionsDrop(current, previous) {
  if (!previous || !previous.totals.impressions) return 0
  const delta = current.totals.impressions - previous.totals.impressions
  return delta / previous.totals.impressions // negative = drop
}

// ─── Agent silence check ──────────────────────────────────────────────────────

function daysSinceLastPost(sessions) {
  if (sessions.length === 0) return Infinity
  const last = sessions[sessions.length - 1].date
  const ms = Date.now() - new Date(last).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// ─── Alert builders ───────────────────────────────────────────────────────────

const MILESTONE_LABELS = {
  first_impression:  '👁️  Primeira impressão orgânica',
  first_click:       '🖱️  Primeiro clique orgânico',
  clicks_10:         '🎯  10 cliques orgânicos acumulados',
  clicks_50:         '🏆  50 cliques orgânicos acumulados',
  clicks_100:        '🚀  100 cliques orgânicos',
  clicks_500:        '🔥  500 cliques orgânicos',
  first_top10:       '📈  Primeiro post em top 10',
  first_top5:        '📈  Primeiro post em top 5',
  first_top3:        '🥇  Primeiro post em top 3',
  posts_10:          '📝  10 posts PT-BR publicados',
  posts_25:          '📝  25 posts PT-BR publicados',
  posts_50:          '📝  50 posts PT-BR publicados',
  en_posts_5:        '🌐  5 posts EN publicados',
  en_posts_10:       '🌐  10 posts EN publicados',
}

const ANOMALY_LABELS = {
  cost_high:         '💸  Custo de sessão alto (> $2.00)',
  agent_silent:      '🔇  Agente silencioso (sem publicação em 7+ dias úteis)',
  impressions_drop:  '📉  Queda brusca de impressões (> 30%)',
  rank_loss_spike:   '⚠️  Spike de quedas de ranking (3+ posts simultâneos)',
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔔  Milestone Alert — verificando...')

  const state    = loadState()
  const gscHist  = loadGscHistory()
  const costLog  = loadCostLog()
  const sessions = loadSessionLog()
  const { pt: ptCount, en: enCount } = countPosts()
  const gsc      = latestGsc(gscHist)
  const prevGsc  = previousGsc(gscHist)

  const newMilestones = []
  const newAnomalies  = []

  // ── Milestone checks ────────────────────────────────────────────────────────

  const clicks     = gsc?.totals?.clicks ?? 0
  const impressions = gsc?.totals?.impressions ?? 0
  const position   = gsc?.totals?.position ?? 99

  const milestoneChecks = [
    { key: 'first_impression', hit: impressions >= 1 },
    { key: 'first_click',      hit: clicks >= 1 },
    { key: 'clicks_10',        hit: clicks >= 10 },
    { key: 'clicks_50',        hit: clicks >= 50 },
    { key: 'clicks_100',       hit: clicks >= 100 },
    { key: 'clicks_500',       hit: clicks >= 500 },
    { key: 'first_top10',      hit: position > 0 && position <= 10 },
    { key: 'first_top5',       hit: position > 0 && position <= 5 },
    { key: 'first_top3',       hit: position > 0 && position <= 3 },
    { key: 'posts_10',         hit: ptCount >= 10 },
    { key: 'posts_25',         hit: ptCount >= 25 },
    { key: 'posts_50',         hit: ptCount >= 50 },
    { key: 'en_posts_5',       hit: enCount >= 5 },
    { key: 'en_posts_10',      hit: enCount >= 10 },
  ]

  for (const { key, hit } of milestoneChecks) {
    if (hit && !state.fired[key]) {
      state.fired[key] = new Date().toISOString()
      newMilestones.push({ key, label: MILESTONE_LABELS[key] })
      console.log(`  ✨  Milestone: ${key}`)
    }
  }

  // ── Anomaly checks ──────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0]

  // Cost anomaly — only once per day
  const sessionCostToday = getSessionCostToday(costLog)
  if (sessionCostToday > 2.00 && state.lastAnomaly.cost_high !== today) {
    state.lastAnomaly.cost_high = today
    newAnomalies.push({
      key: 'cost_high',
      label: ANOMALY_LABELS.cost_high,
      detail: `Custo hoje: $${sessionCostToday.toFixed(4)} (limite: $2.00)`,
    })
    console.log(`  ⚠️   Anomalia: custo alto — $${sessionCostToday.toFixed(4)}`)
  }

  // Agent silence — only once per day
  const silenceDays = daysSinceLastPost(sessions)
  if (silenceDays >= 7 && state.lastAnomaly.agent_silent !== today) {
    state.lastAnomaly.agent_silent = today
    newAnomalies.push({
      key: 'agent_silent',
      label: ANOMALY_LABELS.agent_silent,
      detail: `Último post: ${silenceDays} dias atrás. Verifique os workflows no GitHub Actions.`,
    })
    console.log(`  ⚠️   Anomalia: agente silencioso — ${silenceDays} dias`)
  }

  // Impressions drop — only once per day
  if (gsc && prevGsc) {
    const drop = impressionsDrop(gsc, prevGsc)
    if (drop < -0.30 && state.lastAnomaly.impressions_drop !== today) {
      state.lastAnomaly.impressions_drop = today
      newAnomalies.push({
        key: 'impressions_drop',
        label: ANOMALY_LABELS.impressions_drop,
        detail: `Impressões: ${prevGsc.totals.impressions} → ${gsc.totals.impressions} (${Math.round(drop * 100)}%)`,
      })
      console.log(`  ⚠️   Anomalia: queda de impressões — ${Math.round(drop * 100)}%`)
    }
  }

  // Rank loss spike — only once per day
  const rankLosses = gsc?.rankLosses ?? 0
  if (rankLosses >= 3 && state.lastAnomaly.rank_loss_spike !== today) {
    state.lastAnomaly.rank_loss_spike = today
    newAnomalies.push({
      key: 'rank_loss_spike',
      label: ANOMALY_LABELS.rank_loss_spike,
      detail: `${rankLosses} posts com queda de ranking detectados pelo GSC.`,
    })
    console.log(`  ⚠️   Anomalia: ${rankLosses} quedas de ranking`)
  }

  // ── Nothing to report ───────────────────────────────────────────────────────

  if (newMilestones.length === 0 && newAnomalies.length === 0) {
    console.log('  ✅  Nada a reportar — nenhum milestone novo nem anomalia detectada.')
    saveState(state)
    process.exit(0)
  }

  // ── Build email body ─────────────────────────────────────────────────────────

  const lines = []
  const totalCost = getTotalCost(costLog)

  if (newMilestones.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('🏆  MARCOS ATINGIDOS')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    for (const m of newMilestones) {
      lines.push(`  ${m.label}`)
    }
    lines.push('')
  }

  if (newAnomalies.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('⚠️   ANOMALIAS DETECTADAS')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    for (const a of newAnomalies) {
      lines.push(`  ${a.label}`)
      if (a.detail) lines.push(`  ${a.detail}`)
      lines.push('')
    }
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('📊  ESTADO ATUAL DO BLOG')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push(`  Posts PT-BR:     ${ptCount}`)
  lines.push(`  Posts EN:        ${enCount}`)
  lines.push(`  Impressões GSC:  ${impressions}`)
  lines.push(`  Cliques GSC:     ${clicks}`)
  lines.push(`  Posição média:   ${position > 0 ? position.toFixed(1) : '—'}`)
  lines.push(`  Custo total API: $${totalCost.toFixed(4)}`)
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push('Links úteis:')
  lines.push('- Blog PT-BR: https://trychattie.com/pt-br/blog')
  lines.push('- Blog EN:    https://trychattie.com/blog')
  lines.push('- Dashboard:  https://github.com/thiagolisboai/chattie-blog/blob/main/docs/dexter-dashboard.md')
  lines.push('- Actions:    https://github.com/thiagolisboai/chattie-blog/actions')
  lines.push('')
  lines.push('--')
  lines.push('Dexter - Agente de Conteúdo Autônomo do Chattie Blog')

  const emailBody = lines.join('\n')

  // ── Write outputs for GitHub Actions ────────────────────────────────────────

  const subjectParts = []
  if (newMilestones.length > 0) subjectParts.push(`${newMilestones.length} marco(s) atingido(s)`)
  if (newAnomalies.length > 0) subjectParts.push(`${newAnomalies.length} anomalia(s)`)
  const subject = `Dexter Alert: ${subjectParts.join(' + ')}`

  // Write for GitHub Actions step output
  const outputFile = process.env.GITHUB_OUTPUT
  if (outputFile) {
    const out = [
      `has_alerts=true`,
      `subject=${subject}`,
      `milestone_count=${newMilestones.length}`,
      `anomaly_count=${newAnomalies.length}`,
      `body<<ALERT_EOF`,
      emailBody,
      `ALERT_EOF`,
    ].join('\n')
    fs.appendFileSync(outputFile, out + '\n', 'utf-8')
  }

  // Also write body to a temp file (more reliable for multi-line)
  const bodyFile = path.join(ROOT, '.dexter-alert-body.txt')
  fs.writeFileSync(bodyFile, emailBody, 'utf-8')

  console.log(`\n📧  Email preparado: "${subject}"`)
  console.log(`   Milestones: ${newMilestones.map(m => m.key).join(', ') || '—'}`)
  console.log(`   Anomalias:  ${newAnomalies.map(a => a.key).join(', ') || '—'}`)

  // ── Persist state ────────────────────────────────────────────────────────────

  saveState(state)

  process.exit(0)
}

main().catch(err => {
  console.error('❌  milestone-alert falhou:', err.message)
  process.exit(0) // nunca bloqueia o workflow pai
})

/**
 * Anthropic Client — cliente compartilhado com retry, backoff e rastreamento de custo
 *
 * Usado por: generate-post.mjs, update-post.mjs, generate-post-en.mjs,
 *            grounding-verify.mjs
 *
 * Funcionalidades:
 *   - Retry automático com backoff exponencial (padrão: 3 tentativas)
 *   - Log de tokens e custo estimado por chamada em docs/cost-log.jsonl
 *   - Não retenta erros de autenticação (falha imediata)
 *   - Timeout configurável (padrão: 120s)
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// claude-sonnet-4-6 pricing (USD por million tokens)
const PRICING = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
  default: { input: 3.0, output: 15.0 },
}

// ─── F2.3: Session-level cost accumulator ────────────────────────────────────
// Resets when the Node.js process starts. Shared across all callAnthropic() calls
// within a single autonomous-session.mjs run.

let _sessionCostUSD = 0

/** Returns the total Anthropic cost incurred in this process so far. */
export function getSessionCost() { return _sessionCostUSD }

/** Resets the session counter (useful for tests). */
export function resetSessionCost() { _sessionCostUSD = 0 }

// ─── Core request (sem retry) ─────────────────────────────────────────────────

function _request(key, model, maxTokens, system, user, timeoutMs) {
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString())
          if (json.error) {
            const err = new Error(`Anthropic: ${json.error.message}`)
            err.type = json.error.type
            err.status = res.statusCode
            reject(err)
          } else {
            resolve({
              text: json.content?.[0]?.text || '',
              inputTokens: json.usage?.input_tokens || 0,
              outputTokens: json.usage?.output_tokens || 0,
              model,
            })
          }
        } catch (e) { reject(e) }
      })
    })

    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy()
      reject(new Error(`Anthropic timeout após ${timeoutMs / 1000}s`))
    })
    req.write(body)
    req.end()
  })
}

// ─── Cost logger ──────────────────────────────────────────────────────────────

function logCost(result, label) {
  const { inputTokens, outputTokens, model } = result
  const prices = PRICING[model] || PRICING.default
  const costUsd = (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000

  const entry = {
    ts: new Date().toISOString(),
    label,
    model,
    inputTokens,
    outputTokens,
    costUsd: parseFloat(costUsd.toFixed(5)),
  }

  try {
    const logPath = path.join(ROOT, 'docs', 'cost-log.jsonl')
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8')
  } catch { /* nao bloquear se doc nao existe ainda */ }

  console.log(`   💰  ${inputTokens}in + ${outputTokens}out = ~$${costUsd.toFixed(4)} USD [${label}]`)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Chama a Anthropic API com retry automático e log de custo.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} options
 * @param {string}  options.model      — default: claude-sonnet-4-6
 * @param {number}  options.maxTokens  — default: 8192
 * @param {number}  options.maxRetries — default: 3
 * @param {number}  options.timeoutMs  — default: 120000
 * @param {string}  options.label      — para o log de custo (ex: "generate-post", "grounding")
 * @returns {Promise<string>} texto da resposta
 */
export async function callAnthropic(systemPrompt, userPrompt, options = {}) {
  const {
    model = 'claude-sonnet-4-6',
    maxTokens = 8192,
    maxRetries = 3,
    timeoutMs = 120000,
    label = 'api-call',
    maxCostUSD = 0,   // 0 = no cap (overridden by config below)
  } = options

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurado')

  // F2.3: Budget cap check — load config lazily to avoid circular imports
  let capUSD = maxCostUSD
  if (capUSD === 0) {
    try {
      const { config } = await import('./load-config.mjs')
      capUSD = config.budget?.maxCostPerSessionUSD ?? 0
    } catch { /* ignore — no cap if config unavailable */ }
  }
  if (capUSD > 0 && _sessionCostUSD >= capUSD) {
    throw new Error(
      `💸  Budget cap atingido: $${_sessionCostUSD.toFixed(4)} acumulado nesta sessão ` +
      `(limite: $${capUSD.toFixed(2)}). ` +
      `Aumente budget.maxCostPerSessionUSD em dexter.config.mjs para continuar.`
    )
  }

  let lastError
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await _request(key, model, maxTokens, systemPrompt, userPrompt, timeoutMs)
      logCost(result, label)
      // F2.3: Accumulate session cost
      const prices = PRICING[result.model] || PRICING.default
      _sessionCostUSD += (result.inputTokens * prices.input + result.outputTokens * prices.output) / 1_000_000
      return result.text
    } catch (err) {
      lastError = err

      // Nao retenta erros de autenticacao ou de schema (sao determinísticos)
      const noRetry = err.type === 'authentication_error' || err.status === 400
      if (noRetry || attempt === maxRetries) break

      const waitMs = attempt * 20000  // 20s, 40s — conservador para evitar rate limits
      console.warn(`⚠️  Anthropic tentativa ${attempt}/${maxRetries}: ${err.message.slice(0, 80)}`)
      console.warn(`   Aguardando ${waitMs / 1000}s antes de tentar novamente...`)
      await new Promise(r => setTimeout(r, waitMs))
    }
  }

  throw lastError
}

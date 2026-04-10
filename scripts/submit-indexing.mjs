/**
 * Submit Indexing — T1.1: notifica o Google para indexar uma URL imediatamente
 *
 * Usa a Google Indexing API v3 com a mesma service account do GSC.
 * Reduz o tempo de indexação de dias para horas.
 *
 * PRÉ-REQUISITO (uma vez):
 *   1. Google Cloud Console → APIs & Services → Enable "Web Search Indexing API"
 *   2. A service account já precisa ser "Proprietário Delegado" do site no GSC
 *      (Configurações → Usuários e permissões → adicionar email da service account como PROPRIETÁRIO)
 *      Nota: Permissão de "Proprietário" é obrigatória — Editor não funciona com Indexing API.
 *
 * Uso:
 *   node scripts/submit-indexing.mjs --slug=meu-post-slug
 *   node scripts/submit-indexing.mjs --url=https://trychattie.com/pt-br/blog/meu-slug
 *   node scripts/submit-indexing.mjs --slug=meu-slug --type=URL_DELETED  (para remover)
 *
 * Saída:
 *   Exit 0 — URL submetida com sucesso (ou graceful degradation se API indisponível)
 *   Exit 1 — erro de autenticação (precisa configurar permissão de Proprietário)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Load .env.local ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const [k, ...v] = line.split('=')
    if (k && !k.startsWith('#') && v.length) {
      const key = k.trim()
      if (!process.env[key]) process.env[key] = v.join('=').trim()
    }
  })
}
loadEnv()

// ─── Args ─────────────────────────────────────────────────────────────────────

const slugArg  = process.argv.find(a => a.startsWith('--slug='))
const urlArg   = process.argv.find(a => a.startsWith('--url='))
const typeArg  = process.argv.find(a => a.startsWith('--type='))
const SITE_URL = process.env.GSC_SITE_URL || 'https://trychattie.com/'
const KEY_FILE = process.env.GSC_KEY_FILE

const notifType = typeArg ? typeArg.split('=')[1] : 'URL_UPDATED'

let targetUrl = null
if (urlArg) {
  targetUrl = urlArg.split('=').slice(1).join('=')
} else if (slugArg) {
  const slug = slugArg.split('=').slice(1).join('=')
  targetUrl = `${SITE_URL.replace(/\/$/, '')}/pt-br/blog/${slug}`
}

if (!targetUrl) {
  console.error('Uso: node scripts/submit-indexing.mjs --slug=meu-slug')
  console.error('     node scripts/submit-indexing.mjs --url=https://...')
  process.exit(1)
}

// ─── Validate setup ───────────────────────────────────────────────────────────

if (!KEY_FILE || !fs.existsSync(KEY_FILE)) {
  console.warn('⚠️  GSC_KEY_FILE não configurado — pulando indexing submission')
  console.warn('   Configure GSC_KEY_FILE em .env.local ou como variável de ambiente')
  process.exit(0) // graceful degradation — não bloqueia o pipeline
}

// ─── Submit to Google Indexing API ───────────────────────────────────────────

async function submitUrl(url, type) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  })

  const indexing = google.indexing({ version: 'v3', auth })

  const res = await indexing.urlNotifications.publish({
    requestBody: { url, type },
  })

  return res.data
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`🔍  Submetendo para indexação: ${targetUrl}`)
console.log(`    Tipo: ${notifType}`)

try {
  const result = await submitUrl(targetUrl, notifType)
  console.log(`✅  URL submetida com sucesso!`)
  console.log(`    notifyTime: ${result.urlNotificationMetadata?.latestUpdate?.notifyTime || 'n/a'}`)
  console.log(`    O Google deve indexar em algumas horas.`)

  // Log to file
  const entry = {
    ts: new Date().toISOString(),
    url: targetUrl,
    type: notifType,
    status: 'submitted',
  }
  const logPath = path.join(ROOT, 'docs', 'indexing-log.jsonl')
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8')

  process.exit(0)
} catch (err) {
  const message = err.message || String(err)

  // Todos os erros da Indexing API são non-fatal: indexação imediata é uma otimização,
  // não um requisito. O post já foi publicado — o Google vai indexar pelo crawl normal.
  // Nunca usar process.exit(1) aqui para não matar o workflow por motivo não-crítico.

  if (message.includes('403') || message.includes('Forbidden') || message.includes('permission')) {
    console.warn(`⚠️  Indexing API: erro de permissão — service account precisa ser Proprietária Delegada no GSC`)
    console.warn(`    1. GSC → Configurações → Usuários e permissões → adicionar service account como Proprietário Delegado`)
    console.warn(`    2. Aguarde até 48h para propagação`)
    console.warn(`    Post publicado normalmente — Google indexará via crawl padrão.`)
    process.exit(0)
  }

  if (message.includes('has not been used') || message.includes('is not enabled') || message.includes('enabled')) {
    console.warn(`⚠️  Indexing API: Web Search Indexing API não habilitada no projeto GCP da service account`)
    console.warn(`    Solução: GCP Console → projeto correto → APIs & Services → Enable "Web Search Indexing API"`)
    console.warn(`    ATENÇÃO: habilitar no projeto que contém a service account, não em outro projeto.`)
    console.warn(`    Post publicado normalmente — Google indexará via crawl padrão.`)
    process.exit(0)
  }

  // Outros erros: graceful degradation
  console.warn(`⚠️  Indexing API falhou (${message.slice(0, 120)}) — continuando sem indexação imediata`)
  process.exit(0)
}

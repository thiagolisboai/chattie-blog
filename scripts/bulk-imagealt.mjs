#!/usr/bin/env node
/**
 * bulk-imagealt.mjs — Adiciona imageAlt a posts MDX que estão sem o campo
 * Uso: node scripts/bulk-imagealt.mjs [--dry-run]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')
const BLOG_EN_DIR = path.join(ROOT, 'content', 'blog-en')
const DRY_RUN = process.argv.includes('--dry-run')

// imageAlt por slug — descritivo, keyword-relevante, ≤125 chars
const ALT_MAP = {
  // ── PT-BR ─────────────────────────────────────────────────────────────────
  'automacao-linkedin-o-que-e-permitido':
    'Automação no LinkedIn: o que é permitido e o que pode banir sua conta — profissional verificando limites de uso do LinkedIn B2B',
  'chattie-vs-expandi':
    'Chattie vs Expandi: comparativo direto de ferramentas de prospecção no LinkedIn para B2B em 2026',
  'chattie-vs-waalaxy':
    'Chattie vs Waalaxy: comparativo de ferramentas LinkedIn — CRM social vs automação de sequências para B2B',
  'como-founders-usam-o-chattie':
    'Founders B2B usando o Chattie para organizar prospecção e follow-up no LinkedIn sem automação',
  'como-o-chattie-se-paga':
    'ROI do Chattie para LinkedIn B2B — cálculo de retorno sobre investimento em ferramenta de social selling',
  'como-otimizar-perfil-linkedin-para-vendas-b2b':
    'Como otimizar perfil do LinkedIn para vendas B2B — headline, sobre e featured voltados para compradores',
  'como-prospectar-clientes-no-linkedin':
    'Como prospectar clientes no LinkedIn sem parecer insistente — profissional de vendas B2B personalizando abordagem',
  'crm-para-social-selling':
    'CRM para social selling no LinkedIn — gestão de pipeline e relacionamentos B2B em conversas de inbox',
  'ferramentas-para-prospeccao-no-linkedin':
    'Melhores ferramentas de prospecção no LinkedIn em 2026 — comparativo com risco, preço e uso ideal para B2B',
  'follow-up-linkedin-b2b':
    'Follow-up no LinkedIn B2B — profissional gerenciando cadência de follow-up sem perder contexto de conversa',
  'guia-completo-social-selling-linkedin':
    'Guia completo de social selling no LinkedIn: 4 pilares e 7 etapas para gerar pipeline B2B sem anúncios',
  'ia-para-prospeccao-no-linkedin':
    'IA para prospecção no LinkedIn B2B — inteligência artificial identificando sinais de prontidão de compra em 2026',
  'ia-para-vendas-b2b':
    'IA para vendas B2B em 2026 — profissional usando inteligência artificial para prospecção e qualificação no LinkedIn',
  'linkedin-para-gerar-leads-qualificados':
    'Como gerar leads qualificados no LinkedIn B2B — estratégia de prospecção sem automação genérica',
  'linkedin-para-prospeccao-b2b-guia-definitivo':
    'LinkedIn para prospecção B2B: guia definitivo de perfil, conteúdo e automação segura para SDRs e founders',
  'linkedin-para-vendas-b2b':
    'Como construir autoridade no LinkedIn para se destacar em vendas B2B — posicionamento e conteúdo estratégico',
  'linkedin-para-vendas-consultivas':
    'LinkedIn para vendas consultivas B2B — construção de relacionamento e autoridade de especialista na plataforma',
  'linkedin-para-vendas':
    'LinkedIn para vendas B2B — profissional convertendo conexões em clientes com método e contexto real',
  'mensagem-de-conexao-linkedin-exemplos':
    'Mensagem de conexão no LinkedIn: 12 exemplos reais para B2B — o que escrever e o que nunca enviar',
  'o-que-e-social-selling':
    'O que é social selling no LinkedIn — definição, 4 pilares e como founders B2B aplicam na prática',
  'o-que-e-um-ai-sdr':
    'O que é um AI SDR — representante de desenvolvimento de vendas com inteligência artificial no LinkedIn B2B',
  'o-que-e-um-crm-social':
    'O que é CRM Social — ferramenta para organizar conversas e pipeline de vendas B2B no LinkedIn',
  'pitch-de-prospeccao-linkedin':
    'Pitch de prospecção no LinkedIn — como estruturar mensagem B2B que gera resposta sem parecer spam',
  'social-selling-b2b-metodologia-completa-linkedin-2026':
    'Metodologia completa de social selling B2B no LinkedIn: do ICP ao fechamento em 2026',
  'vender-no-linkedin-sem-estrategia':
    'Erros de quem vende no LinkedIn sem estratégia — 5 erros comuns e como corrigi-los com método B2B',
  // ── EN ────────────────────────────────────────────────────────────────────
  'ai-sdr-vs-human-sdr':
    'AI SDR vs Human SDR — comparing artificial intelligence and human sales development for B2B pipeline building',
  'linkedin-follow-up-b2b':
    'LinkedIn follow-up for B2B sales — professional reconnecting with prospects without damaging the relationship',
  'linkedin-prospecting-guide':
    'LinkedIn prospecting guide for B2B — sales professional finding and engaging ideal leads without cold pitching',
  'linkedin-prospecting-with-ai':
    'LinkedIn prospecting with AI — artificial intelligence helping B2B sales professional prioritize warm prospects',
  'linkedin-social-selling-guide':
    'LinkedIn social selling guide — building B2B pipeline through relationships and consistent content presence',
  'what-is-a-social-crm-and-why-it-matters-for-linkedin-b2b':
    'What is a social CRM — tool for organizing LinkedIn B2B sales conversations and tracking relationship signals',
  'what-is-an-ai-sdr':
    'What is an AI SDR — artificial intelligence sales development representative for B2B LinkedIn prospecting',
  'what-is-social-selling-and-why-it-matters-in-b2b':
    'What is social selling in B2B — building LinkedIn relationships and trust before the sales conversation begins',
}

let added = 0
let skipped = 0
let missing = 0

function processDir(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'))
  for (const file of files) {
    const filePath = path.join(dir, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    if (content.includes('\nimageAlt:') || content.includes('\r\nimageAlt:')) {
      skipped++
      continue
    }

    const slugMatch = content.match(/^slug:\s*"([^"]+)"/m)
    if (!slugMatch) { skipped++; continue }
    const slug = slugMatch[1]

    const alt = ALT_MAP[slug]
    if (!alt) {
      console.log(`  ⚠️   Sem alt definido para: ${slug}`)
      missing++
      continue
    }

    // Insert imageAlt on the line immediately after image:
    const updated = content.replace(
      /^(image:\s*"https:\/\/[^"]+")$/m,
      `$1\nimageAlt: "${alt}"`
    )

    if (updated === content) {
      console.log(`  ⚠️   Não encontrou image: em: ${slug}`)
      missing++
      continue
    }

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, updated, 'utf-8')
    }
    console.log(`  ✅  ${DRY_RUN ? '[dry] ' : ''}imageAlt → ${slug}`)
    added++
  }
}

console.log('=== bulk-imagealt.mjs ===')
if (DRY_RUN) console.log('Modo: DRY RUN\n')

processDir(BLOG_DIR)
processDir(BLOG_EN_DIR)

console.log(`\nResultado: ${added} adicionados, ${skipped} já tinham alt, ${missing} sem mapeamento`)

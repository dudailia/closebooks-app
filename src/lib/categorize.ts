import Anthropic from '@anthropic-ai/sdk'
import type { Transaction, ChartOfAccounts } from '@/types'
import { buildSystemPrompt, buildUserPrompt, type LearnedRuleLine } from '@/lib/categorization/prompts'
import type { ClientContext } from '@/lib/categorization/prompts'
import type { CorrectionHint } from '@/lib/categorization/types'
import { normalizeThresholds, type CategorizationThresholds } from '@/lib/categorization/thresholds'
import { applyLearnedRules } from '@/lib/categorization/vendorCache'

export type { CorrectionHint } from '@/lib/categorization/types'
export type { LearnedRuleLine }

const BATCH_SIZE = 50
const MAX_RETRIES = 4
const BASE_DELAY_MS = 800

const MODEL_HAIKU = process.env.ANTHROPIC_MODEL_HAIKU ?? 'claude-3-5-haiku-20241022'
const MODEL_SONNET = process.env.ANTHROPIC_MODEL_SONNET ?? 'claude-sonnet-4-6'

/** Approximate $ per 1M tokens (input+output blended — tune from pricing page). */
const USD_PER_M_HAIKU = 1.2
const USD_PER_M_SONNET = 4.0

export interface CategorizeOptions {
  client?: ClientContext
  corrections?: CorrectionHint[]
  learnedRules?: LearnedRuleLine[]
  thresholds?: Partial<CategorizationThresholds>
}

export interface CategorizeMetrics {
  haikuBatches: number
  sonnetBatches: number
  learnedApplied: number
  estimatedCostUsd: number
}

interface ClaudeRow {
  index: number
  suggested_account_code: string
  suggested_account_name: string
  confidence: number
  reasoning?: string
  flags?: string[] | null
  tax_relevant?: boolean
  suggested_1099_vendor?: boolean
  secondary_suggestion?: {
    suggested_account_code: string
    suggested_account_name: string
    reasoning?: string
  }
}

function parseDateMs(d: string): number {
  const t = Date.parse(d)
  return Number.isNaN(t) ? 0 : t
}

function duplicateIdsInBatch(transactions: Transaction[]): Set<string> {
  const dup = new Set<string>()
  const byAmount = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const k = Math.abs(t.amount).toFixed(2)
    const list = byAmount.get(k) ?? []
    list.push(t)
    byAmount.set(k, list)
  }
  for (const group of byAmount.values()) {
    if (group.length < 2) continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = parseDateMs(group[i].date)
        const b = parseDateMs(group[j].date)
        if (a && b && Math.abs(a - b) <= 2 * 86400000) {
          dup.add(group[i].id)
          dup.add(group[j].id)
        }
      }
    }
  }
  return dup
}

function extractJSONArray(text: string): ClaudeRow[] {
  const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const match = stripped.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in Claude response')
  return JSON.parse(match[0]) as ClaudeRow[]
}

function confidenceTo01(c: number): number {
  const n = Number(c)
  if (Number.isNaN(n)) return 0.5
  if (n > 1 && n <= 100) return Math.min(1, n / 100)
  return Math.min(1, Math.max(0, n))
}

function calibrateConfidence(description: string, amount: number, raw01: number): number {
  let conf = raw01
  if (Math.abs(amount) < 20) conf -= 0.06
  const desc = description.trim()
  const wordCount = desc.split(/\s+/).filter(Boolean).length
  const allDigits = /^\d+$/.test(desc)
  if (wordCount <= 1 || allDigits || desc.length <= 4) conf = Math.min(conf, 0.62)
  return Math.min(1, Math.max(0, conf))
}

function estimateUsd(model: string, system: string, user: string, output: string): number {
  const inTok = (system.length + user.length) / 4
  const outTok = output.length / 4
  const rate = model.includes('haiku') ? USD_PER_M_HAIKU : USD_PER_M_SONNET
  return ((inTok + outTok) / 1_000_000) * rate
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const client = new Anthropic()

async function callModel(model: string, system: string, user: string): Promise<string> {
  const message = await client.messages.create({
    model,
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const content = message.content[0]
  if (content.type !== 'text') throw new Error(`Unexpected content: ${content.type}`)
  return content.text
}

async function runBatchWithRetry(model: string, system: string, user: string): Promise<{ text: string; usd: number }> {
  let lastErr: Error | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await callModel(model, system, user)
      return { text, usd: estimateUsd(model, system, user, text) }
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e))
      if (attempt === MAX_RETRIES) break
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1))
    }
  }
  throw lastErr ?? new Error('Claude failed')
}

function pickModelForBatch(batch: Transaction[]): string {
  const complex = batch.some((t) => Math.abs(t.amount) >= 50000 || t.description.length > 200)
  return complex ? MODEL_SONNET : MODEL_HAIKU
}

export async function categorizeTransactions(
  transactions: Transaction[],
  chartOfAccounts: ChartOfAccounts[],
  options: CategorizeOptions = {}
): Promise<{ transactions: Transaction[]; metrics: CategorizeMetrics }> {
  const thresholds = normalizeThresholds(options.thresholds)
  const clientCtx: ClientContext = options.client ?? {
    clientName: 'Client',
    industry: 'General',
    accrualOrCash: 'accrual',
    fiscalYearEnd: '12-31',
  }
  const corrections = options.corrections ?? []
  const learnedRules = options.learnedRules ?? []

  if (!transactions.length) {
    return { transactions: [], metrics: { haikuBatches: 0, sonnetBatches: 0, learnedApplied: 0, estimatedCostUsd: 0 } }
  }
  if (!chartOfAccounts.length) throw new Error('Chart of accounts is empty.')

  const validCodes = new Set(chartOfAccounts.map((a) => a.code))

  let haikuBatches = 0
  let sonnetBatches = 0
  let learnedApplied = 0
  let totalUsd = 0

  const results: Transaction[] = []

  for (let offset = 0; offset < transactions.length; offset += BATCH_SIZE) {
    const batch = transactions.slice(offset, offset + BATCH_SIZE)
    const dupIds = duplicateIdsInBatch(batch)

    const learnedOut: Map<string, Transaction> = new Map()
    const needAi: Transaction[] = []

    for (const tx of batch) {
      const learned = applyLearnedRules(tx, learnedRules, chartOfAccounts)
      if (learned) {
        learnedApplied++
        const conf = 0.94
        let status: Transaction['status'] = 'pending'
        if (conf >= thresholds.autoApprove) status = 'approved'
        else if (conf < thresholds.reviewFloor) status = 'flagged'
        else status = 'pending'
        learnedOut.set(tx.id, {
          ...tx,
          suggested_category: learned.name,
          suggested_account_code: learned.code,
          confidence: conf,
          status,
          reasoning: 'Applied learned rule (vendor/pattern match).',
        })
      } else {
        needAi.push(tx)
      }
    }

    const system = buildSystemPrompt({
      client: clientCtx,
      chartOfAccounts,
      historicalRules: learnedRules,
      correctionHints: corrections,
    })

    let byId = new Map<string, ClaudeRow>()

    if (needAi.length > 0) {
      const primaryModel = pickModelForBatch(needAi)
      if (primaryModel.includes('haiku')) haikuBatches++
      else sonnetBatches++

      const userPrompt = buildUserPrompt(
        needAi
          .map(
            (t, idx) =>
              `${idx}: id=${t.id} | date=${t.date} | description="${t.description}" | amount=${t.amount.toFixed(2)} | type=${t.type}`
          )
          .join('\n')
      )

      let rows: ClaudeRow[]
      try {
        const { text, usd } = await runBatchWithRetry(primaryModel, system, userPrompt)
        totalUsd += usd
        rows = extractJSONArray(text)
      } catch {
        for (const tx of batch) {
          if (learnedOut.has(tx.id)) results.push(learnedOut.get(tx.id)!)
          else results.push({ ...tx, status: 'flagged' })
        }
        continue
      }

      for (const r of rows) {
        const tx = needAi[r.index]
        if (tx) byId.set(tx.id, r)
      }

      const needSonnet = needAi.filter((t) => {
        const r = byId.get(t.id)
        if (!r) return true
        const c = confidenceTo01(r.confidence)
        const codeOk = validCodes.has(String(r.suggested_account_code).trim())
        return !codeOk || c < 0.5
      })

      if (needSonnet.length > 0 && primaryModel === MODEL_HAIKU) {
        sonnetBatches++
        const user2 = buildUserPrompt(
          needSonnet
            .map(
              (t, idx) =>
                `${idx}: id=${t.id} | date=${t.date} | description="${t.description}" | amount=${t.amount.toFixed(2)} | type=${t.type}`
            )
            .join('\n')
        )
        try {
          const { text, usd } = await runBatchWithRetry(MODEL_SONNET, system, user2)
          totalUsd += usd
          const rows2 = extractJSONArray(text)
          for (const r of rows2) {
            const tx = needSonnet[r.index]
            if (tx) byId.set(tx.id, r)
          }
        } catch {
          /* keep primary */
        }
      }
    }

    for (const tx of batch) {
      if (learnedOut.has(tx.id)) {
        results.push(learnedOut.get(tx.id)!)
        continue
      }
      const row = byId.get(tx.id)
      if (!row) {
        results.push({ ...tx, status: 'flagged' })
        continue
      }

      let code = String(row.suggested_account_code).trim()
      if (!validCodes.has(code)) {
        const acc = chartOfAccounts.find((a) => a.name === row.suggested_account_name?.trim())
        if (acc && validCodes.has(acc.code)) code = acc.code
        else {
          results.push({ ...tx, status: 'flagged', notes: tx.notes ?? 'Invalid GL code from model' })
          continue
        }
      }

      const acc = chartOfAccounts.find((a) => a.code === code)
      const catName = acc?.name ?? row.suggested_account_name

      let c01 = calibrateConfidence(tx.description, tx.amount, confidenceTo01(row.confidence))
      const flags = new Set((row.flags ?? []).map(String))
      if (c01 < thresholds.reviewFloor) flags.add('needs_review')
      if (dupIds.has(tx.id)) flags.add('potential_duplicate')

      let status: Transaction['status'] = 'pending'
      if (c01 >= thresholds.autoApprove) status = 'approved'
      else if (c01 < thresholds.reviewFloor || flags.has('needs_review')) status = 'flagged'
      else status = 'pending'

      const extra: string[] = []
      if (row.secondary_suggestion?.suggested_account_code) {
        extra.push(`Alt: ${row.secondary_suggestion.suggested_account_code}`)
      }

      results.push({
        ...tx,
        suggested_category: catName,
        suggested_account_code: code,
        confidence: c01,
        status,
        reasoning: row.reasoning,
        tax_relevant: row.tax_relevant,
        suggested_1099_vendor: row.suggested_1099_vendor,
        categorization_flags: Array.from(flags),
        notes: [tx.notes, extra.join(' ')].filter(Boolean).join(' | ') || undefined,
      })
    }
  }

  return {
    transactions: results,
    metrics: {
      haikuBatches,
      sonnetBatches,
      learnedApplied,
      estimatedCostUsd: Math.round(totalUsd * 1e6) / 1e6,
    },
  }
}

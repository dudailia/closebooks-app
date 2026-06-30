import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { categorizeTransactions } from '@/lib/categorize'
import type { Transaction, ChartOfAccounts } from '@/types'
import { rateLimit } from '@/lib/rateLimit'
import { sanitizeForPrompt } from '@/lib/promptSanitize'
import { DEMO_COA } from '@/lib/demoData'
import { DEMO_MAX_ROWS } from '@/lib/demo/parseDemoCsv'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC, UNAUTHENTICATED, PAID endpoint — it calls the Anthropic API on behalf
// of anonymous visitors. Distinct from the authenticated /api/categorize, which
// this route does NOT touch. Four layers of abuse defense, in order:
//
//   1. Per-IP rate limit  — caps runs per IP per hour.
//   2. Row cap            — at most DEMO_MAX_ROWS (25) transactions per call,
//                           enforced by the request schema, so one call ≈ one
//                           Anthropic batch (~2–3¢).
//   3. Daily spend cap    — a soft global ceiling on model-backed runs/day;
//                           once tripped, the route returns mode:"fallback" and
//                           the client renders deterministic sample data instead
//                           of calling the model.
//   4. Prompt sanitization — uploaded descriptions are untrusted text that flows
//                           into the model prompt; each field is control-char
//                           stripped and length-clamped before use.
//
// CAVEAT (intentional, documented): the rate-limit and daily counters live in
// process memory (src/lib/rateLimit.ts), so on multi-instance serverless they
// are enforced PER INSTANCE, not globally. They blunt casual abuse and bound
// per-instance spend, but are not a hard global guarantee. For strict global
// enforcement, back both counters with Redis/Upstash (KV) keyed the same way.
// On every non-live path the route degrades to mode:"fallback" rather than
// erroring, so the demo keeps working even if the model is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

const PER_IP_MAX = Number(process.env.DEMO_IP_HOURLY) || 8       // runs / IP / hour
const PER_IP_WINDOW_MS = 60 * 60 * 1000
const DAILY_CAP = Number(process.env.DEMO_DAILY_CAP) || 500       // model-backed runs / day / instance
const MAX_DESC_LEN = 200

const rowSchema = z.object({
  date: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  amount: z.number().finite().optional(),
  type: z.enum(['debit', 'credit']).optional(),
})
const bodySchema = z.object({
  // Row cap (guard #2) is the schema's .max — an over-cap payload is a 422,
  // never reaching the model.
  transactions: z.array(rowSchema).min(1).max(DEMO_MAX_ROWS),
})

// Daily spend cap (guard #3) — per-instance counter, reset on date rollover.
let daily = { day: '', count: 0 }
function withinDailyCap(): boolean {
  const today = new Date().toISOString().slice(0, 10)
  if (daily.day !== today) daily = { day: today, count: 0 }
  daily.count += 1
  return daily.count <= DAILY_CAP
}

function fallback(reason: string) {
  // 200 so the client treats it as a normal "use deterministic data" signal,
  // not an error. `reason` is for observability only.
  return NextResponse.json({ mode: 'fallback', reason }, { status: 200 })
}

export async function POST(request: NextRequest) {
  // Guard #1 — per-IP rate limit. 429 so a scripted abuser sees the limit; the
  // browser client treats any non-2xx as a fallback signal too.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  const rl = rateLimit(`demo-categorize:${ip}`, PER_IP_MAX, PER_IP_WINDOW_MS)
  if (!rl.ok) {
    return NextResponse.json(
      { mode: 'fallback', reason: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    )
  }

  // Parse + validate (guard #2 row cap is enforced here by the schema).
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }

  // Missing key → graceful fallback (a misconfigured deploy shows the walkthrough,
  // it does not 500 the public page).
  if (!process.env.ANTHROPIC_API_KEY) return fallback('not_configured')

  // Guard #3 — daily spend cap.
  if (!withinDailyCap()) return fallback('daily_cap')

  // Guard #4 — sanitize untrusted upload text before it reaches the prompt, and
  // normalize into the Transaction shape the categorizer expects.
  const txs: Transaction[] = parsed.data.transactions.map((r, i) => {
    const amount = Math.abs(Number(r.amount) || 0)
    const type: 'debit' | 'credit' = r.type ?? ((Number(r.amount) || 0) < 0 ? 'debit' : 'credit')
    const description = sanitizeForPrompt(r.description ?? '', MAX_DESC_LEN) || 'Transaction'
    return {
      id: `demo-${i}`,
      date: sanitizeForPrompt(r.date ?? '', 60),
      description,
      original_description: description,
      amount,
      type,
      suggested_category: '',
      suggested_account_code: '',
      confidence: 0,
      status: 'pending',
    }
  })

  try {
    const categorized = await categorizeTransactions(txs, DEMO_COA as ChartOfAccounts[])
    return NextResponse.json({ mode: 'live', transactions: categorized }, { status: 200 })
  } catch (err) {
    console.error('demo categorize failed:', err instanceof Error ? err.message : err)
    // Degrade to the deterministic sample rather than surfacing a 500 on the
    // marketing demo.
    return fallback('error')
  }
}

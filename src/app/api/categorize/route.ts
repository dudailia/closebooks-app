import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { categorizeTransactions, type CorrectionHint } from '@/lib/categorize'
import type { Transaction, ChartOfAccounts } from '@/types'
import { rateLimit } from '@/lib/rateLimit'
import { sanitizeForPrompt } from '@/lib/promptSanitize'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

export const dynamic = 'force-dynamic'
const bodySchema = z.object({
  transactions: z.array(z.record(z.string(), z.unknown())),
  chartOfAccounts: z.array(z.record(z.string(), z.unknown())),
  clientName: z.string().min(1).max(500),
  corrections: z.array(z.record(z.string(), z.unknown())).optional(),
})

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  const uid = user?.id ?? request.headers.get('x-forwarded-for') ?? 'anon'
  const rl = rateLimit(`categorize:${uid}`, 10, 1000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  console.log('=== API route /api/categorize HIT ===')
  console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY)

  // Guard here, inside the handler, not at module level
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is missing from environment')
    return NextResponse.json({ error: 'Server misconfiguration: API key not set.' }, { status: 500 })
  }

  // --- Parse body -----------------------------------------------------------
  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    console.error('Failed to parse request JSON:', err)
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }

  const { transactions, chartOfAccounts, clientName, corrections = [] } = parsed.data
  const safeClient = sanitizeForPrompt(clientName, 500)

  console.log(
    `Received: ${transactions.length} transactions, ${chartOfAccounts.length} accounts, ` +
    `client="${safeClient}", ${corrections.length} correction hints`
  )

  if (transactions.length === 0) {
    return NextResponse.json({ error: 'transactions array is empty.' }, { status: 422 })
  }

  if (chartOfAccounts.length === 0) {
    return NextResponse.json({ error: 'chartOfAccounts array is empty.' }, { status: 422 })
  }

  // --- Categorize -----------------------------------------------------------
  try {
    const categorized = await categorizeTransactions(
      transactions as unknown as Transaction[],
      chartOfAccounts as unknown as ChartOfAccounts[],
      corrections as unknown as CorrectionHint[]
    )

    const summary = {
      total: categorized.length,
      approved: categorized.filter((t) => t.status === 'approved').length,
      pending: categorized.filter((t) => t.status === 'pending').length,
      flagged: categorized.filter((t) => t.status === 'flagged').length,
    }

    console.log('Categorization complete:', summary)

    return NextResponse.json({ clientName: safeClient, transactions: categorized, summary }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Categorization threw:', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

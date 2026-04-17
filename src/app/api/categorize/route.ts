import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { categorizeTransactions, type CorrectionHint, type LearnedRuleLine } from '@/lib/categorize'
import type { Transaction, ChartOfAccounts } from '@/types'
import { rateLimit } from '@/lib/rateLimit'
import { sanitizeForPrompt } from '@/lib/promptSanitize'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUserServer } from '@/lib/supabase/qboFirm'
import { normalizeThresholds } from '@/lib/categorization/thresholds'

function getService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const bodySchema = z.object({
  transactions: z.array(z.record(z.string(), z.unknown())),
  chartOfAccounts: z.array(z.record(z.string(), z.unknown())),
  clientName: z.string().min(1).max(500),
  corrections: z.array(z.record(z.string(), z.unknown())).optional(),
  industry: z.string().max(200).optional(),
  accrualOrCash: z.enum(['accrual', 'cash']).optional(),
  fiscalYearEnd: z.string().max(32).optional(),
  jobId: z.string().max(200).optional(),
  thresholds: z
    .object({
      autoApprove: z.number().min(0).max(1).optional(),
      reviewFloor: z.number().min(0).max(1).optional(),
    })
    .optional(),
})

function slugClientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120)
}

async function loadLearnedRules(
  supabase: ReturnType<typeof createClient>,
  firmId: string,
  clientKey: string
): Promise<LearnedRuleLine[]> {
  const { data } = await supabase
    .from('categorization_learning_rules')
    .select('vendor_key, description_pattern, correct_account_code, correct_account_name, hit_count')
    .eq('firm_id', firmId)
    .in('client_key', [clientKey, '_global'])
    .order('hit_count', { ascending: false })
    .limit(80)

  return (data ?? []).map((r) => ({
    vendor_key: r.vendor_key as string,
    description_pattern: r.description_pattern as string | null,
    correct_account_code: r.correct_account_code as string,
    correct_account_name: r.correct_account_name as string,
    hit_count: Number(r.hit_count ?? 1),
  }))
}

async function loadCopilotThresholds(
  supabase: ReturnType<typeof createClient>,
  firmId: string
): Promise<{ autoApprove?: number; reviewFloor?: number }> {
  const { data } = await supabase.from('copilot_config').select('payload').eq('firm_id', firmId).maybeSingle()
  const p = data?.payload as {
    categorizationAutoApprove?: number
    categorizationReviewFloor?: number
  } | null
  if (!p) return {}
  return {
    autoApprove: p.categorizationAutoApprove,
    reviewFloor: p.categorizationReviewFloor,
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  const uid = user?.id ?? request.headers.get('x-forwarded-for') ?? 'anon'
  const rl = rateLimit(`categorize:${uid}`, 20, 1000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration: API key not set.' }, { status: 500 })
  }

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

  const { transactions, chartOfAccounts, clientName, corrections = [], industry, accrualOrCash, fiscalYearEnd, jobId, thresholds: bodyThresholds } =
    parsed.data
  const safeClient = sanitizeForPrompt(clientName, 500)

  if (transactions.length === 0) {
    return NextResponse.json({ error: 'transactions array is empty.' }, { status: 422 })
  }
  if (chartOfAccounts.length === 0) {
    return NextResponse.json({ error: 'chartOfAccounts array is empty.' }, { status: 422 })
  }

  const supabase = getService()
  let learnedRules: LearnedRuleLine[] = []
  let mergedThresholds = bodyThresholds

  if (supabase && user) {
    const firmId = await getFirmIdForUserServer(supabase, user.id)
    if (firmId) {
      const clientKey = slugClientKey(clientName)
      learnedRules = await loadLearnedRules(supabase, firmId, clientKey)
      const fromDb = await loadCopilotThresholds(supabase, firmId)
      mergedThresholds = {
        autoApprove: bodyThresholds?.autoApprove ?? fromDb.autoApprove,
        reviewFloor: bodyThresholds?.reviewFloor ?? fromDb.reviewFloor,
      }
    }
  }

  try {
    const { transactions: categorized, metrics } = await categorizeTransactions(
      transactions as unknown as Transaction[],
      chartOfAccounts as unknown as ChartOfAccounts[],
      {
        client: {
          clientName: safeClient,
          industry: industry ?? 'General',
          accrualOrCash: accrualOrCash ?? 'accrual',
          fiscalYearEnd: fiscalYearEnd ?? '12-31',
        },
        corrections: corrections as unknown as CorrectionHint[],
        learnedRules,
        thresholds: normalizeThresholds(mergedThresholds),
      }
    )

    const summary = {
      total: categorized.length,
      approved: categorized.filter((t) => t.status === 'approved').length,
      pending: categorized.filter((t) => t.status === 'pending').length,
      flagged: categorized.filter((t) => t.status === 'flagged').length,
    }

    if (supabase && user) {
      const firmId = await getFirmIdForUserServer(supabase, user.id)
      if (firmId) {
        await supabase.from('categorization_metrics').insert({
          firm_id: firmId,
          job_id: jobId ?? null,
          client_name: safeClient,
          total_transactions: summary.total,
          auto_approved: summary.approved,
          pending_review: summary.pending,
          flagged: summary.flagged,
          learned_applied: metrics.learnedApplied,
          haiku_batches: metrics.haikuBatches,
          sonnet_batches: metrics.sonnetBatches,
          estimated_cost_usd: metrics.estimatedCostUsd,
          payload: { thresholds: mergedThresholds },
        })
      }
    }

    return NextResponse.json(
      {
        clientName: safeClient,
        transactions: categorized,
        summary,
        metrics,
      },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Categorization threw:', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

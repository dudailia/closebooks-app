import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUserServer } from '@/lib/supabase/qboFirm'

function getService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/** Aggregated categorization accuracy for dashboard. */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getService()
  if (!supabase) {
    return NextResponse.json({ metrics: null, feedback: null })
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json({ metrics: [], feedback: [] })
  }

  const days = Math.min(365, Math.max(7, Number(request.nextUrl.searchParams.get('days') ?? 90)))

  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data: runs } = await supabase
    .from('categorization_metrics')
    .select('total_transactions, auto_approved, pending_review, flagged, learned_applied, estimated_cost_usd, created_at, client_name')
    .eq('firm_id', firmId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500)

  const { data: feedback } = await supabase
    .from('categorization_feedback')
    .select('was_ai_correct, client_key, created_at')
    .eq('firm_id', firmId)
    .gte('created_at', since)

  const total = runs?.reduce((s, r) => s + Number(r.total_transactions ?? 0), 0) ?? 0
  const auto = runs?.reduce((s, r) => s + Number(r.auto_approved ?? 0), 0) ?? 0
  const fb = feedback ?? []
  const correct = fb.filter((f) => f.was_ai_correct).length
  const wrong = fb.length - correct
  const firstTryPct = fb.length > 0 ? Math.round((correct / fb.length) * 1000) / 10 : null

  return NextResponse.json({
    periodDays: days,
    summary: {
      totalTransactionsCategorized: total,
      autoApprovedHighConfidence: auto,
      feedbackSamples: fb.length,
      estimatedFirstTryAccuracyPct: firstTryPct,
      correctionsRecorded: wrong,
    },
    runs: runs ?? [],
    feedbackByDay: aggregateByDay(fb),
  })
}

function aggregateByDay(rows: { was_ai_correct: boolean; created_at: string }[]): { date: string; correct: number; wrong: number }[] {
  const map = new Map<string, { c: number; w: number }>()
  for (const r of rows) {
    const d = r.created_at.slice(0, 10)
    const cur = map.get(d) ?? { c: 0, w: 0 }
    if (r.was_ai_correct) cur.c++
    else cur.w++
    map.set(d, cur)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, correct: v.c, wrong: v.w }))
}

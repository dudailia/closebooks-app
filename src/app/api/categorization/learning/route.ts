import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUserServer } from '@/lib/supabase/qboFirm'

function getService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function slugClientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120)
}

function vendorKeyFromDescription(desc: string): string {
  return desc
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

const bodySchema = z.object({
  clientName: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  fromAccountCode: z.string().max(64).optional(),
  toAccountCode: z.string().min(1).max(64),
  toAccountName: z.string().min(1).max(500),
  transactionId: z.string().max(200).optional(),
  jobId: z.string().max(200).optional(),
})

/** Record a user correction as a learned rule + feedback row. */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json({ error: 'No firm' }, { status: 400 })
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    const j = await request.json()
    const r = bodySchema.safeParse(j)
    if (!r.success) {
      return NextResponse.json({ error: 'Invalid body', issues: r.error.flatten() }, { status: 400 })
    }
    parsed = r.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const clientKey = slugClientKey(parsed.clientName)
  const vendorKey = vendorKeyFromDescription(parsed.description)

  const { data: existing } = await supabase
    .from('categorization_learning_rules')
    .select('id, hit_count')
    .eq('firm_id', firmId)
    .eq('client_key', clientKey)
    .eq('vendor_key', vendorKey)
    .maybeSingle()

  const now = new Date().toISOString()
  if (existing?.id) {
    const { error: upErr } = await supabase
      .from('categorization_learning_rules')
      .update({
        correct_account_code: parsed.toAccountCode,
        correct_account_name: parsed.toAccountName,
        description_pattern: parsed.description.slice(0, 200),
        hit_count: Number(existing.hit_count ?? 1) + 1,
        last_used_at: now,
      })
      .eq('id', existing.id)
    if (upErr) {
      console.error('[learning]', upErr.message)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
  } else {
    const { error: insErr } = await supabase.from('categorization_learning_rules').insert({
      firm_id: firmId,
      client_key: clientKey,
      vendor_key: vendorKey,
      description_pattern: parsed.description.slice(0, 200),
      correct_account_code: parsed.toAccountCode,
      correct_account_name: parsed.toAccountName,
      hit_count: 1,
      last_used_at: now,
    })
    if (insErr) {
      console.error('[learning]', insErr.message)
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }
  }

  const aiWasWrong = Boolean(parsed.fromAccountCode && parsed.fromAccountCode !== parsed.toAccountCode)

  await supabase.from('categorization_feedback').insert({
    firm_id: firmId,
    job_id: parsed.jobId ?? null,
    transaction_id: parsed.transactionId ?? null,
    client_key: clientKey,
    suggested_account_code: parsed.fromAccountCode ?? null,
    final_account_code: parsed.toAccountCode,
    was_ai_correct: !aiWasWrong,
  })

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUserServer } from '@/lib/supabase/qboFirm'
import { suggestMapping } from '@/lib/qboMapping'
import type { ChartOfAccounts } from '@/types'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const putSchema = z.object({
  clientKey: z.string().min(1).max(200),
  clientName: z.string().min(1).max(500),
  mapping: z.record(z.string()),
})

function slugClientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120)
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json({ error: 'No firm' }, { status: 400 })
  }

  const clientKey = request.nextUrl.searchParams.get('clientKey')?.trim()
  if (!clientKey) {
    return NextResponse.json({ error: 'clientKey query required' }, { status: 400 })
  }

  const { data: conn } = await supabase
    .from('qbo_connections')
    .select('realm_id')
    .eq('firm_id', firmId)
    .maybeSingle()

  const { data: settings } = await supabase
    .from('qbo_client_settings')
    .select('qbo_account_mapping, client_name, auto_sync_enabled')
    .eq('firm_id', firmId)
    .eq('client_key', clientKey)
    .maybeSingle()

  const { data: qboRows } = await supabase
    .from('qbo_accounts')
    .select('qbo_id, name, account_type')
    .eq('firm_id', firmId)
    .eq('realm_id', conn?.realm_id ?? '')
    .order('name', { ascending: true })

  const qboAccounts =
    qboRows?.map((r) => ({
      qbo_id: r.qbo_id as string,
      name: r.name as string,
      account_type: (r.account_type as string) ?? '',
    })) ?? []

  const mapping = (settings?.qbo_account_mapping as Record<string, string>) ?? {}

  return NextResponse.json({
    clientName: settings?.client_name ?? clientKey,
    mapping,
    qboAccounts,
    autoSyncClient: Boolean(settings?.auto_sync_enabled),
  })
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json({ error: 'No firm' }, { status: 400 })
  }

  let body: z.infer<typeof putSchema>
  try {
    const j = await request.json()
    const p = putSchema.safeParse(j)
    if (!p.success) {
      return NextResponse.json({ error: 'Invalid body', details: p.error.flatten() }, { status: 400 })
    }
    body = p.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('qbo_client_settings').upsert(
    {
      firm_id: firmId,
      client_key: body.clientKey,
      client_name: body.clientName,
      qbo_account_mapping: body.mapping,
      updated_at: now,
    },
    { onConflict: 'firm_id,client_key' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** POST: auto-suggest mapping from chart of accounts + cached QBO accounts */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json({ error: 'No firm' }, { status: 400 })
  }

  let chart: ChartOfAccounts[]
  let clientKey: string
  let clientName: string
  try {
    const j = (await request.json()) as {
      chartOfAccounts?: ChartOfAccounts[]
      clientName?: string
    }
    if (!j.chartOfAccounts || !Array.isArray(j.chartOfAccounts)) {
      return NextResponse.json({ error: 'chartOfAccounts required' }, { status: 400 })
    }
    chart = j.chartOfAccounts
    clientName = j.clientName?.trim() || 'client'
    clientKey = slugClientKey(clientName)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: conn } = await supabase
    .from('qbo_connections')
    .select('realm_id')
    .eq('firm_id', firmId)
    .maybeSingle()

  const { data: qboRows } = await supabase
    .from('qbo_accounts')
    .select('qbo_id, name')
    .eq('firm_id', firmId)
    .eq('realm_id', conn?.realm_id ?? '')

  const qboAccounts =
    qboRows?.map((r) => ({ qbo_id: r.qbo_id as string, name: r.name as string })) ?? []

  const suggested = suggestMapping(chart, qboAccounts)

  return NextResponse.json({ clientKey, suggested })
}

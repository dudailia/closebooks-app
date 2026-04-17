import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  clearConnectionError,
  getValidAccessTokenForFirm,
  setConnectionError,
  syncAccountsToSupabase,
  syncBankActivityToSupabase,
  syncCustomersToSupabase,
  syncVendorsToSupabase,
} from '@/lib/qboClient'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUserServer } from '@/lib/supabase/qboFirm'
import { isQBOOAuthConfigured } from '@/lib/qboConfig'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const bodySchema = z.object({
  autoSyncEnabled: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  if (!isQBOOAuthConfigured()) {
    return NextResponse.json({ error: 'QuickBooks OAuth is not configured.' }, { status: 503 })
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let autoSyncToggle: boolean | undefined
  try {
    const j = await request.json().catch(() => ({}))
    const p = bodySchema.safeParse(j)
    if (p.success) autoSyncToggle = p.data.autoSyncEnabled
  } catch {
    /* optional body */
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json({ error: 'No firm found for this user.' }, { status: 400 })
  }

  let accessToken: string
  let realmId: string
  try {
    const t = await getValidAccessTokenForFirm(firmId)
    accessToken = t.accessToken
    realmId = t.realmId
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'not_connected') {
      return NextResponse.json({ error: 'QuickBooks is not connected.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Could not refresh QuickBooks session.' }, { status: 502 })
  }

  const runId = crypto.randomUUID()
  const started = new Date().toISOString()
  await supabase.from('qbo_sync_runs').insert({
    id: runId,
    firm_id: firmId,
    realm_id: realmId,
    kind: 'pull',
    started_at: started,
    status: 'running',
  })

  try {
    const nAcc = await syncAccountsToSupabase(firmId, realmId, accessToken)
    const nVen = await syncVendorsToSupabase(firmId, realmId, accessToken)
    const nCust = await syncCustomersToSupabase(firmId, realmId, accessToken)
    let nBank = 0
    try {
      nBank = await syncBankActivityToSupabase(firmId, realmId, accessToken)
    } catch (e) {
      console.warn('[QBO sync] bank activity partial failure', e)
    }

    const finished = new Date().toISOString()
    await supabase
      .from('qbo_sync_runs')
      .update({
        finished_at: finished,
        status: 'success',
        pulled_accounts: nAcc,
        pulled_vendors: nVen,
        pulled_customers: nCust,
        pulled_bank: nBank,
        error_count: 0,
      })
      .eq('id', runId)

    const nextFourHours = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    const updateConn: Record<string, unknown> = {
      last_sync_at: finished,
      updated_at: finished,
      last_error_code: null,
      last_error_message: null,
      last_error_at: null,
    }
    if (autoSyncToggle === true) {
      updateConn.auto_sync_enabled = true
      updateConn.next_sync_at = nextFourHours
    } else if (autoSyncToggle === false) {
      updateConn.auto_sync_enabled = false
      updateConn.next_sync_at = null
    }

    await supabase.from('qbo_connections').update(updateConn).eq('firm_id', firmId)

    await clearConnectionError(firmId)

    return NextResponse.json({
      ok: true,
      pulled: {
        accounts: nAcc,
        vendors: nVen,
        customers: nCust,
        bankTransactions: nBank,
      },
      runId,
      nextSyncAt: autoSyncToggle === true ? nextFourHours : undefined,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed'
    await setConnectionError(firmId, { code: 'sync', message })
    await supabase
      .from('qbo_sync_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'error',
        error_message: message,
        error_count: 1,
      })
      .eq('id', runId)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

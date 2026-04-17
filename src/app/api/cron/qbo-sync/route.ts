import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  clearConnectionError,
  getValidAccessTokenForFirm,
  setConnectionError,
  syncAccountsToSupabase,
  syncBankActivityToSupabase,
  syncCustomersToSupabase,
  syncVendorsToSupabase,
} from '@/lib/qboClient'
import { isQBOOAuthConfigured } from '@/lib/qboConfig'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/**
 * Vercel Cron: GET /api/cron/qbo-sync
 * Header: Authorization: Bearer CRON_SECRET
 * Runs pull sync for firms with auto_sync_enabled and next_sync_at <= now.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isQBOOAuthConfigured()) {
    return NextResponse.json({ skipped: true, reason: 'oauth_not_configured' })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const now = new Date().toISOString()
  const { data: rows, error } = await supabase
    .from('qbo_connections')
    .select('firm_id, realm_id')
    .eq('auto_sync_enabled', true)
    .lte('next_sync_at', now)
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Array<{ firmId: string; ok: boolean; error?: string }> = []

  for (const row of rows ?? []) {
    const firmId = row.firm_id as string
    try {
      const { accessToken, realmId } = await getValidAccessTokenForFirm(firmId)
      await syncAccountsToSupabase(firmId, realmId, accessToken)
      await syncVendorsToSupabase(firmId, realmId, accessToken)
      await syncCustomersToSupabase(firmId, realmId, accessToken)
      try {
        await syncBankActivityToSupabase(firmId, realmId, accessToken)
      } catch {
        /* optional */
      }
      const next = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      await supabase
        .from('qbo_connections')
        .update({
          last_sync_at: new Date().toISOString(),
          next_sync_at: next,
          updated_at: new Date().toISOString(),
        })
        .eq('firm_id', firmId)
      await clearConnectionError(firmId)
      results.push({ firmId, ok: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'sync_failed'
      await setConnectionError(firmId, { code: 'cron_sync', message: msg })
      results.push({ firmId, ok: false, error: msg })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

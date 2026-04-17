import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUserServer } from '@/lib/supabase/qboFirm'
import { isQBOOAuthConfigured } from '@/lib/qboConfig'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export interface QBOStatusResponse {
  connected: boolean
  oauthConfigured: boolean
  companyName?: string
  realmId?: string
  lastSyncAt?: string | null
  totalSynced?: number
  expiresAt?: string | null
  tokenExpiringSoon?: boolean
  lastErrorCode?: string | null
  lastErrorMessage?: string | null
  lastErrorAt?: string | null
  autoSyncEnabled?: boolean
  nextSyncAt?: string | null
}

/**
 * Returns QuickBooks connection for the signed-in user's firm (no tokens exposed).
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({
      connected: false,
      oauthConfigured: isQBOOAuthConfigured(),
    } satisfies QBOStatusResponse)
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json({
      connected: false,
      oauthConfigured: isQBOOAuthConfigured(),
    } satisfies QBOStatusResponse)
  }

  const { data: row, error } = await supabase
    .from('qbo_connections')
    .select(
      'realm_id, company_name, last_sync_at, total_synced, expires_at, last_error_code, last_error_message, last_error_at, auto_sync_enabled, next_sync_at'
    )
    .eq('firm_id', firmId)
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json({
      connected: false,
      oauthConfigured: isQBOOAuthConfigured(),
    } satisfies QBOStatusResponse)
  }

  const expiresAt = row.expires_at ? String(row.expires_at) : null
  const expMs = expiresAt ? new Date(expiresAt).getTime() : 0
  const tokenExpiringSoon = expMs > 0 && Date.now() + 5 * 60 * 1000 >= expMs

  return NextResponse.json({
    connected: true,
    oauthConfigured: isQBOOAuthConfigured(),
    companyName: row.company_name as string,
    realmId: row.realm_id as string,
    lastSyncAt: (row.last_sync_at as string | null) ?? null,
    totalSynced: Number(row.total_synced ?? 0),
    expiresAt,
    tokenExpiringSoon,
    lastErrorCode: (row.last_error_code as string | null) ?? null,
    lastErrorMessage: (row.last_error_message as string | null) ?? null,
    lastErrorAt: (row.last_error_at as string | null) ?? null,
    autoSyncEnabled: Boolean(row.auto_sync_enabled),
    nextSyncAt: (row.next_sync_at as string | null) ?? null,
  } satisfies QBOStatusResponse)
}

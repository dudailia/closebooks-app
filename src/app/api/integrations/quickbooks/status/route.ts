import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export interface QBOStatusResponse {
  connected: boolean
  companyName?: string
  realmId?: string
  lastSyncAt?: string | null
  totalSynced?: number
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
    return NextResponse.json({ connected: false } satisfies QBOStatusResponse)
  }

  const { data: firm } = await supabase
    .from('firms')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!firm?.id) {
    return NextResponse.json({ connected: false } satisfies QBOStatusResponse)
  }

  const { data: row, error } = await supabase
    .from('qbo_connections')
    .select('realm_id, company_name, last_sync_at, total_synced')
    .eq('firm_id', firm.id)
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json({ connected: false } satisfies QBOStatusResponse)
  }

  return NextResponse.json({
    connected: true,
    companyName: row.company_name as string,
    realmId: row.realm_id as string,
    lastSyncAt: (row.last_sync_at as string | null) ?? null,
    totalSynced: Number(row.total_synced ?? 0),
  } satisfies QBOStatusResponse)
}

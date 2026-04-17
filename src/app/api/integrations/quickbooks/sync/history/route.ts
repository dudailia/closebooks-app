import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUserServer } from '@/lib/supabase/qboFirm'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ runs: [] })
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json({ runs: [] })
  }

  const { data, error } = await supabase
    .from('qbo_sync_runs')
    .select(
      'id, kind, started_at, finished_at, status, pulled_accounts, pulled_vendors, pulled_customers, pulled_bank, pushed_journal, error_count, error_message'
    )
    .eq('firm_id', firmId)
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ runs: data ?? [] })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const { data: firm } = await supabase
    .from('firms')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!firm?.id) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase.from('qbo_connections').delete().eq('firm_id', firm.id)
  if (error) {
    console.error('[QBO disconnect]', error.message)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

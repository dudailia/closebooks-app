import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

export const dynamic = 'force-dynamic'

function getServiceSupabase() {
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

  const svc = getServiceSupabase()
  if (!svc) {
    return NextResponse.json({ firmId: null, role: null })
  }

  const { data, error } = await svc
    .from('firm_members')
    .select('firm_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[membership]', error.message)
    return NextResponse.json({ firmId: null, role: null })
  }

  return NextResponse.json({
    firmId: (data?.firm_id as string) ?? null,
    role: (data?.role as string) ?? null,
  })
}

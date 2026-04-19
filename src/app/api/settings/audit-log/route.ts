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
    return NextResponse.json({ rows: [] })
  }

  const { data: member } = await svc
    .from('firm_members')
    .select('firm_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member?.firm_id || !['owner', 'admin'].includes(String(member.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const firmId = member.firm_id as string

  const { data, error } = await svc
    .from('audit_log')
    .select('id, action, resource_type, resource_id, details_json, ip_address, created_at, user_id')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [] })
}

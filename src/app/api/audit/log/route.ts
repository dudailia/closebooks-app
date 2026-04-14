import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { sanitizeOptional } from '@/lib/promptSanitize'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const bodySchema = z.object({
  firm_id: z.string().uuid(),
  action: z.string().min(1).max(200),
  resource_type: z.string().max(120).optional(),
  resource_id: z.string().max(200).optional(),
  details_json: z.record(z.string(), z.any()).optional(),
})

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 })
  }

  const svc = getServiceSupabase()
  if (!svc) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const { data: member } = await svc
    .from('firm_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('firm_id', parsed.data.firm_id)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fwdFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  const ip = fwdFor?.split(',')[0]?.trim() ?? null

  const { error } = await svc.from('audit_log').insert({
    firm_id: parsed.data.firm_id,
    user_id: user.id,
    action: sanitizeOptional(parsed.data.action, 200),
    resource_type: parsed.data.resource_type ? sanitizeOptional(parsed.data.resource_type, 120) : null,
    resource_id: parsed.data.resource_id ? sanitizeOptional(parsed.data.resource_id, 200) : null,
    details_json: parsed.data.details_json ?? null,
    ip_address: ip,
    user_agent: request.headers.get('user-agent'),
  })

  if (error) {
    console.error('[audit/log]', error.message)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

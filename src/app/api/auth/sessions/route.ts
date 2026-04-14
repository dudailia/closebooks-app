import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/** Record or refresh this browser/session row for "Active sessions" UI */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = getServiceSupabase()
  if (!svc) {
    return NextResponse.json({ ok: true })
  }

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string }
  const sessionId = body.sessionId ?? crypto.randomUUID()
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null

  const now = new Date().toISOString()
  const { data: existing } = await svc.from('user_sessions').select('id').eq('id', sessionId).maybeSingle()
  if (existing) {
    await svc
      .from('user_sessions')
      .update({
        last_seen_at: now,
        ip_address: ip,
        user_agent: request.headers.get('user-agent'),
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
  } else {
    await svc.from('user_sessions').insert({
      id: sessionId,
      user_id: user.id,
      last_seen_at: now,
      ip_address: ip,
      user_agent: request.headers.get('user-agent'),
      session_label: 'Browser',
      created_at: now,
    })
  }

  return NextResponse.json({ sessionId })
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = getServiceSupabase()
  if (!svc) {
    return NextResponse.json({ sessions: [] })
  }

  const { data, error } = await svc
    .from('user_sessions')
    .select('id, last_seen_at, ip_address, user_agent, session_label, created_at')
    .eq('user_id', user.id)
    .order('last_seen_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions: data ?? [] })
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = getServiceSupabase()
  if (!svc) {
    return NextResponse.json({ ok: true })
  }

  await svc.from('user_sessions').delete().eq('user_id', user.id)

  return NextResponse.json({
    ok: true,
    notice: 'Session history cleared. Sign out locally or revoke refresh tokens in Supabase Auth for full device invalidation.',
  })
}

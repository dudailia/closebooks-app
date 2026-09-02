import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { listInboxEmails, updateEmailStatus } from '@/lib/inbox/inboxStore'
import type { InboxStatus } from '@/lib/inbox/types'

export const dynamic = 'force-dynamic'

async function getFirmId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.from('firms').select('id').eq('owner_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = await getFirmId(supabase, user.id)
  if (!firmId) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status') as InboxStatus | null
  const clientId = searchParams.get('clientId') ?? undefined
  const limit    = parseInt(searchParams.get('limit') ?? '50', 10)
  const offset   = parseInt(searchParams.get('offset') ?? '0', 10)

  const emails = await listInboxEmails(supabase, firmId, { status: status ?? undefined, clientId, limit, offset })
  return NextResponse.json({ emails })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { id: string; status: InboxStatus }
  if (!body.id || !body.status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })

  await updateEmailStatus(supabase, body.id, body.status)
  return NextResponse.json({ ok: true })
}

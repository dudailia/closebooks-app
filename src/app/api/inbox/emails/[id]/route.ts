import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getInboxEmailById, updateEmailStatus } from '@/lib/inbox/inboxStore'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = await getInboxEmailById(supabase, params.id)
  if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mark as read
  if (email.status === 'unread') {
    await updateEmailStatus(supabase, params.id, 'read')
    email.status = 'read'
  }

  return NextResponse.json({ email })
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('inbox_emails').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}

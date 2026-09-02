import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { assignEmailToClient } from '@/lib/inbox/inboxStore'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { emailId: string; clientId: string; clientName: string }
  if (!body.emailId || !body.clientId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  await assignEmailToClient(supabase, body.emailId, body.clientId, body.clientName)
  return NextResponse.json({ ok: true })
}

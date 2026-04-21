import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { updateEmailStatus } from '@/lib/inbox/inboxStore'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { emailIds: string[] }
  if (!Array.isArray(body.emailIds) || body.emailIds.length === 0) {
    return NextResponse.json({ error: 'emailIds must be a non-empty array' }, { status: 400 })
  }

  await Promise.all(body.emailIds.map(id => updateEmailStatus(supabase, id, 'archived')))
  return NextResponse.json({ ok: true, archived: body.emailIds.length })
}

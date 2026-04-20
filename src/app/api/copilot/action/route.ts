import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, createRouteHandlerClient } from '@/lib/supabase/routeAuth'
import { executeAction } from '@/lib/copilot/actions'
import type { ActionCardType, ActionCardPayload } from '@/lib/copilot/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createRouteHandlerClient(request)
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  let body: { type: ActionCardType; clientId: string; payload: ActionCardPayload }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, clientId, payload } = body
  if (!type || !clientId || !payload) {
    return NextResponse.json({ error: 'type, clientId, and payload required' }, { status: 400 })
  }

  try {
    await executeAction(type, payload, clientId, supabase)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Action failed' }, { status: 500 })
  }
}

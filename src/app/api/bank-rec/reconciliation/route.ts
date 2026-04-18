import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createReconciliation,
  getReconciliations,
  getReconciliation,
  updateReconciliation,
  addRecItem,
  deleteRecItem,
} from '@/lib/bank-rec/storage'
import type { Reconciliation, ReconciliationItem } from '@/lib/bank-rec/types'

export async function GET(request: NextRequest) {
  const sb = createClient()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const clientId = searchParams.get('clientId')

  if (id) {
    const rec = await getReconciliation(id)
    return rec
      ? NextResponse.json({ reconciliation: rec })
      : NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!clientId) return NextResponse.json({ error: 'Missing clientId or id' }, { status: 422 })
  return NextResponse.json({ reconciliations: await getReconciliations(clientId) })
}

export async function POST(request: NextRequest) {
  const sb = createClient()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    action: 'create' | 'add_item' | 'delete_item' | 'complete' | 'update_balances'
    clientId?: string
    statementId?: string
    period?: string
    bankBalance?: number
    bookBalance?: number
    reconciliationId?: string
    type?: ReconciliationItem['type']
    description?: string
    amount?: number
    itemId?: string
    completedBy?: string
  }

  if (body.action === 'create') {
    const { clientId, statementId, period, bankBalance = 0, bookBalance = 0 } = body
    if (!clientId || !statementId || !period) {
      return NextResponse.json({ error: 'Missing clientId, statementId, or period' }, { status: 422 })
    }
    const rec = await createReconciliation(user.id, clientId, statementId, period, bankBalance, bookBalance)
    return NextResponse.json({ reconciliation: rec })
  }

  if (body.action === 'add_item') {
    const { reconciliationId, type, description, amount } = body
    if (!reconciliationId || !type || !description || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields for add_item' }, { status: 422 })
    }
    const item = await addRecItem(reconciliationId, type, description, amount)
    return NextResponse.json({ item })
  }

  if (body.action === 'delete_item') {
    if (!body.itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 422 })
    await deleteRecItem(body.itemId)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'complete') {
    const { reconciliationId, completedBy } = body
    if (!reconciliationId) return NextResponse.json({ error: 'Missing reconciliationId' }, { status: 422 })
    await updateReconciliation(reconciliationId, {
      status: 'completed',
      completed_by: completedBy ?? user.email ?? 'CPA',
      completed_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'update_balances') {
    const { reconciliationId, bankBalance = 0, bookBalance = 0 } = body
    if (!reconciliationId) return NextResponse.json({ error: 'Missing reconciliationId' }, { status: 422 })
    await updateReconciliation(reconciliationId, {
      bank_balance: bankBalance,
      book_balance: bookBalance,
      difference: bankBalance - bookBalance,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 422 })
}

export async function PUT(request: NextRequest) {
  const sb = createClient()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json() as {
    id: string
    bank_balance?: number
    book_balance?: number
    difference?: number
    status?: Reconciliation['status']
    completed_by?: string
    completed_at?: string
  }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 422 })
  await updateReconciliation(id, updates)
  return NextResponse.json({ ok: true })
}

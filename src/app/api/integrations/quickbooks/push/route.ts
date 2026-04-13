import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Transaction } from '@/types'
import {
  createJournalEntry,
  getValidAccessTokenForFirm,
  resolveDefaultAccountRefs,
  updateSyncStats,
} from '@/lib/qboClient'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface PushBody {
  transactions: Transaction[]
}

function isPushBody(body: unknown): body is PushBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return Array.isArray(b.transactions)
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isPushBody(body)) {
    return NextResponse.json({ error: 'Expected { transactions: [...] }' }, { status: 422 })
  }

  const txs = body.transactions.filter(
    (t) => t.status === 'approved' || t.status === 'edited'
  )
  if (txs.length === 0) {
    return NextResponse.json({ error: 'No approved transactions to push.' }, { status: 422 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const { data: firm } = await supabase
    .from('firms')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!firm?.id) {
    return NextResponse.json(
      { error: 'Create a firm profile (sign up with Supabase) before connecting QuickBooks.' },
      { status: 400 }
    )
  }

  let accessToken: string
  let realmId: string
  try {
    const t = await getValidAccessTokenForFirm(firm.id as string)
    accessToken = t.accessToken
    realmId = t.realmId
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'qbo_error'
    if (msg === 'not_connected') {
      return NextResponse.json({ error: 'QuickBooks is not connected.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Could not refresh QuickBooks session.' }, { status: 502 })
  }

  const accounts = await resolveDefaultAccountRefs(realmId, accessToken)
  if (!accounts) {
    return NextResponse.json(
      {
        error:
          'Could not find default Bank and Expense accounts in QuickBooks. Add at least one Bank and one Expense account.',
      },
      { status: 422 }
    )
  }

  const lines: Array<{
    amount: number
    description: string
    debitAccountId: string
    creditAccountId: string
  }> = []

  for (const tx of txs) {
    const amt = Math.abs(tx.amount)
    if (amt < 0.01) continue
    const desc = `${tx.date} — ${tx.description}`.slice(0, 400)
    if (tx.type === 'debit') {
      lines.push({
        amount: amt,
        description: desc,
        debitAccountId: accounts.expense.value,
        creditAccountId: accounts.bank.value,
      })
    } else {
      lines.push({
        amount: amt,
        description: desc,
        debitAccountId: accounts.bank.value,
        creditAccountId: accounts.expense.value,
      })
    }
  }

  const result = await createJournalEntry(realmId, accessToken, lines)
  const pushed = result.success

  if (pushed > 0) {
    await updateSyncStats(firm.id as string, pushed)
  }

  return NextResponse.json({
    ok: true,
    pushed,
    failed: result.failed,
    message:
      pushed > 0
        ? `Posted ${pushed} journal entries to QuickBooks.`
        : 'No entries were posted. Check QuickBooks account setup.',
  })
}

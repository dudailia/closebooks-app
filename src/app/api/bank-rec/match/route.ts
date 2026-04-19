import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAutoMatch } from '@/lib/bank-rec/matching'
import { updateLineMatch, getStatement } from '@/lib/bank-rec/storage'
import type { BookTransaction } from '@/lib/bank-rec/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const sb = createClient()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    statementId: string
    bookTransactions?: BookTransaction[]
    action?: 'auto' | 'manual' | 'unmatch'
    bankLineId?: string
    bookTransactionIds?: string[]
    confidence?: number
  }

  if (!body.statementId) return NextResponse.json({ error: 'Missing statementId' }, { status: 422 })

  // Manual match
  if (body.action === 'manual' && body.bankLineId && body.bookTransactionIds?.length) {
    await updateLineMatch(body.bankLineId, body.bookTransactionIds[0], body.confidence ?? 100, 'matched')
    return NextResponse.json({ ok: true })
  }

  // Unmatch
  if (body.action === 'unmatch' && body.bankLineId) {
    await updateLineMatch(body.bankLineId, null, null, 'unmatched')
    return NextResponse.json({ ok: true })
  }

  // Auto-match
  const statement = await getStatement(body.statementId)
  if (!statement?.lines) return NextResponse.json({ error: 'Statement not found' }, { status: 404 })

  const result = runAutoMatch({
    statementLines: statement.lines,
    bookTransactions: body.bookTransactions ?? [],
  })

  // Persist all matches
  await Promise.all(
    result.matches.map(m =>
      updateLineMatch(m.bankLineId, m.bookTransactionIds[0], m.confidence, 'matched')
    )
  )

  return NextResponse.json(result)
}

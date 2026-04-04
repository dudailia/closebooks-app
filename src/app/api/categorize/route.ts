import { NextRequest, NextResponse } from 'next/server'
import { categorizeTransactions } from '@/lib/categorize'
import type { CorrectionHint } from '@/lib/categorize'
import type { Transaction, ChartOfAccounts } from '@/types'

interface RequestBody {
  transactions: Transaction[]
  chartOfAccounts: ChartOfAccounts[]
  clientName: string
  corrections?: CorrectionHint[]
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    Array.isArray(b.transactions) &&
    Array.isArray(b.chartOfAccounts) &&
    typeof b.clientName === 'string' &&
    b.clientName.trim().length > 0
  )
}

export async function POST(request: NextRequest) {
  console.log('=== API route /api/categorize HIT ===')
  console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY)

  // Guard here, inside the handler, not at module level
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is missing from environment')
    return NextResponse.json({ error: 'Server misconfiguration: API key not set.' }, { status: 500 })
  }

  // --- Parse body -----------------------------------------------------------
  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    console.error('Failed to parse request JSON:', err)
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  if (!isValidBody(body)) {
    console.error('Invalid request body shape:', JSON.stringify(body).slice(0, 200))
    return NextResponse.json(
      { error: 'Request body must include transactions (array), chartOfAccounts (array), and clientName (string).' },
      { status: 422 }
    )
  }

  const { transactions, chartOfAccounts, clientName, corrections = [] } = body

  console.log(
    `Received: ${transactions.length} transactions, ${chartOfAccounts.length} accounts, ` +
    `client="${clientName}", ${corrections.length} correction hints`
  )

  if (transactions.length === 0) {
    return NextResponse.json({ error: 'transactions array is empty.' }, { status: 422 })
  }

  if (chartOfAccounts.length === 0) {
    return NextResponse.json({ error: 'chartOfAccounts array is empty.' }, { status: 422 })
  }

  // --- Categorize -----------------------------------------------------------
  try {
    const categorized = await categorizeTransactions(transactions, chartOfAccounts, corrections)

    const summary = {
      total: categorized.length,
      approved: categorized.filter((t) => t.status === 'approved').length,
      pending: categorized.filter((t) => t.status === 'pending').length,
      flagged: categorized.filter((t) => t.status === 'flagged').length,
    }

    console.log('Categorization complete:', summary)

    return NextResponse.json({ clientName, transactions: categorized, summary }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Categorization threw:', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

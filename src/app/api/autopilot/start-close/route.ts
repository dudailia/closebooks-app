import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Transaction } from '@/types'
import { generateJournalEntries } from '@/lib/autopilot/journalEntries'
import { detectExceptions } from '@/lib/autopilot/exceptionDetector'
import { calculatePnL } from '@/lib/autopilot/pnlCalculator'

const anthropic = new Anthropic()

const JOURNAL_ENTRY_PROMPT = (transactions: Transaction[]) =>
  `You are a CPA generating journal entries.
For these transactions, generate double-entry journal entries.
Return a JSON array only — no explanation, no markdown fences.
Each element: { date, description, debitAccount, creditAccount, amount, reasoning }
Transactions: ${JSON.stringify(transactions.slice(0, 50))}`

async function categorizeBatch(transactions: Transaction[]): Promise<Transaction[]> {
  if (transactions.length === 0) return []

  const uncategorized = transactions.filter(tx => !tx.final_category && tx.confidence < 0.72)
  if (uncategorized.length === 0) return transactions

  try {
    const prompt = `You are a bookkeeping AI. Categorize each transaction.
Return a JSON array only — no markdown, no explanation.
Each element: { id, category, confidence }
Possible categories: Revenue, Cost of Goods Sold, Meals & Entertainment, Software & Subscriptions,
Payroll, Rent, Insurance, Travel, Office Supplies, Marketing & Advertising, Utilities, Professional Services,
Bank Fees, Taxes & Licenses, Equipment, General Expense.

Transactions: ${JSON.stringify(uncategorized.map(tx => ({
  id: tx.id,
  description: tx.description ?? tx.original_description,
  amount: tx.amount,
  type: tx.type,
})))}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
    const cleaned = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim()
    const results: Array<{ id: string; category: string; confidence: number }> = JSON.parse(cleaned)

    const lookup = new Map(results.map(r => [r.id, r]))
    return transactions.map(tx => {
      const result = lookup.get(tx.id)
      if (result) {
        return { ...tx, final_category: result.category, confidence: result.confidence }
      }
      return tx
    })
  } catch {
    return transactions
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      clientId: string
      periodStart: string
      periodEnd: string
      transactions: Transaction[]
    }

    const { clientId, periodStart, periodEnd, transactions } = body

    if (!clientId || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const period = `${periodStart} – ${periodEnd}`
    const startTime = Date.now()

    // Step 1: Categorize uncategorized transactions
    const categorized = await categorizeBatch(transactions)

    // Step 2: Generate journal entries via AI (batches of 50)
    let aiJournalEntries: Array<{
      date: string
      description: string
      debitAccount: string
      creditAccount: string
      amount: number
      reasoning: string
    }> = []

    const batches: Transaction[][] = []
    for (let i = 0; i < categorized.length; i += 50) {
      batches.push(categorized.slice(i, i + 50))
    }

    for (const batch of batches) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: JOURNAL_ENTRY_PROMPT(batch) }],
        })
        const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
        const cleaned = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim()
        const entries = JSON.parse(cleaned)
        if (Array.isArray(entries)) {
          aiJournalEntries = aiJournalEntries.concat(entries)
        }
      } catch {
        // Fall back to rule-based for this batch
        const fallback = generateJournalEntries(batch)
        aiJournalEntries = aiJournalEntries.concat(
          fallback.map(je => ({
            date: je.date,
            description: je.description,
            debitAccount: je.debitAccount,
            creditAccount: je.creditAccount,
            amount: je.amount,
            reasoning: je.aiReasoning,
          }))
        )
      }
    }

    // If AI returned fewer entries than transactions, fill with rule-based
    if (aiJournalEntries.length < categorized.length) {
      const fallback = generateJournalEntries(categorized)
      aiJournalEntries = fallback.map(je => ({
        date: je.date,
        description: je.description,
        debitAccount: je.debitAccount,
        creditAccount: je.creditAccount,
        amount: je.amount,
        reasoning: je.aiReasoning,
      }))
    }

    // Step 3: Detect exceptions
    const exceptions = detectExceptions(categorized)

    // Step 4: Calculate P&L
    const pnl = calculatePnL(categorized, period)

    // Step 5: Build stats
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000)
    const autoCategorized = categorized.filter(tx => tx.confidence >= 0.72).length
    const pctCategorized = categorized.length > 0
      ? ((autoCategorized / categorized.length) * 100).toFixed(1)
      : '0.0'

    const runId = `run_${clientId}_${Date.now()}`

    return NextResponse.json({
      runId,
      status: 'complete',
      journalEntries: aiJournalEntries,
      exceptions,
      pnl,
      stats: {
        totalTransactions: categorized.length,
        autoCategorized,
        pctCategorized: parseFloat(pctCategorized),
        journalEntriesCount: aiJournalEntries.length,
        exceptionsCount: exceptions.length,
        elapsedSeconds,
      },
    })
  } catch (err) {
    console.error('[start-close] error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}

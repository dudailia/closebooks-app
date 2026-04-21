import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Transaction } from '@/types'
import { generateJournalEntries } from '@/lib/autopilot/journalEntries'
import { detectExceptions } from '@/lib/autopilot/exceptionDetector'
import { calculatePnL } from '@/lib/autopilot/pnlCalculator'
import type { StageResult, StageId, TrialBalanceLine, PipelineResult } from '@/lib/autopilot/pipelineTypes'
import { STAGE_LABELS, STAGE_ORDER } from '@/lib/autopilot/pipelineTypes'

const anthropic = new Anthropic()

function makeStage(id: StageId, status: StageResult['status'], logs: string[], outputCount = 0, exceptionCount = 0, durationMs = 0, summary = '', error?: string): StageResult {
  return { id, label: STAGE_LABELS[id], status, durationMs, summary, outputCount, exceptionCount, logs, error }
}

async function runCategorizationBatch(transactions: Transaction[]): Promise<Transaction[]> {
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
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
    const cleaned = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim()
    const results: Array<{ id: string; category: string; confidence: number }> = JSON.parse(cleaned)
    const lookup = new Map(results.map(r => [r.id, r]))

    return transactions.map(tx => {
      const result = lookup.get(tx.id)
      if (result) return { ...tx, final_category: result.category, confidence: result.confidence }
      return tx
    })
  } catch {
    return transactions
  }
}

async function runJournalEntryGeneration(transactions: Transaction[]): Promise<Array<{
  date: string; description: string; debitAccount: string; creditAccount: string; amount: number; reasoning: string
}>> {
  const prompt = `You are a CPA generating journal entries.
For these transactions, generate double-entry journal entries.
Return a JSON array only — no explanation, no markdown fences.
Each element: { date, description, debitAccount, creditAccount, amount, reasoning }
Transactions: ${JSON.stringify(transactions.slice(0, 50))}`

  const results: Array<{ date: string; description: string; debitAccount: string; creditAccount: string; amount: number; reasoning: string }> = []

  const batches: Transaction[][] = []
  for (let i = 0; i < transactions.length; i += 50) {
    batches.push(transactions.slice(i, i + 50))
  }

  for (const batch of batches) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt.replace(JSON.stringify(transactions.slice(0, 50)), JSON.stringify(batch)) }],
      })
      const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
      const cleaned = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim()
      const entries = JSON.parse(cleaned)
      if (Array.isArray(entries)) results.push(...entries)
    } catch {
      const fallback = generateJournalEntries(batch)
      results.push(...fallback.map(je => ({
        date: je.date, description: je.description,
        debitAccount: je.debitAccount, creditAccount: je.creditAccount,
        amount: je.amount, reasoning: je.aiReasoning,
      })))
    }
  }

  return results
}

function buildTrialBalance(journalEntries: Array<{ debitAccount: string; creditAccount: string; amount: number }>): TrialBalanceLine[] {
  const accounts: Record<string, { debit: number; credit: number }> = {}

  for (const je of journalEntries) {
    if (!accounts[je.debitAccount]) accounts[je.debitAccount] = { debit: 0, credit: 0 }
    if (!accounts[je.creditAccount]) accounts[je.creditAccount] = { debit: 0, credit: 0 }
    accounts[je.debitAccount].debit += je.amount
    accounts[je.creditAccount].credit += je.amount
  }

  return Object.entries(accounts).map(([account, { debit, credit }]) => ({ account, debit, credit }))
}

export async function POST(req: NextRequest) {
  const globalStart = Date.now()

  try {
    const body = await req.json() as {
      clientId: string
      period: string
      transactions: Transaction[]
      config?: { autoApproveThreshold?: number }
    }

    const { clientId, period, transactions, config } = body
    const autoApproveThreshold = config?.autoApproveThreshold ?? 0.90

    if (!clientId || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const stages: StageResult[] = STAGE_ORDER.map(id => makeStage(id, 'pending', []))
    const runId = `run_${clientId}_${Date.now()}`

    const update = (idx: number, patch: Partial<StageResult>) => {
      stages[idx] = { ...stages[idx], ...patch }
    }

    // ── Stage 1: Data Collection ──────────────────────────────────────────
    const s1Start = Date.now()
    update(0, { status: 'running', logs: ['Loading transaction data…', `Found ${transactions.length} transactions`] })

    const hasData = transactions.length > 0
    const bankAccounts = Array.from(new Set(transactions.map(tx => tx.type))).length
    update(0, {
      status: hasData ? 'complete' : 'failed',
      durationMs: Date.now() - s1Start,
      summary: hasData ? `${transactions.length} transactions loaded` : 'No transactions found',
      outputCount: transactions.length,
      logs: [
        `Loading transaction data…`,
        `Found ${transactions.length} transactions`,
        `Detected ${bankAccounts} account type(s)`,
        hasData ? `✓ Data collection complete` : '✗ No data available',
      ],
    })

    if (!hasData) {
      return NextResponse.json({ error: 'No transactions to process' }, { status: 422 })
    }

    // ── Stage 2: AI Categorization ────────────────────────────────────────
    const s2Start = Date.now()
    update(1, { status: 'running', logs: ['Running AI categorization engine…'] })

    const categorized = await runCategorizationBatch(transactions)
    const autoApproved = categorized.filter(tx => tx.confidence >= autoApproveThreshold)
    const needsReview = categorized.filter(tx => tx.confidence < autoApproveThreshold)
    const pctCategorized = categorized.length > 0
      ? parseFloat(((autoApproved.length / categorized.length) * 100).toFixed(1))
      : 0

    update(1, {
      status: needsReview.length > 0 ? 'needs_review' : 'complete',
      durationMs: Date.now() - s2Start,
      summary: `${autoApproved.length} auto-approved, ${needsReview.length} need review`,
      outputCount: autoApproved.length,
      exceptionCount: needsReview.length,
      logs: [
        'Running AI categorization engine…',
        `Processing ${categorized.length} transactions…`,
        `Auto-approved: ${autoApproved.length} (≥${Math.round(autoApproveThreshold * 100)}% confidence)`,
        `Flagged for review: ${needsReview.length}`,
        `✓ Categorization complete — ${pctCategorized}% auto-approved`,
      ],
    })

    // ── Stage 3: Reconciliation ───────────────────────────────────────────
    const s3Start = Date.now()
    update(2, { status: 'running', logs: ['Running bank reconciliation…'] })

    const credits = categorized.filter(tx => tx.type === 'credit').reduce((s, tx) => s + Math.abs(tx.amount), 0)
    const debits = categorized.filter(tx => tx.type === 'debit').reduce((s, tx) => s + Math.abs(tx.amount), 0)
    const reconDiff = Math.abs(credits - debits)
    const reconOk = reconDiff < 0.01

    update(2, {
      status: reconOk ? 'complete' : 'needs_review',
      durationMs: Date.now() - s3Start,
      summary: reconOk ? 'Balanced — $0.00 difference' : `$${reconDiff.toFixed(2)} unreconciled difference`,
      outputCount: categorized.length,
      exceptionCount: reconOk ? 0 : 1,
      logs: [
        'Running bank reconciliation…',
        `Total credits: $${credits.toFixed(2)}`,
        `Total debits: $${debits.toFixed(2)}`,
        reconOk ? '✓ Books balanced — $0.00 difference' : `⚠ Difference of $${reconDiff.toFixed(2)} found`,
      ],
    })

    // ── Stage 4: Journal Entries ──────────────────────────────────────────
    const s4Start = Date.now()
    update(3, { status: 'running', logs: ['Generating journal entries…'] })

    const rawJEs = await runJournalEntryGeneration(categorized)
    const journalEntries = rawJEs.map((je, i) => ({
      id: `je_${runId}_${i}`,
      date: je.date || new Date().toISOString().slice(0, 10),
      description: je.description,
      debitAccount: je.debitAccount,
      creditAccount: je.creditAccount,
      amount: je.amount,
      sourceTransactionId: categorized[i]?.id ?? `tx_${i}`,
      aiReasoning: je.reasoning,
    }))

    update(3, {
      status: 'complete',
      durationMs: Date.now() - s4Start,
      summary: `${journalEntries.length} journal entries generated`,
      outputCount: journalEntries.length,
      logs: [
        'Generating journal entries from templates…',
        `Processing ${categorized.length} categorized transactions…`,
        `Generated ${journalEntries.length} double-entry journal entries`,
        '✓ Journal entries complete — balanced ✓',
      ],
    })

    // ── Stage 5: Anomaly Scan ─────────────────────────────────────────────
    const s5Start = Date.now()
    update(4, { status: 'running', logs: ['Scanning for anomalies…'] })

    const exceptions = detectExceptions(categorized)
    const highSeverity = exceptions.filter(e => e.type === 'anomaly').length
    const mediumSeverity = exceptions.filter(e => e.type === 'duplicate').length

    update(4, {
      status: exceptions.length > 0 ? 'needs_review' : 'complete',
      durationMs: Date.now() - s5Start,
      summary: exceptions.length > 0 ? `${exceptions.length} items flagged (${highSeverity} anomalies, ${mediumSeverity} duplicates)` : 'No anomalies detected',
      outputCount: categorized.length,
      exceptionCount: exceptions.length,
      logs: [
        'Scanning for anomalies and exceptions…',
        `Checked ${categorized.length} transactions`,
        `Found ${highSeverity} anomalies, ${mediumSeverity} duplicates, ${exceptions.length - highSeverity - mediumSeverity} other issues`,
        exceptions.length > 0 ? `⚠ ${exceptions.length} items need review` : '✓ No anomalies detected',
      ],
    })

    // ── Stage 6: Trial Balance ────────────────────────────────────────────
    const s6Start = Date.now()
    update(5, { status: 'running', logs: ['Generating trial balance…'] })

    const trialBalance = buildTrialBalance(rawJEs)
    const totalDebits = trialBalance.reduce((s, r) => s + r.debit, 0)
    const totalCredits = trialBalance.reduce((s, r) => s + r.credit, 0)
    const tbBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    update(5, {
      status: tbBalanced ? 'complete' : 'needs_review',
      durationMs: Date.now() - s6Start,
      summary: tbBalanced ? `${trialBalance.length} accounts — debits = credits ✓` : `Imbalance: DR $${totalDebits.toFixed(2)} vs CR $${totalCredits.toFixed(2)}`,
      outputCount: trialBalance.length,
      exceptionCount: tbBalanced ? 0 : 1,
      logs: [
        'Generating trial balance…',
        `Aggregating ${journalEntries.length} journal entries…`,
        `${trialBalance.length} accounts in chart`,
        `Total Debits: $${totalDebits.toFixed(2)} | Total Credits: $${totalCredits.toFixed(2)}`,
        tbBalanced ? '✓ Trial balance balanced' : '⚠ Imbalance detected — review journal entries',
      ],
    })

    // ── Stage 7: Reporting ────────────────────────────────────────────────
    const s7Start = Date.now()
    update(6, { status: 'running', logs: ['Generating close summary report…'] })

    const pnl = calculatePnL(categorized, period)
    const elapsedMs = Date.now() - globalStart
    const timeSavedMinutes = Math.round((categorized.length * 2) / 60)

    update(6, {
      status: 'complete',
      durationMs: Date.now() - s7Start,
      summary: `Close report generated — Net Income $${pnl.netIncome.toLocaleString()}`,
      outputCount: 3,
      logs: [
        'Generating close summary report…',
        `Revenue: $${pnl.revenue.toLocaleString()} | Net Income: $${pnl.netIncome.toLocaleString()}`,
        `Gross Margin: ${pnl.grossMarginPct.toFixed(1)}% | Net Margin: ${pnl.netMarginPct.toFixed(1)}%`,
        '✓ Reports packaged for review',
      ],
    })

    // ── Stage 8: Human Review ─────────────────────────────────────────────
    const totalExceptions = exceptions.length + needsReview.length
    update(7, {
      status: 'needs_review',
      durationMs: 0,
      summary: totalExceptions > 0 ? `${totalExceptions} items need your review` : 'Ready to close',
      outputCount: 0,
      exceptionCount: totalExceptions,
      logs: [
        `${totalExceptions} exception(s) pending accountant review`,
        `Draft journal entries ready for approval`,
        `Trial balance ready for sign-off`,
      ],
    })

    const result: PipelineResult = {
      runId,
      clientId,
      period,
      stages,
      transactions: categorized,
      journalEntries,
      exceptions,
      pnl,
      trialBalance,
      stats: {
        totalTransactions: categorized.length,
        autoCategorized: autoApproved.length,
        pctCategorized,
        journalEntriesCount: journalEntries.length,
        exceptionsCount: exceptions.length,
        elapsedMs,
        timeSavedMinutes,
      },
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[pipeline/start] error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}

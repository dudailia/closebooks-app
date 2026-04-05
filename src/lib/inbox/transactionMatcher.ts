// ─────────────────────────────────────────────────────────────────────────────
// Transaction matcher — matches a parsed document against known transactions
// ─────────────────────────────────────────────────────────────────────────────

import type { Transaction } from '@/types'

export interface MatchResult {
  transactionId: string
  confidence: number
  matchMethod: 'exact' | 'fuzzy_amount' | 'card_digits' | 'none'
  reasoning: string
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / msPerDay
}

function sameWeek(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  // ISO week: get Monday of each week
  const monday = (d: Date) => {
    const copy = new Date(d)
    const day = copy.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    copy.setDate(copy.getDate() + diff)
    copy.setHours(0, 0, 0, 0)
    return copy.getTime()
  }
  return monday(da) === monday(db)
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export function matchDocumentToTransaction(
  parsed: { amount: number; date: string; merchant?: string },
  transactions: Transaction[]
): MatchResult[] {
  const results: MatchResult[] = []

  for (const tx of transactions) {
    const txAmount = Math.abs(tx.amount)
    const parsedAmount = Math.abs(parsed.amount)
    const amountDiff = Math.abs(txAmount - parsedAmount)
    const days = daysBetween(tx.date, parsed.date)

    // ── Exact: amount within $0.01 AND date within 3 days ────────────────────
    if (amountDiff <= 0.01 && days <= 3) {
      results.push({
        transactionId: tx.id,
        confidence: 0.97,
        matchMethod: 'exact',
        reasoning: `Amount matches exactly ($${parsedAmount.toFixed(2)}) and dates are within ${Math.round(days)} day(s).`,
      })
      continue
    }

    // ── Fuzzy amount: within $5 AND same week ─────────────────────────────────
    if (amountDiff <= 5 && sameWeek(tx.date, parsed.date)) {
      results.push({
        transactionId: tx.id,
        confidence: 0.80,
        matchMethod: 'fuzzy_amount',
        reasoning: `Amount close (diff $${amountDiff.toFixed(2)}) and both fall in the same calendar week.`,
      })
      continue
    }

    // ── Amount only: within $0.01 AND within 30 days ──────────────────────────
    if (amountDiff <= 0.01 && days <= 30) {
      results.push({
        transactionId: tx.id,
        confidence: 0.60,
        matchMethod: 'fuzzy_amount',
        reasoning: `Amount matches exactly but date is ${Math.round(days)} day(s) apart (within 30-day window).`,
      })
    }
  }

  // Sort by confidence descending, return top 3 (plus a "none" sentinel if empty)
  const sorted = results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)

  if (sorted.length === 0) {
    sorted.push({
      transactionId: '',
      confidence: 0,
      matchMethod: 'none',
      reasoning: 'No match found — no transaction with a similar amount or date.',
    })
  }

  return sorted
}

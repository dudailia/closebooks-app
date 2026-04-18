import type { BankStatementLine, BookTransaction, MatchedPair, MatchRequest, MatchResponse } from './types'

function calDiff(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000)
}

function bizDiff(a: string, b: string): number {
  return Math.round(calDiff(a, b) * 5 / 7)
}

function tryMatch(
  line: BankStatementLine,
  available: BookTransaction[],
  used: Set<string>,
): MatchedPair | null {
  const pool = available.filter(t => !used.has(t.id))

  // 1. EXACT: same amount + type + ref# + date ±1d
  for (const t of pool) {
    if (
      Math.abs(line.amount - t.amount) < 0.001 &&
      line.type === t.type &&
      calDiff(line.date, t.date) <= 1 &&
      line.reference_number && t.reference_number &&
      line.reference_number === t.reference_number
    ) {
      return { bankLineId: line.id, bookTransactionIds: [t.id], confidence: 100, matchType: 'exact' }
    }
  }

  // 2. AMOUNT: same amount + type + date ±3 biz days
  const amt = pool.filter(t =>
    Math.abs(line.amount - t.amount) < 0.001 &&
    line.type === t.type &&
    bizDiff(line.date, t.date) <= 3
  )
  if (amt.length === 1) {
    const conf = 94 - bizDiff(line.date, amt[0].date) * 3
    return { bankLineId: line.id, bookTransactionIds: [amt[0].id], confidence: Math.max(85, conf), matchType: 'amount' }
  }
  if (amt.length > 1) {
    amt.sort((a, b) => calDiff(line.date, a.date) - calDiff(line.date, b.date))
    const conf = Math.max(70, 89 - bizDiff(line.date, amt[0].date) * 5)
    return { bankLineId: line.id, bookTransactionIds: [amt[0].id], confidence: conf, matchType: 'amount' }
  }

  // 3. FUZZY: ±$0.01 + date ±5d
  const fuzzy = pool.filter(t =>
    Math.abs(line.amount - t.amount) <= 0.01 &&
    line.type === t.type &&
    calDiff(line.date, t.date) <= 5
  )
  if (fuzzy.length > 0) {
    fuzzy.sort((a, b) => calDiff(line.date, a.date) - calDiff(line.date, b.date))
    return { bankLineId: line.id, bookTransactionIds: [fuzzy[0].id], confidence: 72, matchType: 'fuzzy' }
  }

  // 4. COMPOUND: sum of 2–3 entries = bank amount, dates within ±3 days
  const nearby = pool.filter(t =>
    line.type === t.type &&
    calDiff(line.date, t.date) <= 3 &&
    t.amount < line.amount
  )
  // Pairs
  for (let i = 0; i < nearby.length - 1; i++) {
    for (let j = i + 1; j < nearby.length; j++) {
      if (Math.abs(nearby[i].amount + nearby[j].amount - line.amount) < 0.01) {
        return { bankLineId: line.id, bookTransactionIds: [nearby[i].id, nearby[j].id], confidence: 82, matchType: 'compound' }
      }
    }
  }
  // Triples (cap at 10 to avoid O(n³) blowup)
  const top10 = nearby.slice(0, 10)
  for (let i = 0; i < top10.length - 2; i++) {
    for (let j = i + 1; j < top10.length - 1; j++) {
      for (let k = j + 1; k < top10.length; k++) {
        if (Math.abs(top10[i].amount + top10[j].amount + top10[k].amount - line.amount) < 0.01) {
          return { bankLineId: line.id, bookTransactionIds: [top10[i].id, top10[j].id, top10[k].id], confidence: 75, matchType: 'compound' }
        }
      }
    }
  }

  return null
}

export function runAutoMatch(req: MatchRequest): MatchResponse {
  const used = new Set<string>()
  const matches: MatchedPair[] = []
  const unmatchedBankLineIds: string[] = []

  for (const line of req.statementLines.filter(l => l.status === 'unmatched')) {
    const m = tryMatch(line, req.bookTransactions, used)
    if (m) {
      matches.push(m)
      m.bookTransactionIds.forEach(id => used.add(id))
    } else {
      unmatchedBankLineIds.push(line.id)
    }
  }

  const matchedBook = new Set(matches.flatMap(m => m.bookTransactionIds))
  return {
    matches,
    unmatchedBankLineIds,
    unmatchedBookTransactionIds: req.bookTransactions.filter(t => !matchedBook.has(t.id)).map(t => t.id),
  }
}

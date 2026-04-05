import type { Transaction } from '@/types'

export type ExceptionType = 'uncategorized' | 'duplicate' | 'anomaly' | 'missing_receipt'

export interface CloseException {
  id: string
  transactionId: string
  type: ExceptionType
  description: string
  amount: number
  aiSuggestion: string
  confidence: number
}

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 86400000
  return Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime()) / msPerDay
}

function vendorKey(tx: Transaction): string {
  const raw = tx.description ?? tx.original_description ?? ''
  // Strip trailing numbers/IDs to normalize vendor name
  return raw.replace(/\s*#?\d+\s*$/, '').trim().toLowerCase()
}

export function detectExceptions(transactions: Transaction[]): CloseException[] {
  const exceptions: CloseException[] = []
  const seen = new Set<string>()

  // Build vendor average map for anomaly detection
  const vendorAmounts: Record<string, number[]> = {}
  for (const tx of transactions) {
    if (tx.type !== 'debit') continue
    const key = vendorKey(tx)
    if (!vendorAmounts[key]) vendorAmounts[key] = []
    vendorAmounts[key].push(Math.abs(tx.amount))
  }
  const vendorAvg: Record<string, number> = {}
  for (const [key, amounts] of Object.entries(vendorAmounts)) {
    vendorAvg[key] = amounts.reduce((a, b) => a + b, 0) / amounts.length
  }

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i]
    if (seen.has(tx.id)) continue

    // 1. Low confidence → uncategorized
    if (tx.confidence < 0.72) {
      exceptions.push({
        id: `exc_uncategorized_${tx.id}`,
        transactionId: tx.id,
        type: 'uncategorized',
        description: tx.description ?? tx.original_description,
        amount: Math.abs(tx.amount),
        aiSuggestion: tx.suggested_category || 'General Expense',
        confidence: tx.confidence,
      })
      continue
    }

    // 2. Duplicate detection: same amount ±$0.01, same vendor, within 5 days
    if (tx.type === 'debit') {
      const key = vendorKey(tx)
      for (let j = i + 1; j < transactions.length; j++) {
        const other = transactions[j]
        if (seen.has(other.id)) continue
        if (other.type !== 'debit') continue
        if (vendorKey(other) !== key) continue
        if (Math.abs(Math.abs(tx.amount) - Math.abs(other.amount)) > 0.01) continue
        if (daysBetween(tx.date, other.date) > 5) continue

        // Mark both as duplicates — flag the later one
        seen.add(other.id)
        exceptions.push({
          id: `exc_duplicate_${other.id}`,
          transactionId: other.id,
          type: 'duplicate',
          description: other.description ?? other.original_description,
          amount: Math.abs(other.amount),
          aiSuggestion: 'Possible duplicate — verify with vendor statement',
          confidence: 0.85,
        })
      }
    }

    // 3. Anomaly: amount > 3x vendor historical average
    if (tx.type === 'debit') {
      const key = vendorKey(tx)
      const avg = vendorAvg[key]
      if (avg && Math.abs(tx.amount) > avg * 3 && transactions.filter(t => vendorKey(t) === key).length > 1) {
        exceptions.push({
          id: `exc_anomaly_${tx.id}`,
          transactionId: tx.id,
          type: 'anomaly',
          description: tx.description ?? tx.original_description,
          amount: Math.abs(tx.amount),
          aiSuggestion: `Unusually high for this vendor (avg $${avg.toFixed(2)}) — verify amount`,
          confidence: 0.78,
        })
        continue
      }
    }

    // 4. Missing receipt: debit > $500, no category match for receipts
    const receiptCategories = ['meals', 'travel', 'entertainment', 'supplies', 'equipment', 'software']
    const catLower = (tx.final_category ?? tx.suggested_category ?? '').toLowerCase()
    const needsReceipt = receiptCategories.some(c => catLower.includes(c))
    if (
      tx.type === 'debit' &&
      Math.abs(tx.amount) > 500 &&
      needsReceipt &&
      tx.confidence >= 0.72
    ) {
      exceptions.push({
        id: `exc_receipt_${tx.id}`,
        transactionId: tx.id,
        type: 'missing_receipt',
        description: tx.description ?? tx.original_description,
        amount: Math.abs(tx.amount),
        aiSuggestion: 'Receipt required for expenses over $500 — attach documentation',
        confidence: 0.9,
      })
    }
  }

  return exceptions
}

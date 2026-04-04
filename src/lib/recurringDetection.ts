import type { Transaction } from '@/types'

export interface RecurringPattern {
  /** Display name derived from the most recent transaction description */
  vendor: string
  transactionIds: string[]
  count: number
  avgAmount: number
  minAmount: number
  maxAmount: number
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'irregular'
  lastDate: string
  /** ISO date of projected next occurrence, or null if interval is unknown */
  nextExpectedDate: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip trailing IDs / reference numbers so "GUSTO 0291" and "GUSTO 0292"
 *  map to the same bucket. */
function normalizeVendor(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/#?\b\d{3,}\b/g, '')   // strip long digit runs (IDs, ref numbers)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m]
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function detectRecurring(transactions: Transaction[]): RecurringPattern[] {
  // 1. Group by normalised vendor key
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const key = normalizeVendor(tx.description)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  const patterns: RecurringPattern[] = []

  for (const txs of groups.values()) {
    if (txs.length < 2) continue

    // 2. Sort chronologically
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date))
    const amounts = sorted.map((t) => t.amount)
    const minAmt = Math.min(...amounts)
    const maxAmt = Math.max(...amounts)
    const avgAmt = amounts.reduce((s, a) => s + a, 0) / amounts.length

    // 3. Amount must be within 15% variance (generous for payroll that varies slightly)
    if (minAmt === 0 || maxAmt / minAmt > 1.15) continue

    // 4. Compute day gaps between consecutive occurrences
    const gaps: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      const a = new Date(sorted[i - 1].date).getTime()
      const b = new Date(sorted[i].date).getTime()
      gaps.push(Math.round((b - a) / 86_400_000))
    }

    const med = median(gaps)
    let frequency: RecurringPattern['frequency'] = 'irregular'
    let intervalDays = 0

    if      (med >= 5  && med <= 9)  { frequency = 'weekly';    intervalDays = 7  }
    else if (med >= 12 && med <= 16) { frequency = 'bi-weekly'; intervalDays = 14 }
    else if (med >= 27 && med <= 35) { frequency = 'monthly';   intervalDays = 30 }
    else if (txs.length >= 3) {
      // Irregular but consistently repeating — still worth flagging
      frequency    = 'irregular'
      intervalDays = Math.round(med)
    }

    // Skip irregular pairs (need ≥3 to be confident without a known interval)
    if (frequency === 'irregular' && txs.length < 3) continue

    const lastDate         = sorted[sorted.length - 1].date
    const nextExpectedDate = intervalDays > 0 ? addDays(lastDate, intervalDays) : null

    // Use the most recent description, cleaned up, as the display vendor name
    const vendor = sorted[sorted.length - 1].description
      .replace(/#?\b\d{4,}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()

    patterns.push({
      vendor,
      transactionIds: sorted.map((t) => t.id),
      count: sorted.length,
      avgAmount: avgAmt,
      minAmount: minAmt,
      maxAmount: maxAmt,
      frequency,
      lastDate,
      nextExpectedDate,
    })
  }

  // Sort by recurrence count desc, then avg amount desc
  return patterns.sort((a, b) => b.count - a.count || b.avgAmount - a.avgAmount)
}

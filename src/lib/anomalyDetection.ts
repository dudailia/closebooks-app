import type { Transaction } from '@/types'

export type AnomalySeverity = 'high' | 'medium' | 'low'

export interface Anomaly {
  type:
    | 'amount_spike'
    | 'amount_drop'
    | 'missing_recurring'
    | 'new_large_vendor'
    | 'possible_duplicate'
  severity: AnomalySeverity
  title: string
  detail: string
  transactionIds: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/#?\b\d{3,}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

function avgAmount(txs: Transaction[]): number {
  if (txs.length === 0) return 0
  return txs.reduce((s, t) => s + t.amount, 0) / txs.length
}

function groupByVendor(txs: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const key = normalize(tx.description)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }
  return map
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function detectAnomalies(
  current: Transaction[],
  previous: Transaction[] | null,
): Anomaly[] {
  const anomalies: Anomaly[] = []

  // ── 1. Possible duplicates within current job ─────────────────────────────
  //    Same vendor key + same amount within 5 days
  const byVendorCurrent = groupByVendor(current)
  for (const txs of Array.from(byVendorCurrent.values())) {
    if (txs.length < 2) continue
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date))
    const dupes: string[] = []
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const dayDiff =
        Math.abs(new Date(curr.date).getTime() - new Date(prev.date).getTime()) /
        86_400_000
      if (curr.amount === prev.amount && dayDiff <= 5) {
        if (!dupes.includes(prev.id)) dupes.push(prev.id)
        dupes.push(curr.id)
      }
    }
    if (dupes.length >= 2) {
      const tx = sorted[sorted.length - 1]
      const vendor = tx.description
        .replace(/#?\b\d{4,}\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase()
      anomalies.push({
        type: 'possible_duplicate',
        severity: 'high',
        title: 'Possible duplicate charge',
        detail: `${vendor} — ${dupes.length} transactions for $${sorted[0].amount.toFixed(2)} within 5 days`,
        transactionIds: [...new Set(dupes)],
      })
    }
  }

  // ── 2. New large vendor (no history in previous period, amount > $500) ──────
  if (previous && previous.length > 0) {
    const prevKeys = new Set(Array.from(groupByVendor(previous).keys()))
    for (const [key, txs] of Array.from(byVendorCurrent.entries())) {
      if (prevKeys.has(key)) continue
      const large = txs.filter((t) => t.amount > 500)
      if (large.length === 0) continue
      const total = large.reduce((s, t) => s + t.amount, 0)
      const vendor = large[0].description
        .replace(/#?\b\d{4,}\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase()
      anomalies.push({
        type: 'new_large_vendor',
        severity: 'medium',
        title: 'New large vendor',
        detail: `${vendor} — $${total.toFixed(2)} total, not seen in prior period`,
        transactionIds: large.map((t) => t.id),
      })
    }
  }

  if (!previous || previous.length === 0) return sortedAnomalies(anomalies)

  // ── 3. Amount spikes / drops vs prior period ──────────────────────────────
  const byVendorPrev = groupByVendor(previous)
  for (const [key, currTxs] of Array.from(byVendorCurrent.entries())) {
    const prevTxs = byVendorPrev.get(key)
    if (!prevTxs || prevTxs.length === 0) continue

    const currAvg = avgAmount(currTxs)
    const prevAvg = avgAmount(prevTxs)
    if (prevAvg === 0) continue

    const ratio = currAvg / prevAvg
    const diffAmt = currAvg - prevAvg

    if (ratio > 1.2 && diffAmt > 50) {
      const vendor = currTxs[0].description
        .replace(/#?\b\d{4,}\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase()
      anomalies.push({
        type: 'amount_spike',
        severity: ratio > 1.5 ? 'high' : 'medium',
        title: 'Amount spike vs prior period',
        detail: `${vendor} — avg $${currAvg.toFixed(0)} this period vs $${prevAvg.toFixed(0)} last period (+${Math.round((ratio - 1) * 100)}%)`,
        transactionIds: currTxs.map((t) => t.id),
      })
    } else if (ratio < 0.8 && Math.abs(diffAmt) > 50) {
      const vendor = currTxs[0].description
        .replace(/#?\b\d{4,}\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase()
      anomalies.push({
        type: 'amount_drop',
        severity: 'low',
        title: 'Unusual amount drop',
        detail: `${vendor} — avg $${currAvg.toFixed(0)} this period vs $${prevAvg.toFixed(0)} last period (−${Math.round((1 - ratio) * 100)}%)`,
        transactionIds: currTxs.map((t) => t.id),
      })
    }
  }

  // ── 4. Missing recurring vendors from prior period ────────────────────────
  for (const [key, prevTxs] of Array.from(byVendorPrev.entries())) {
    if (prevTxs.length < 2) continue           // must have been recurring
    if (byVendorCurrent.has(key)) continue     // still present this period

    const prevAvg = avgAmount(prevTxs)
    if (prevAvg < 100) continue                // only care about meaningful amounts

    const vendor = prevTxs[prevTxs.length - 1].description
      .replace(/#?\b\d{4,}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
    anomalies.push({
      type: 'missing_recurring',
      severity: prevAvg > 500 ? 'high' : 'medium',
      title: 'Expected recurring not found',
      detail: `${vendor} — appeared ${prevTxs.length}× last period (avg $${prevAvg.toFixed(0)}) but is absent this period`,
      transactionIds: [],
    })
  }

  return sortedAnomalies(anomalies)
}

const SEVERITY_ORDER: Record<AnomalySeverity, number> = { high: 0, medium: 1, low: 2 }

function sortedAnomalies(anomalies: Anomaly[]): Anomaly[] {
  return anomalies.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

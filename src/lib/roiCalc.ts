import type { CategorizationJob } from '@/types'

// Industry baseline: ~3 min to manually categorise + reconcile one transaction
const MANUAL_MINUTES_PER_TX = 3
// Auto-approved: AI handled it, human just scans → ~15 sec of eyes-on time
const AI_MINUTES_AUTO = 0.25
// Pending / flagged: AI surfaced & organised it, human decides → ~1.5 min
const AI_MINUTES_MANUAL = 1.5

export const DEFAULT_RATE = 150  // $/hr — configurable via firmSettings

export interface ROIResult {
  hoursSaved: number
  valueSaved: number
  autoApproved: number
  manualReviewed: number
  totalTx: number
  ratePerHour: number
}

export function calcROI(job: CategorizationJob, ratePerHour = DEFAULT_RATE): ROIResult {
  const autoApproved = job.auto_categorized ?? 0
  const manualReviewed = job.total_transactions - autoApproved

  const minutesSaved =
    autoApproved   * (MANUAL_MINUTES_PER_TX - AI_MINUTES_AUTO) +
    manualReviewed * (MANUAL_MINUTES_PER_TX - AI_MINUTES_MANUAL)

  const hoursSaved = Math.max(0, minutesSaved / 60)
  const valueSaved = Math.max(0, Math.round(hoursSaved * ratePerHour))

  return {
    hoursSaved:    Math.round(hoursSaved * 10) / 10,
    valueSaved,
    autoApproved,
    manualReviewed,
    totalTx:       job.total_transactions,
    ratePerHour,
  }
}

export function calcCumulativeROI(
  jobs: CategorizationJob[],
  ratePerHour = DEFAULT_RATE
): { hoursSaved: number; valueSaved: number; totalTx: number; autoApproved: number } {
  return jobs.reduce(
    (acc, j) => {
      const r = calcROI(j, ratePerHour)
      return {
        hoursSaved:   acc.hoursSaved   + r.hoursSaved,
        valueSaved:   acc.valueSaved   + r.valueSaved,
        totalTx:      acc.totalTx      + r.totalTx,
        autoApproved: acc.autoApproved + r.autoApproved,
      }
    },
    { hoursSaved: 0, valueSaved: 0, totalTx: 0, autoApproved: 0 }
  )
}

export function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`
  return `${h.toFixed(1)} hr${h !== 1.0 ? 's' : ''}`
}

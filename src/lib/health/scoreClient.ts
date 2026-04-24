import type { CategorizationJob } from '@/types'
import type { Anomaly } from '@/lib/anomalyDetection'

export interface HealthInputs {
  jobs: CategorizationJob[]
  anomalies: Anomaly[]
  documents: { requested: number; uploaded: number; reviewed: number }
  reconciliation: { matched: number; unmatched: number } | null
  today?: Date
}

export interface HealthBreakdown {
  score: number
  bucket: 'excellent' | 'good' | 'attention' | 'critical'
  signals: {
    onTime: { points: number; max: 30; note: string }
    anomalies: { points: number; max: 20; note: string }
    docs: { points: number; max: 20; note: string }
    recon: { points: number; max: 30; note: string }
  }
  topReasons: string[]
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
}

export function scoreClient(inputs: HealthInputs): HealthBreakdown {
  const today = inputs.today ?? new Date()

  // ── On-time (30 pts) ──────────────────────────────────────────────────
  const completed = inputs.jobs
    .filter((j) => j.status === 'completed')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const lastCompleted = completed[0]
  let onTimePoints = 0
  let onTimeNote = 'No completed close yet'
  if (lastCompleted) {
    const closedAt = new Date(lastCompleted.created_at)
    const eom = endOfMonth(closedAt)
    const daysLate = Math.max(0, daysBetween(closedAt, eom))
    if (daysLate <= 10) {
      onTimePoints = 30
      onTimeNote = 'Closed on time'
    } else if (daysLate >= 30) {
      onTimePoints = 0
      onTimeNote = `Last close was ${daysLate} days late`
    } else {
      onTimePoints = Math.round(30 * (1 - (daysLate - 10) / 20))
      onTimeNote = `Last close was ${daysLate} days late`
    }
  }

  // ── Anomalies (20 pts) ────────────────────────────────────────────────
  const aCount = inputs.anomalies.length
  const anomaliesPoints = Math.max(0, 20 - 2 * aCount)
  const anomaliesNote =
    aCount === 0
      ? 'No open anomalies'
      : `${aCount} outstanding anomal${aCount === 1 ? 'y' : 'ies'}`

  // ── Docs (20 pts) ─────────────────────────────────────────────────────
  const { requested, uploaded, reviewed } = inputs.documents
  let docsPoints: number
  let docsNote: string
  if (requested === 0) {
    docsPoints = 20
    docsNote = 'No pending document requests'
  } else {
    docsPoints = Math.round(20 * Math.min(1, (uploaded + reviewed) / requested))
    const missing = requested - uploaded - reviewed
    docsNote =
      missing <= 0
        ? 'All requested docs received'
        : `${missing} document${missing === 1 ? '' : 's'} still requested`
  }

  // ── Reconciliation (30 pts) ───────────────────────────────────────────
  let reconPoints: number
  let reconNote: string
  if (!inputs.reconciliation) {
    reconPoints = 15
    reconNote = 'No recon data yet'
  } else {
    const { matched, unmatched } = inputs.reconciliation
    const total = matched + unmatched
    reconPoints = total === 0 ? 15 : Math.round(30 * (matched / total))
    reconNote =
      unmatched === 0
        ? 'Fully reconciled'
        : `${unmatched} unmatched transaction${unmatched === 1 ? '' : 's'}`
  }

  const score = onTimePoints + anomaliesPoints + docsPoints + reconPoints
  const bucket: HealthBreakdown['bucket'] =
    score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'attention' : 'critical'

  const signals = {
    onTime: { points: onTimePoints, max: 30 as const, note: onTimeNote },
    anomalies: { points: anomaliesPoints, max: 20 as const, note: anomaliesNote },
    docs: { points: docsPoints, max: 20 as const, note: docsNote },
    recon: { points: reconPoints, max: 30 as const, note: reconNote },
  }

  const gaps = [
    { label: 'on-time', gap: 30 - onTimePoints, note: onTimeNote },
    { label: 'anomalies', gap: 20 - anomaliesPoints, note: anomaliesNote },
    { label: 'docs', gap: requested === 0 ? 0 : 20 - docsPoints, note: docsNote },
    {
      label: 'recon',
      gap: !inputs.reconciliation ? 0 : 30 - reconPoints,
      note: reconNote,
    },
  ]
  const topReasons = gaps
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2)
    .map((g) => g.note)

  return { score, bucket, signals, topReasons }
}

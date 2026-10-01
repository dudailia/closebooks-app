// What the strict errors among auto-approved rows are: bookkeeping policy
// alternates (the predicted account is listed as acceptable in
// eval/data/vendors.csv, e.g. a client payment to 4100 revenue instead of 1100
// AR) or real mistakes. Works from saved predictions; no API calls.

import { autoApprovedAt, REVIEW_LABEL, type Prediction, type TruthRow } from './metrics'

export interface StrictErrorGroup {
  trueCode: string
  predictedCode: string
  count: number
  /** The predicted account is an accepted policy alternate for these rows. */
  policy: boolean
  examples: string[]
}

export interface StrictErrorBreakdown {
  threshold: number
  autoApproved: number
  strictWrong: number
  policyAlternates: number
  realMistakes: number
  groups: StrictErrorGroup[]
}

export function strictErrorBreakdown(preds: Prediction[], rows: TruthRow[], threshold: number): StrictErrorBreakdown {
  const byId = new Map(rows.map((r) => [r.id, r]))
  const auto = preds.filter((p) => {
    const r = byId.get(p.id)
    return r && r.trueCode && r.trueCode !== REVIEW_LABEL && autoApprovedAt(p, threshold)
  })
  const groups = new Map<string, StrictErrorGroup>()
  for (const p of auto) {
    const r = byId.get(p.id)!
    if (p.predictedCode === r.trueCode) continue
    const key = `${r.trueCode}>${p.predictedCode}`
    const g = groups.get(key) ?? {
      trueCode: r.trueCode!, predictedCode: p.predictedCode, count: 0,
      policy: r.acceptable.includes(p.predictedCode), examples: [],
    }
    g.count++
    if (g.examples.length < 3 && !g.examples.includes(r.description)) g.examples.push(r.description)
    groups.set(key, g)
  }
  const list = [...groups.values()].sort((a, b) => b.count - a.count || a.trueCode.localeCompare(b.trueCode))
  const strictWrong = list.reduce((s, g) => s + g.count, 0)
  const policyAlternates = list.filter((g) => g.policy).reduce((s, g) => s + g.count, 0)
  return { threshold, autoApproved: auto.length, strictWrong, policyAlternates, realMistakes: strictWrong - policyAlternates, groups: list }
}

export interface ErrorGroupAllConfidence {
  trueCode: string
  predictedCode: string
  count: number
  policy: boolean
  minConfidence: number
  maxConfidence: number
}

/** Every strict error, whatever its confidence, grouped by correct and booked account. */
export function allStrictErrors(preds: Prediction[], rows: TruthRow[]): ErrorGroupAllConfidence[] {
  const byId = new Map(rows.map((r) => [r.id, r]))
  const groups = new Map<string, ErrorGroupAllConfidence>()
  for (const p of preds) {
    const r = byId.get(p.id)
    if (!r || !r.trueCode || r.trueCode === REVIEW_LABEL || p.noPrediction || p.predictedCode === r.trueCode) continue
    const key = `${r.trueCode}>${p.predictedCode}`
    const g = groups.get(key) ?? { trueCode: r.trueCode, predictedCode: p.predictedCode, count: 0, policy: r.acceptable.includes(p.predictedCode), minConfidence: 1, maxConfidence: 0 }
    g.count++
    g.minConfidence = Math.min(g.minConfidence, p.confidence)
    g.maxConfidence = Math.max(g.maxConfidence, p.confidence)
    groups.set(key, g)
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.trueCode.localeCompare(b.trueCode))
}

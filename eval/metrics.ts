// Pure scoring functions for the categorisation eval. No I/O, no API calls.
// Unit tests: eval/__tests__/metrics.test.ts.

export type Status = 'approved' | 'pending' | 'flagged'

/**
 * Hand label for a row whose right account can't be known from the bank line
 * (e.g. a Venmo payment to a person). Correct if and only if the app did NOT
 * auto-approve it. Never counted in account accuracy.
 */
export const REVIEW_LABEL = 'REVIEW'

/** One row of eval/data/synthetic_transactions.csv. */
export interface TruthRow {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  /** Empty = not labelled yet (excluded from scoring). REVIEW = must go to a human. */
  trueCode: string
  /** Other defensible answers (policy-dependent labels). */
  acceptable: string[]
  labelSource: 'vendor_table' | 'hand'
}

/** What the engine returned for one row in one run. */
export interface Prediction {
  run: number
  id: string
  predictedCode: string
  confidence: number
  /** The app's own decision: approved = auto-approved; pending/flagged = sent to review. */
  status: Status
  validationFlags: string[]
  /** The model named an account that isn't in the chart. */
  unknownToChart: boolean
  /** The batch failed or the model skipped this row. */
  noPrediction: boolean
  batchIndex: number
  /** Batch wall-clock time divided by batch size. */
  latencyMs: number
}

/** One Anthropic API attempt (mirrors CategorizeCall in src/lib/categorize.ts). */
export interface CallUsage {
  run: number
  batchIndex: number
  attempt: number
  model: string
  latencyMs: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  error?: string
}

export interface BatchTiming {
  run: number
  batchIndex: number
  size: number
  wallMs: number
  ok: boolean
}

export interface ScoredRow extends Prediction {
  trueCode: string
  acceptable: string[]
  strict: boolean
  lenient: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ratio = (num: number, den: number): number | null => (den === 0 ? null : num / den)

/** Nearest-rank percentile (p in 0–100). Null for an empty list. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length))
  return sorted[rank - 1]
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Join predictions to account labels. Rows with no label yet, and REVIEW rows,
 * are left out: see `excludedCount` and `reviewLabelled`.
 */
export function scoreRows(predictions: Prediction[], truth: TruthRow[]): ScoredRow[] {
  const byId = new Map(truth.map((t) => [t.id, t]))
  const out: ScoredRow[] = []
  for (const p of predictions) {
    const t = byId.get(p.id)
    if (!t) throw new Error(`prediction for unknown row ${p.id}`)
    if (!t.trueCode || t.trueCode === REVIEW_LABEL) continue
    const strict = p.predictedCode !== '' && p.predictedCode === t.trueCode
    const lenient = strict || (p.predictedCode !== '' && t.acceptable.includes(p.predictedCode))
    out.push({ ...p, trueCode: t.trueCode, acceptable: t.acceptable, strict, lenient })
  }
  return out
}

/** How many of the selected rows have no true label yet. */
export function excludedCount(ids: string[], truth: TruthRow[]): number {
  const byId = new Map(truth.map((t) => [t.id, t]))
  return ids.filter((id) => !byId.get(id)?.trueCode).length
}

export interface Accuracy {
  n: number
  strictCorrect: number
  lenientCorrect: number
  strict: number | null
  lenient: number | null
}

export function accuracy(rows: ScoredRow[]): Accuracy {
  const strictCorrect = rows.filter((r) => r.strict).length
  const lenientCorrect = rows.filter((r) => r.lenient).length
  return { n: rows.length, strictCorrect, lenientCorrect, strict: ratio(strictCorrect, rows.length), lenient: ratio(lenientCorrect, rows.length) }
}

export interface AccountRow extends Accuracy {
  code: string
  name: string
  /** How many predictions named this account. */
  predictedCount: number
  /** Of those, how many were right (strict). */
  precision: number | null
}

/** Per true account, plus precision for the same code used as a prediction. */
export function perAccount(rows: ScoredRow[], names: Map<string, string>): AccountRow[] {
  const codes = new Set(rows.map((r) => r.trueCode))
  for (const r of rows) if (r.predictedCode) codes.add(r.predictedCode)
  return [...codes].sort().map((code) => {
    const truthRows = rows.filter((r) => r.trueCode === code)
    const predicted = rows.filter((r) => r.predictedCode === code)
    return {
      code,
      name: names.get(code) ?? '(not in chart)',
      ...accuracy(truthRows),
      predictedCount: predicted.length,
      precision: ratio(predicted.filter((r) => r.strict).length, predicted.length),
    }
  })
}

// ─── Auto-approve vs review ───────────────────────────────────────────────────

export interface ReviewSplit {
  n: number
  approved: number
  pending: number
  flagged: number
  /** Share sent to a human (pending + flagged). */
  reviewRate: number | null
  /** Share with status 'flagged' only. */
  flagRate: number | null
  unknownToChart: number
  noPrediction: number
  autoApproved: Accuracy
  sentToReview: Accuracy
  /** The key number: how often an auto-approved row is wrong. */
  autoApprovedErrorRate: { strict: number | null; lenient: number | null }
}

export function reviewSplit(rows: ScoredRow[]): ReviewSplit {
  const approved = rows.filter((r) => r.status === 'approved')
  const review = rows.filter((r) => r.status !== 'approved')
  const auto = accuracy(approved)
  return {
    n: rows.length,
    approved: approved.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    flagged: rows.filter((r) => r.status === 'flagged').length,
    reviewRate: ratio(review.length, rows.length),
    flagRate: ratio(rows.filter((r) => r.status === 'flagged').length, rows.length),
    unknownToChart: rows.filter((r) => r.unknownToChart).length,
    noPrediction: rows.filter((r) => r.noPrediction).length,
    autoApproved: auto,
    sentToReview: accuracy(review),
    autoApprovedErrorRate: {
      strict: auto.strict === null ? null : 1 - auto.strict,
      lenient: auto.lenient === null ? null : 1 - auto.lenient,
    },
  }
}

// ─── Calibration ──────────────────────────────────────────────────────────────

export interface CalibrationBucket {
  lower: number
  upper: number
  n: number
  meanConfidence: number | null
  accuracy: number | null
}

export interface Calibration {
  basis: 'strict' | 'lenient'
  buckets: CalibrationBucket[]
  /** Expected calibration error: Σ (n_b / N) · |accuracy_b − meanConfidence_b|. */
  ece: number | null
}

/** Ten equal-width confidence buckets; 1.0 falls in the last one. */
export function calibration(rows: ScoredRow[], basis: 'strict' | 'lenient'): Calibration {
  const buckets: CalibrationBucket[] = Array.from({ length: 10 }, (_, i) => ({
    lower: i / 10, upper: (i + 1) / 10, n: 0, meanConfidence: null, accuracy: null,
  }))
  const groups: ScoredRow[][] = buckets.map(() => [])
  for (const r of rows) groups[Math.min(9, Math.max(0, Math.floor(r.confidence * 10)))].push(r)
  let ece = 0
  groups.forEach((g, i) => {
    if (g.length === 0) return
    const conf = g.reduce((s, r) => s + r.confidence, 0) / g.length
    const acc = g.filter((r) => r[basis]).length / g.length
    buckets[i] = { ...buckets[i], n: g.length, meanConfidence: conf, accuracy: acc }
    ece += (g.length / rows.length) * Math.abs(acc - conf)
  })
  return { basis, buckets, ece: rows.length ? ece : null }
}

// ─── Stability across runs ────────────────────────────────────────────────────

export interface Stability {
  runs: number
  /** Rows seen in at least two runs. */
  rowsCompared: number
  /** Rows given more than one different account across runs. */
  rowsChanged: number
  changeRate: number | null
  /** Mean over rows of (max − min) confidence across runs. */
  meanConfidenceSpread: number | null
  /** Rows whose auto-approve decision differed across runs. */
  rowsDecisionChanged: number
}

export function stability(predictions: Prediction[]): Stability {
  const runs = new Set(predictions.map((p) => p.run)).size
  const byRow = new Map<string, Prediction[]>()
  for (const p of predictions) byRow.set(p.id, [...(byRow.get(p.id) ?? []), p])
  const multi = [...byRow.values()].filter((ps) => ps.length >= 2)
  const changed = multi.filter((ps) => new Set(ps.map((p) => p.predictedCode)).size > 1).length
  const decision = multi.filter((ps) => new Set(ps.map((p) => p.status === 'approved')).size > 1).length
  const spreads = multi.map((ps) => Math.max(...ps.map((p) => p.confidence)) - Math.min(...ps.map((p) => p.confidence)))
  return {
    runs,
    rowsCompared: multi.length,
    rowsChanged: changed,
    changeRate: ratio(changed, multi.length),
    meanConfidenceSpread: spreads.length ? spreads.reduce((a, b) => a + b, 0) / spreads.length : null,
    rowsDecisionChanged: decision,
  }
}

// ─── Latency ──────────────────────────────────────────────────────────────────

export interface Latency {
  batches: number
  perBatchMs: { median: number | null; p90: number | null }
  perTransactionMs: { median: number | null; p90: number | null }
  perCallMs: { median: number | null; p90: number | null }
}

export function latency(batches: BatchTiming[], calls: CallUsage[]): Latency {
  const perBatch = batches.map((b) => b.wallMs)
  const perTx = batches.flatMap((b) => Array.from({ length: b.size }, () => b.wallMs / b.size))
  const perCall = calls.map((c) => c.latencyMs)
  return {
    batches: batches.length,
    perBatchMs: { median: percentile(perBatch, 50), p90: percentile(perBatch, 90) },
    perTransactionMs: { median: percentile(perTx, 50), p90: percentile(perTx, 90) },
    perCallMs: { median: percentile(perCall, 50), p90: percentile(perCall, 90) },
  }
}

// ─── Cost ─────────────────────────────────────────────────────────────────────

export interface ModelPrice {
  name?: string
  input: number | null
  output: number | null
  cache_write_5m: number | null
  cache_write_1h?: number | null
  cache_read: number | null
}

export interface Pricing {
  source_url: string | null
  date_checked: string | null
  models: Record<string, ModelPrice>
}

export interface TokenTotals {
  calls: number
  failedCalls: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export interface Cost {
  tokens: TokenTotals
  /** Null when any needed price is missing; `reason` says why. */
  totalUsd: number | null
  perTransactionUsd: number | null
  perStatementUsd: number | null
  statementSize: number
  reason?: string
}

export function tokenTotals(calls: CallUsage[]): TokenTotals {
  return {
    calls: calls.length,
    failedCalls: calls.filter((c) => c.error).length,
    inputTokens: calls.reduce((s, c) => s + c.inputTokens, 0),
    outputTokens: calls.reduce((s, c) => s + c.outputTokens, 0),
    cacheReadTokens: calls.reduce((s, c) => s + c.cacheReadTokens, 0),
    cacheWriteTokens: calls.reduce((s, c) => s + c.cacheWriteTokens, 0),
  }
}

/**
 * Cost from real token usage. Every call is billed, including failed attempts
 * and retries. `transactions` = rows categorised × runs. A "statement" is
 * `statementSize` transactions (one month of the dataset). Never estimates a
 * missing price.
 */
export function cost(calls: CallUsage[], pricing: Pricing, transactions: number, statementSize: number): Cost {
  const tokens = tokenTotals(calls)
  const base = { tokens, statementSize, totalUsd: null, perTransactionUsd: null, perStatementUsd: null }
  const models = [...new Set(calls.map((c) => c.model))]
  let total = 0
  for (const model of models) {
    const price = pricing.models[model]
    if (!price) return { ...base, reason: `cost not computed: no price for model "${model}" in eval/pricing.json` }
    const used = tokenTotals(calls.filter((c) => c.model === model))
    const needed: Array<[number, number | null]> = [
      [used.inputTokens, price.input],
      [used.outputTokens, price.output],
      [used.cacheReadTokens, price.cache_read],
      [used.cacheWriteTokens, price.cache_write_5m],
    ]
    if (needed.some(([count, p]) => count > 0 && p === null) || price.input === null || price.output === null) {
      return { ...base, reason: 'cost not computed: pricing not filled in' }
    }
    total += needed.reduce((s, [count, p]) => s + (count * (p ?? 0)) / 1_000_000, 0)
  }
  const perTx = transactions > 0 ? total / transactions : null
  return {
    ...base,
    totalUsd: total,
    perTransactionUsd: perTx,
    perStatementUsd: perTx === null ? null : perTx * statementSize,
  }
}

// ─── Confusions ───────────────────────────────────────────────────────────────

export interface Confusion {
  trueCode: string
  predictedCode: string
  count: number
  /** The prediction is one of the row's acceptable alternates. */
  acceptable: boolean
}

/** Most common wrong (strict) true → predicted pairs. */
export function confusions(rows: ScoredRow[], top = 15): Confusion[] {
  const counts = new Map<string, Confusion>()
  for (const r of rows) {
    if (r.strict) continue
    const predicted = r.predictedCode || '(none)'
    const key = `${r.trueCode}→${predicted}`
    const c = counts.get(key) ?? { trueCode: r.trueCode, predictedCode: predicted, count: 0, acceptable: r.lenient }
    c.count++
    counts.set(key, c)
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.trueCode.localeCompare(b.trueCode) || a.predictedCode.localeCompare(b.predictedCode))
    .slice(0, top)
}

// ─── REVIEW rows ──────────────────────────────────────────────────────────────

export interface ReviewLabelled {
  /** Predictions on REVIEW rows (rows × runs). */
  n: number
  /** Correct: not auto-approved (pending or flagged). */
  sentToReview: number
  /** Wrong: auto-approved although the account can't be known. */
  autoApproved: number
  rate: number | null
}

/** How the app handled rows labelled REVIEW. */
export function reviewLabelled(predictions: Prediction[], truth: TruthRow[]): ReviewLabelled {
  const review = new Set(truth.filter((t) => t.trueCode === REVIEW_LABEL).map((t) => t.id))
  const rows = predictions.filter((p) => review.has(p.id))
  const sent = rows.filter((p) => p.status !== 'approved').length
  return { n: rows.length, sentToReview: sent, autoApproved: rows.length - sent, rate: ratio(sent, rows.length) }
}

// ─── Unlabelled rows ──────────────────────────────────────────────────────────

/** What the app did with rows we can't score (ambiguous, not yet hand-labelled). */
export function unlabelledSplit(predictions: Prediction[], truth: TruthRow[]): { n: number; approved: number; pending: number; flagged: number } {
  const unlabelled = new Set(truth.filter((t) => !t.trueCode).map((t) => t.id))
  const rows = predictions.filter((p) => unlabelled.has(p.id))
  return {
    n: rows.length,
    approved: rows.filter((r) => r.status === 'approved').length,
    pending: rows.filter((r) => r.status === 'pending').length,
    flagged: rows.filter((r) => r.status === 'flagged').length,
  }
}

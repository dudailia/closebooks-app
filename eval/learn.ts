// "Learning from corrections" experiment. Pure logic; the command line is
// eval/learn-cli.ts.
//
// June is the reviewed month: wherever the saved model prediction for a June
// row was wrong (lenient), the reviewer corrects it to the true account and
// accepts the app's "Always categorize … as …?" prompt, which creates a vendor
// rule through the app's own saveRule(). July and August are then categorised
// with rules applied first (the app's own applyRulesBeforeAI / applyRulesToJob,
// the same code the upload page now runs) and the AI only for rows no rule matched.
//
// Without API calls this computes:
//   - baseline: the saved predictions for July–August;
//   - "app today": the saved predictions with rules applied afterwards, the way
//     the review page does it (only to rows still pending);
//   - "rules first" projection: rule answers for matched rows and the saved AI
//     answers for the rest (an approximation: a live run would batch the
//     unmatched rows differently);
//   - the estimated cost of a live "rules first" run.

import type { Transaction } from '@/types'
import { applyRulesToJob, listRules, saveRule } from '@/lib/review/rules'
import {
  accuracy, reviewLabelled, reviewSplit, scoreRows,
  type CallUsage, type ModelPrice, type Prediction, type TruthRow, REVIEW_LABEL,
} from './metrics'
import type { ChartAccount } from './data'

export const REVIEWED_MONTH = '2026-06'
export const TEST_MONTHS = ['2026-07', '2026-08']

export interface Correction {
  id: string
  description: string
  predictedCode: string
  trueCode: string
  /** The vendor pattern the app's saveRule() stored for this correction. */
  pattern: string
}

/** Dataset ids are `<date>_<vendor_key>_<n>`. */
export function vendorKeyOf(id: string): string {
  return id.slice(11).replace(/_\d+$/, '')
}

export interface RuleSummary {
  pattern: string
  accountCode: string
  categoryName: string
}

export interface ScenarioMetrics {
  predictions: number
  strict: number | null
  lenient: number | null
  autoApproved: number
  wrongAmongAutoApprovedLenient: number
  wrongAmongAutoApprovedLenientRate: number | null
  reviewLoad: number
  reviewRowsAutoApproved: number
  aiRows: number
}

export interface LearnPlan {
  corrections: Correction[]
  rules: RuleSummary[]
  testRows: number
  ruleMatched: number
  ruleMatchedCorrectStrict: number
  ruleMatchedCorrectLenient: number
  ruleMatchedWrong: Array<{ id: string; description: string; ruleCode: string; trueCode: string; pattern: string }>
  unmatched: number
  /** Test-month rows from a vendor that had a June correction: what a vendor-level rule could catch. */
  sameVendorRows: number
  aiCalls: number
  baseline: ScenarioMetrics
  appToday: ScenarioMetrics
  rulesFirst: ScenarioMetrics
}

export function toTransaction(row: TruthRow): Transaction {
  return {
    id: row.id, date: row.date, description: row.description, original_description: row.description,
    amount: row.amount, type: row.type, suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending',
  }
}

const inMonths = (months: string[]) => (r: { date: string }) => months.some((m) => r.date.startsWith(m))

/** June corrections → app rules. Rules live in the app module's in-memory list. */
export async function learnFromJune(truth: TruthRow[], preds: Prediction[], chart: ChartAccount[]): Promise<Correction[]> {
  const names = new Map(chart.map((a) => [a.code, a.name]))
  const june = truth.filter(inMonths([REVIEWED_MONTH]))
  const scored = scoreRows(preds.filter((p) => june.some((t) => t.id === p.id)), june)
  const corrections: Correction[] = []
  for (const r of scored) {
    if (r.lenient) continue
    const row = june.find((t) => t.id === r.id)!
    // What the reviewer does in the app: pick the right account, then accept
    // "Always categorize … as …?" (TransactionTable → saveRule).
    const rule = await saveRule({ description: row.description, accountCode: r.trueCode, categoryName: names.get(r.trueCode) ?? r.trueCode, createdBy: 'eval-reviewer', direction: row.type })
    corrections.push({ id: r.id, description: row.description, predictedCode: r.predictedCode, trueCode: r.trueCode, pattern: rule.vendorPattern })
  }
  return corrections
}

/** A rule-applied transaction as a Prediction: the app marks it edited, which counts as approved. */
function rulePrediction(t: Transaction, run: number): Prediction {
  return {
    run, id: t.id, predictedCode: t.final_account_code ?? '', confidence: t.confidence, status: 'approved',
    validationFlags: [], unknownToChart: false, noPrediction: false, batchIndex: -1, latencyMs: 0,
  }
}

function scenario(preds: Prediction[], truth: TruthRow[], aiRows: number): ScenarioMetrics {
  const scored = scoreRows(preds, truth)
  const acc = accuracy(scored)
  const split = reviewSplit(scored)
  const rl = reviewLabelled(preds, truth)
  return {
    predictions: preds.length,
    strict: acc.strict,
    lenient: acc.lenient,
    autoApproved: split.approved,
    wrongAmongAutoApprovedLenient: split.autoApproved.n - split.autoApproved.lenientCorrect,
    wrongAmongAutoApprovedLenientRate: split.autoApprovedErrorRate.lenient,
    reviewLoad: split.pending + split.flagged + rl.sentToReview,
    reviewRowsAutoApproved: rl.autoApproved,
    aiRows,
  }
}

/**
 * Everything that can be known without an API call. Call learnFromJune first.
 * `baselinePreds` are the saved predictions (one run) for the test months.
 */
export function planRulesFirst(truth: TruthRow[], baselinePreds: Prediction[], batchSize: number, corrections: Correction[] = []): LearnPlan & { unmatchedRows: TruthRow[] } {
  const test = truth.filter(inMonths(TEST_MONTHS))
  const byId = new Map(test.map((t) => [t.id, t]))
  const base = baselinePreds.filter((p) => byId.has(p.id))
  const run = base[0]?.run ?? 0

  // Rules first: every test row starts pending, rules run before any AI call.
  const { txs: ruled, applied } = applyRulesToJob(test.map(toTransaction))
  const appliedIds = new Set(applied.map((a) => a.txId))
  const ruleOf = new Map(applied.map((a) => [a.txId, a.ruleId]))
  const rules = listRules()
  const patternOf = new Map(rules.map((r) => [r.id, r.vendorPattern]))

  const matched = ruled.filter((t) => appliedIds.has(t.id))
  const matchedScored = scoreRows(matched.map((t) => rulePrediction(t, run)), test)
  const unmatchedRows = test.filter((t) => !appliedIds.has(t.id))

  const rulesFirstPreds = [
    ...matched.map((t) => rulePrediction(t, run)),
    ...base.filter((p) => !appliedIds.has(p.id)),
  ]

  // App today: AI first (the saved predictions), then rules on rows still pending.
  const asTx: Transaction[] = base.map((p) => ({
    ...toTransaction(byId.get(p.id)!),
    status: p.status, suggested_account_code: p.predictedCode, confidence: p.confidence,
  }))
  const { txs: todayTxs, applied: todayApplied } = applyRulesToJob(asTx)
  const todayIds = new Set(todayApplied.map((a) => a.txId))
  const todayPreds = base.map((p) => {
    if (!todayIds.has(p.id)) return p
    return rulePrediction(todayTxs.find((t) => t.id === p.id)!, run)
  })

  return {
    corrections,
    rules: rules.map((r) => ({ pattern: r.vendorPattern, accountCode: r.accountCode, categoryName: r.categoryName })),
    testRows: test.length,
    ruleMatched: matched.length,
    ruleMatchedCorrectStrict: matchedScored.filter((r) => r.strict).length,
    ruleMatchedCorrectLenient: matchedScored.filter((r) => r.lenient).length,
    ruleMatchedWrong: matched
      .map((t) => ({ t, truth: byId.get(t.id)! }))
      .filter(({ t, truth: row }) => row.trueCode !== REVIEW_LABEL && t.final_account_code !== row.trueCode && !row.acceptable.includes(t.final_account_code ?? ''))
      .map(({ t, truth: row }) => ({ id: t.id, description: t.description, ruleCode: t.final_account_code ?? '', trueCode: row.trueCode, pattern: patternOf.get(ruleOf.get(t.id)!) ?? '' })),
    unmatched: unmatchedRows.length,
    sameVendorRows: test.filter((t) => corrections.some((c) => vendorKeyOf(c.id) === vendorKeyOf(t.id))).length,
    aiCalls: Math.ceil(unmatchedRows.length / batchSize),
    baseline: scenario(base, test, test.length),
    appToday: scenario(todayPreds, test, test.length),
    rulesFirst: scenario(rulesFirstPreds, test, unmatchedRows.length),
    unmatchedRows,
  }
}

export interface CostEstimate {
  calls: number
  inputTokens: number
  outputTokens: number
  costUsd: number | null
  basis: string
}

/**
 * Estimated cost of categorising `rows` rows in batches of `batchSize`, from a
 * saved run's actual usage: input tokens fitted as fixed + per-row per call,
 * output tokens per row. Never guesses a missing price.
 */
export function estimateCost(rows: number, batchSize: number, calls: CallUsage[], sizes: Map<string, number>, price: ModelPrice | undefined): CostEstimate {
  const ok = calls.filter((c) => !c.error)
  const points = ok.map((c) => ({ x: sizes.get(`${c.run}:${c.batchIndex}`) ?? batchSize, y: c.inputTokens }))
  const n = points.length
  const mx = points.reduce((s, p) => s + p.x, 0) / n
  const my = points.reduce((s, p) => s + p.y, 0) / n
  const sxx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  const perRowIn = sxx > 0 ? points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx : my / mx
  const fixedIn = my - perRowIn * mx
  const totalRows = points.reduce((s, p) => s + p.x, 0)
  const perRowOut = ok.reduce((s, c) => s + c.outputTokens, 0) / totalRows

  const nCalls = Math.ceil(rows / batchSize)
  const inputTokens = Math.round(nCalls * fixedIn + rows * perRowIn)
  const outputTokens = Math.round(rows * perRowOut)
  const costUsd = price && price.input !== null && price.output !== null
    ? (inputTokens * price.input + outputTokens * price.output) / 1_000_000
    : null
  return {
    calls: nCalls, inputTokens, outputTokens, costUsd,
    basis: `fitted on ${n} successful calls: ~${Math.round(fixedIn)} input tokens per call + ~${perRowIn.toFixed(1)} per row, ~${perRowOut.toFixed(1)} output tokens per row`,
  }
}

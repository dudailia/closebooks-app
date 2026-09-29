import { describe, expect, it } from 'vitest'
import {
  accuracy, calibration, confusions, cost, excludedCount, latency, percentile, perAccount,
  reviewLabelled, reviewSplit, scoreRows, stability, unlabelledSplit,
  type CallUsage, type Prediction, type Pricing, type TruthRow,
} from '../metrics'

const truth = (id: string, trueCode: string, acceptable: string[] = []): TruthRow => ({
  id, date: '2026-06-01', description: id, amount: 10, type: 'debit', trueCode, acceptable,
  labelSource: trueCode ? 'vendor_table' : 'hand',
})

const pred = (id: string, predictedCode: string, confidence: number, status: Prediction['status'] = 'approved', run = 0, extra: Partial<Prediction> = {}): Prediction => ({
  run, id, predictedCode, confidence, status, validationFlags: [], unknownToChart: false, noPrediction: false,
  batchIndex: 0, latencyMs: 100, ...extra,
})

// Five labelled rows, one unlabelled.
const TRUTH = [
  truth('a', '6100'),
  truth('b', '1100', ['4100']),
  truth('c', '5800'),
  truth('d', '5400'),
  truth('e', '5500', ['6100']),
  truth('u', ''),
]

const PREDS = [
  pred('a', '6100', 0.96),                 // right, auto-approved
  pred('b', '4100', 0.92),                 // wrong strict, right lenient, auto-approved
  pred('c', '5800', 0.95),                 // right, auto-approved
  pred('d', '6300', 0.7, 'pending'),       // wrong, sent to review
  pred('e', '9999', 0.55, 'flagged', 0, { unknownToChart: true, validationFlags: ['coa_account_unknown'] }),
  pred('u', '5400', 0.9),                  // unlabelled: excluded
]

const scored = scoreRows(PREDS, TRUTH)

describe('scoring', () => {
  it('excludes unlabelled rows and counts them', () => {
    expect(scored.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(excludedCount(TRUTH.map((t) => t.id), TRUTH)).toBe(1)
  })

  it('strict counts only the primary label; lenient also accepts alternates', () => {
    expect(accuracy(scored)).toEqual({ n: 5, strictCorrect: 2, lenientCorrect: 3, strict: 0.4, lenient: 0.6 })
  })

  it('an empty prediction is never correct', () => {
    const [r] = scoreRows([pred('a', '', 0, 'flagged', 0, { noPrediction: true })], TRUTH)
    expect([r.strict, r.lenient]).toEqual([false, false])
  })

  it('per account: counts by true code, precision by predicted code', () => {
    const names = new Map([['6100', 'Subscriptions & Software'], ['4100', 'Service Revenue'], ['1100', 'Accounts Receivable']])
    const rows = perAccount(scored, names)
    const byCode = Object.fromEntries(rows.map((r) => [r.code, r]))
    expect(byCode['1100']).toMatchObject({ n: 1, strictCorrect: 0, lenientCorrect: 1, predictedCount: 0, precision: null })
    expect(byCode['4100']).toMatchObject({ n: 0, predictedCount: 1, precision: 0, name: 'Service Revenue' })
    expect(byCode['6100']).toMatchObject({ n: 1, strictCorrect: 1, predictedCount: 1, precision: 1 })
    expect(byCode['9999']).toMatchObject({ n: 0, predictedCount: 1, name: '(not in chart)' })
  })
})

describe('auto-approve vs review', () => {
  it('splits by the app status and scores each side', () => {
    const s = reviewSplit(scored)
    expect(s).toMatchObject({ n: 5, approved: 3, pending: 1, flagged: 1, reviewRate: 0.4, flagRate: 0.2, unknownToChart: 1 })
    expect(s.autoApproved).toMatchObject({ n: 3, strictCorrect: 2, lenientCorrect: 3 })
    expect(s.sentToReview).toMatchObject({ n: 2, strictCorrect: 0, lenientCorrect: 0 })
    expect(s.autoApprovedErrorRate.strict).toBeCloseTo(1 / 3, 10)
    expect(s.autoApprovedErrorRate.lenient).toBe(0)
  })

  it('reports ambiguous rows separately', () => {
    expect(unlabelledSplit(PREDS, TRUTH)).toEqual({ n: 1, approved: 1, pending: 0, flagged: 0 })
  })
})

describe('calibration', () => {
  it('buckets by confidence and computes ECE', () => {
    const c = calibration(scored, 'strict')
    // bucket 9 (0.9–1.0): a 0.96 ✓, b 0.92 ✗, c 0.95 ✓ → acc 2/3, conf 0.943…
    const b9 = c.buckets[9]
    expect(b9.n).toBe(3)
    expect(b9.accuracy).toBeCloseTo(2 / 3, 10)
    expect(b9.meanConfidence).toBeCloseTo((0.96 + 0.92 + 0.95) / 3, 10)
    expect(c.buckets[7]).toMatchObject({ n: 1, accuracy: 0 }) // d 0.70 ✗
    expect(c.buckets[5]).toMatchObject({ n: 1, accuracy: 0 }) // e 0.55 ✗
    // ECE = 3/5·|2/3 − 0.9433| + 1/5·|0 − 0.70| + 1/5·|0 − 0.55|
    const expected = (3 / 5) * Math.abs(2 / 3 - (0.96 + 0.92 + 0.95) / 3) + (1 / 5) * 0.7 + (1 / 5) * 0.55
    expect(c.ece).toBeCloseTo(expected, 10)
  })

  it('confidence 1.0 lands in the top bucket', () => {
    const c = calibration(scoreRows([pred('a', '6100', 1)], TRUTH), 'lenient')
    expect(c.buckets[9].n).toBe(1)
    expect(c.ece).toBe(0)
  })
})

describe('stability across runs', () => {
  it('counts rows whose account or decision changed and the confidence spread', () => {
    const preds = [
      pred('a', '6100', 0.96, 'approved', 0), pred('a', '6100', 0.9, 'approved', 1),
      pred('b', '1100', 0.92, 'approved', 0), pred('b', '4100', 0.8, 'pending', 1),
    ]
    expect(stability(preds)).toEqual({
      runs: 2, rowsCompared: 2, rowsChanged: 1, changeRate: 0.5, rowsDecisionChanged: 1,
      meanConfidenceSpread: ((0.96 - 0.9) + (0.92 - 0.8)) / 2,
    })
  })

  it('is not computable from one run', () => {
    expect(stability(PREDS)).toMatchObject({ runs: 1, rowsCompared: 0, changeRate: null, meanConfidenceSpread: null })
  })
})

describe('latency', () => {
  it('nearest-rank percentiles', () => {
    expect(percentile([5, 1, 4, 2, 3], 50)).toBe(3)
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBe(9)
    expect(percentile([], 50)).toBeNull()
  })

  it('per batch and per transaction', () => {
    const l = latency(
      [{ run: 0, batchIndex: 0, size: 20, wallMs: 8000, ok: true }, { run: 0, batchIndex: 1, size: 4, wallMs: 2000, ok: true }],
      [{ run: 0, batchIndex: 0, attempt: 1, model: 'm', latencyMs: 8000, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }],
    )
    expect(l.perBatchMs).toEqual({ median: 2000, p90: 8000 })
    expect(l.perTransactionMs).toEqual({ median: 400, p90: 500 }) // 20 rows at 400ms, 4 rows at 500ms
  })
})

describe('cost', () => {
  const pricing: Pricing = {
    source_url: 'x', date_checked: 'y',
    models: { m: { input: 3, output: 15, cache_write_5m: 3.75, cache_read: 0.3 }, blank: { input: null, output: null, cache_write_5m: null, cache_read: null } },
  }
  const call = (model: string, input: number, output: number, extra: Partial<CallUsage> = {}): CallUsage => ({
    run: 0, batchIndex: 0, attempt: 1, model, latencyMs: 1, inputTokens: input, outputTokens: output, cacheReadTokens: 0, cacheWriteTokens: 0, ...extra,
  })

  it('prices every call, including failed attempts', () => {
    const c = cost([call('m', 1_000_000, 100_000), call('m', 200_000, 0, { error: 'bad json' })], pricing, 40, 97)
    // (1.2M × $3 + 0.1M × $15) / 1M = 3.6 + 1.5
    expect(c.totalUsd).toBeCloseTo(5.1, 10)
    expect(c.perTransactionUsd).toBeCloseTo(5.1 / 40, 10)
    expect(c.perStatementUsd).toBeCloseTo((5.1 / 40) * 97, 10)
    expect(c.tokens).toMatchObject({ calls: 2, failedCalls: 1, inputTokens: 1_200_000 })
  })

  it('never guesses a missing price', () => {
    expect(cost([call('blank', 10, 10)], pricing, 1, 97)).toMatchObject({ totalUsd: null, reason: 'cost not computed: pricing not filled in' })
    expect(cost([call('other', 10, 10)], pricing, 1, 97).reason).toMatch(/no price for model "other"/)
  })

  it('uses the cache prices when there are cache tokens', () => {
    const c = cost([call('m', 0, 0, { cacheReadTokens: 1_000_000, cacheWriteTokens: 1_000_000 })], pricing, 1, 1)
    expect(c.totalUsd).toBeCloseTo(0.3 + 3.75, 10)
  })
})

describe('confusions', () => {
  it('lists wrong pairs, most common first, marking acceptable alternates', () => {
    const rows = scoreRows([
      pred('d', '6300', 0.7), pred('d', '6300', 0.7, 'approved', 1), pred('b', '4100', 0.9), pred('a', '', 0, 'flagged'),
    ], TRUTH)
    expect(confusions(rows)).toEqual([
      { trueCode: '5400', predictedCode: '6300', count: 2, acceptable: false },
      { trueCode: '1100', predictedCode: '4100', count: 1, acceptable: true },
      { trueCode: '6100', predictedCode: '(none)', count: 1, acceptable: false },
    ])
  })
})

describe('REVIEW labels', () => {
  const t = [truth('a', '6100'), truth('v', 'REVIEW'), truth('w', 'REVIEW')]
  const p = [pred('a', '6100', 0.9), pred('v', '5700', 0.95, 'approved'), pred('w', '5700', 0.6, 'pending')]

  it('are excluded from account scoring', () => {
    expect(scoreRows(p, t).map((r) => r.id)).toEqual(['a'])
  })

  it('are correct if and only if not auto-approved', () => {
    expect(reviewLabelled(p, t)).toEqual({ n: 2, sentToReview: 1, autoApproved: 1, rate: 0.5 })
    expect(reviewLabelled([pred('v', '', 0, 'flagged')], t)).toMatchObject({ sentToReview: 1, autoApproved: 0 })
  })
})

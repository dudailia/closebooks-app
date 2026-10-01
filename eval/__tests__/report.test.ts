import { describe, expect, it } from 'vitest'
import { loadChart, loadTruth, spreadSample } from '../data'
import { renderReport, summarise, type RawResults } from '../report'
import { renderComparison } from '../compare'
import type { Prediction, TruthRow } from '../metrics'

const chart = [
  { code: '1000', name: 'Checking Account', type: 'asset' as const },
  { code: '6100', name: 'Subscriptions & Software', type: 'expense' as const },
]
const rows: TruthRow[] = [
  { id: 'a', date: '2026-06-01', description: 'ADOBE', amount: 10, type: 'debit', trueCode: '6100', acceptable: [], labelSource: 'vendor_table' },
  { id: 'u', date: '2026-06-02', description: 'AMZN', amount: 20, type: 'debit', trueCode: '', acceptable: [], labelSource: 'hand' },
]
const pred = (id: string, code: string): Prediction => ({
  run: 0, id, predictedCode: code, confidence: 0.9, status: 'approved', validationFlags: [], unknownToChart: false,
  noPrediction: false, batchIndex: 0, latencyMs: 50,
})

function raw(model: string, prices: 'filled' | 'null'): RawResults {
  const price = prices === 'filled'
    ? { input: 3, output: 15, cache_write_5m: 3.75, cache_read: 0.3 }
    : { input: null, output: null, cache_write_5m: null, cache_read: null }
  return {
    meta: {
      startedAt: '2026-09-29T00:00:00Z', finishedAt: '2026-09-29T00:00:01Z', model, runs: 1, limit: 2, labelledOnly: false,
      datasetRows: 292, datasetLabelledRows: 262, datasetReviewRows: 8, statementSize: 97, datasetSha256: 'abc', gitCommit: 'deadbeef', gitDirty: false,
      autoApproveThreshold: 0.85, batchSize: 20, business: 'Brightline Studio LLC', chartName: 'Standard Small Business chart (34 accounts)',
    },
    chart, rows, predictions: [pred('a', '6100'), pred('u', '6100')],
    calls: [{ run: 0, batchIndex: 0, attempt: 1, model, latencyMs: 900, inputTokens: 2000, outputTokens: 400, cacheReadTokens: 0, cacheWriteTokens: 0 }],
    batches: [{ run: 0, batchIndex: 0, size: 2, wallMs: 900, ok: true }],
    pricing: { source_url: 'https://example.test', date_checked: '2026-09-29', models: { m: price } },
  }
}

describe('report', () => {
  it('states what the numbers were measured on and marks a partial run', () => {
    const md = renderReport(raw('m', 'filled'))
    expect(md).toContain('SMOKE TEST: 1 of 262 labelled rows. Not a result.')
    expect(md).toContain('292-row synthetic dataset')
    expect(md).toContain('1 with an account label, 0 labelled REVIEW, 1 excluded because they have no label yet')
    expect(md).toContain('Brightline Studio LLC (fictional), Standard Small Business chart (34 accounts), model `m`, 1 run')
    expect(md).toContain('## Limits')
  })

  it('computes cost from tokens when prices are filled in', () => {
    const s = summarise(raw('m', 'filled'))
    expect(s.cost.totalUsd).toBeCloseTo((2000 * 3 + 400 * 15) / 1e6, 12)
    expect(s.cost.perTransactionUsd).toBeCloseTo(0.012 / 2, 12)
  })

  it('says cost was not computed when prices are null, never guessing', () => {
    const md = renderReport(raw('m', 'null'))
    expect(md).toContain('cost not computed: pricing not filled in')
    expect(summarise(raw('m', 'null')).cost.totalUsd).toBeNull()
  })

  it('marks fake-model runs as meaningless', () => {
    expect(renderReport(raw('fake', 'filled'))).toContain('FAKE MODEL: no API calls were made')
  })
})

describe('dataset', () => {
  it('loads the truth file and the chart, which still matches the app template', () => {
    const truth = loadTruth()
    expect(truth.length).toBeGreaterThan(250)
    expect(truth.every((t) => t.amount > 0)).toBe(true)
    const stripe = truth.find((t) => t.id.includes('_stripe_payout_'))
    expect(stripe).toMatchObject({ trueCode: '1100', acceptable: ['4100'], type: 'credit' })
    expect(loadChart()).toHaveLength(34)
  })

  it('spreadSample picks evenly spaced rows in order', () => {
    expect(spreadSample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5)).toEqual([0, 2, 4, 6, 8])
    expect(spreadSample([1, 2, 3], null)).toEqual([1, 2, 3])
    expect(spreadSample([1, 2, 3], 10)).toEqual([1, 2, 3])
  })
})

describe('REVIEW rows in the report', () => {
  it('scores REVIEW rows only on being sent to review and keeps them out of account accuracy', () => {
    const r = raw('m', 'filled')
    r.rows = [...r.rows, { id: 'v', date: '2026-06-03', description: 'VENMO', amount: 40, type: 'debit', trueCode: 'REVIEW', acceptable: [], labelSource: 'hand' }]
    r.predictions = [...r.predictions, { ...pred('v', '5700'), status: 'pending' }]
    const s = summarise(r)
    expect(s.accuracy.n).toBe(1)
    expect(s.reviewLabelled).toEqual({ n: 1, sentToReview: 1, autoApproved: 0, rate: 1 })
    const md = renderReport(r)
    expect(md).toContain('## Unknowable from the bank line: sent to review 1 of 1')
    expect(md).toContain('the 1 REVIEW rows are excluded here')
  })
})

describe('comparison', () => {
  it('one row per model with the requested columns, stating what it was measured on', () => {
    const a = raw('m', 'filled')
    const b = { ...raw('other', 'filled'), pricing: { ...raw('m', 'filled').pricing } }
    const md = renderComparison([a, b])
    expect(md).toContain('**Measured on:** the 292-row synthetic dataset')
    expect(md).toContain('| Model | Runs | Accuracy strict | Accuracy lenient | Wrong among auto-approved (strict / lenient) | REVIEW rows sent to review | Sent to review (of which flagged) | ECE (strict) | Median latency / transaction | Cost / 100 transactions |')
    expect(md).toContain('| `m` (2-row subset) | 1 | 1/1 (100.0%) | 1/1 (100.0%) | 0/1 (0.0%) / 0/1 (0.0%) |')
    expect(md).toContain('$0.600 |') // $0.012 over 2 predictions = $0.006 each
    expect(md).toMatch(/\| `other` .*cost not computed: no price for model "other"/)
  })
})

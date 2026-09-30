import { describe, expect, it } from 'vitest'
import { mergeRuns } from '../merge'
import { stability } from '../metrics'
import type { RawResults } from '../report'

function raw(startedAt: string, commit: string, codes: string[], cut: RawResults['meta']['cut'] = null): RawResults {
  const rows = ['a', 'b'].map((id) => ({
    id, date: '2026-06-01', description: id, amount: 1, type: 'debit' as const, trueCode: '6100', acceptable: [], labelSource: 'vendor_table' as const,
  }))
  return {
    meta: {
      startedAt, finishedAt: startedAt, model: 'm', runs: 1, limit: null, labelledOnly: false,
      datasetRows: 2, datasetLabelledRows: 2, datasetReviewRows: 0, statementSize: 2, datasetSha256: 'abc', gitCommit: commit, gitDirty: false,
      autoApproveThreshold: 0.85, batchSize: 20, business: 'B', chartName: 'C', budget: { capUsd: 1, spentBeforeUsd: 0, spentAfterUsd: 0.1 }, cut,
    },
    chart: [],
    rows,
    predictions: codes.map((code, i) => ({
      run: 0, id: rows[i].id, predictedCode: code, confidence: 0.9, status: 'approved' as const, validationFlags: [],
      unknownToChart: false, noPrediction: false, batchIndex: 0, latencyMs: 1,
    })),
    calls: [{ run: 0, batchIndex: 0, attempt: 1, model: 'm', latencyMs: 1, inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0 }],
    batches: [{ run: 0, batchIndex: 0, size: codes.length, wallMs: 1, ok: true }],
    pricing: { source_url: 'x', date_checked: 'y', models: {} },
  }
}

describe('mergeRuns', () => {
  it('renumbers runs so the pooled result looks like one multi-run invocation', () => {
    const m = mergeRuns([raw('2026-09-29T00:00:00Z', 'aaaaaaaa1', ['6100', '6100']), raw('2026-09-30T00:00:00Z', 'bbbbbbbb2', ['6100'], { run: 0, rowsDone: 1, rowsPlanned: 2 })])
    expect(m.meta.runs).toBe(2)
    expect(m.predictions.map((p) => p.run)).toEqual([0, 0, 1])
    expect(m.calls.map((c) => c.run)).toEqual([0, 1])
    expect(m.meta.cut).toEqual({ run: 1, rowsDone: 1, rowsPlanned: 2 })
    expect(m.meta.gitCommit).toBe('aaaaaaaa1+bbbbbbbb2')
    expect(m.meta.budget).toBeNull()
    expect(m.meta.mergedFrom).toHaveLength(2)
    expect(stability(m.predictions).rowsCompared).toBe(1)
  })

  it('refuses runs of different models or datasets', () => {
    const other = raw('2026-09-30T00:00:00Z', 'b', ['6100', '6100'])
    other.meta.model = 'n'
    expect(() => mergeRuns([raw('2026-09-29T00:00:00Z', 'a', ['6100', '6100']), other])).toThrow(/model differs/)
    const sha = raw('2026-09-30T00:00:00Z', 'b', ['6100', '6100'])
    sha.meta.datasetSha256 = 'zzz'
    expect(() => mergeRuns([raw('2026-09-29T00:00:00Z', 'a', ['6100', '6100']), sha])).toThrow(/datasetSha256 differs/)
  })
})

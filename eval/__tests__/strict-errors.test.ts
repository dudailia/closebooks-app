import { describe, expect, it } from 'vitest'
import { strictErrorBreakdown } from '../strict-errors'
import type { Prediction, TruthRow } from '../metrics'

const row = (id: string, trueCode: string, acceptable: string[] = []): TruthRow =>
  ({ id, date: '2026-06-01', description: `row ${id}`, amount: 10, type: 'credit', trueCode, acceptable, labelSource: 'vendor_table' }) as TruthRow
const pred = (id: string, code: string, confidence: number, flags: string[] = []): Prediction =>
  ({ run: 0, id, predictedCode: code, confidence, status: 'approved', validationFlags: flags, unknownToChart: false, noPrediction: false, batchIndex: 0, latencyMs: 0 }) as Prediction

describe('strictErrorBreakdown', () => {
  const rows = [row('a', '1100', ['4100']), row('b', '1100', ['4100']), row('c', '2300'), row('d', '5100'), row('e', 'REVIEW')]
  const preds = [pred('a', '4100', 0.95), pred('b', '4100', 0.9), pred('c', '5100', 0.94), pred('d', '5100', 0.99), pred('e', '6300', 0.99)]

  it('splits strict errors into policy alternates and real mistakes, auto-approved rows only', () => {
    const b = strictErrorBreakdown(preds, rows, 0.93)
    expect(b.autoApproved).toBe(3) // a, c, d; b is below the threshold; REVIEW rows are not account-labelled
    expect(b.strictWrong).toBe(2)
    expect(b.policyAlternates).toBe(1)
    expect(b.realMistakes).toBe(1)
    expect(b.groups.map((g) => [g.trueCode, g.predictedCode, g.count, g.policy])).toEqual([['1100', '4100', 1, true], ['2300', '5100', 1, false]])
  })

  it('a flagged row is never auto-approved', () => {
    expect(strictErrorBreakdown([pred('c', '5100', 0.99, ['coa_direction_review'])], rows, 0.93).autoApproved).toBe(0)
  })
})

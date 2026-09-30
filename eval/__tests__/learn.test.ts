import { beforeEach, describe, expect, it, vi } from 'vitest'

// The app's rule module persists to Supabase when it can; never from tests.
vi.mock('@/lib/syncSupabase', () => ({ getSupabaseAndFirm: async () => null }))

import { deleteRule, listRules } from '@/lib/review/rules'
import { estimateCost, learnFromJune, planRulesFirst, vendorKeyOf } from '../learn'
import type { CallUsage, Prediction, TruthRow } from '../metrics'

const chart = [
  { code: '1000', name: 'Checking Account', type: 'asset' as const },
  { code: '5400', name: 'Office Supplies', type: 'expense' as const },
  { code: '6300', name: 'Miscellaneous Expense', type: 'expense' as const },
]
const row = (id: string, description: string, trueCode: string): TruthRow => ({
  id, date: id.slice(0, 10), description, amount: 20, type: 'debit', trueCode, acceptable: [], labelSource: 'vendor_table',
})
const pred = (id: string, code: string, status: Prediction['status'] = 'approved'): Prediction => ({
  run: 0, id, predictedCode: code, confidence: status === 'approved' ? 0.95 : 0.7, status, validationFlags: [],
  unknownToChart: false, noPrediction: false, batchIndex: 0, latencyMs: 0,
})

beforeEach(async () => { for (const r of listRules()) await deleteRule(r.id) })

describe('learning from June corrections', () => {
  const truth = [
    row('2026-06-10_ace_hardware_1', 'ACE HARDWARE #07891 AUSTIN TX', '6300'),
    row('2026-06-12_staples_1', 'STAPLES 00115 AUSTIN TX', '5400'),
    row('2026-07-08_ace_hardware_1', 'ACE HARDWARE #07891 AUSTIN TX', '6300'),      // identical bank line
    row('2026-07-09_ace_hardware_2', 'POS DEBIT 07/09 ACE HDWE 07891 AUSTIN', '6300'), // same vendor, other format
    row('2026-08-02_staples_1', 'STAPLES 00115 AUSTIN TX', '5400'),
  ]

  it('turns a wrong June prediction into an app rule, and only wrong ones', async () => {
    const corrections = await learnFromJune(truth, [pred('2026-06-10_ace_hardware_1', '5400'), pred('2026-06-12_staples_1', '5400')], chart)
    expect(corrections).toEqual([expect.objectContaining({ id: '2026-06-10_ace_hardware_1', predictedCode: '5400', trueCode: '6300', pattern: 'ace hardware austin' })])
    expect(listRules().map((r) => [r.vendorPattern, r.accountCode])).toEqual([['ace hardware austin', '6300']])
  })

  it('applies rules before the AI, using the app matcher, and counts what they catch', async () => {
    const june = [pred('2026-06-10_ace_hardware_1', '5400'), pred('2026-06-12_staples_1', '5400')]
    const corrections = await learnFromJune(truth, june, chart)
    const base = [pred('2026-07-08_ace_hardware_1', '5400'), pred('2026-07-09_ace_hardware_2', '5400', 'pending'), pred('2026-08-02_staples_1', '5400')]
    const plan = planRulesFirst(truth, base, 20, corrections)
    expect(plan.testRows).toBe(3)
    expect(plan.ruleMatched).toBe(1) // the identical line; the other format doesn't match the stored pattern
    expect(plan.ruleMatchedCorrectLenient).toBe(1)
    expect(plan.unmatched).toBe(2)
    expect(plan.sameVendorRows).toBe(2)
    expect(plan.baseline).toMatchObject({ lenient: 1 / 3, autoApproved: 2, wrongAmongAutoApprovedLenient: 1 })
    // The rule fixes the identical Ace line (approved, right); the other Ace format stays pending; Staples stays approved.
    expect(plan.rulesFirst).toMatchObject({ lenient: 2 / 3, autoApproved: 2, wrongAmongAutoApprovedLenient: 0, aiRows: 2 })
    // App today: rules only touch rows still pending after the AI, so the auto-approved mistake stays.
    expect(plan.appToday).toMatchObject({ lenient: 1 / 3, autoApproved: 2 })
  })

  it('reads the vendor key from dataset ids', () => {
    expect(vendorKeyOf('2026-07-09_ace_hardware_2')).toBe('ace_hardware')
    expect(vendorKeyOf('2026-06-01_gusto_net_pay_1')).toBe('gusto_net_pay')
  })
})

describe('cost estimate', () => {
  const call = (batchIndex: number, input: number, output: number): CallUsage => ({
    run: 0, batchIndex, attempt: 1, model: 'm', latencyMs: 1, inputTokens: input, outputTokens: output, cacheReadTokens: 0, cacheWriteTokens: 0,
  })
  it('fits fixed + per-row input tokens and per-row output, then prices them', () => {
    // 20-row batches: 1800 + 45×20 = 2700 input; 12-row: 1800 + 45×12 = 2340. Output 80/row.
    const calls = [call(0, 2700, 1600), call(1, 2700, 1600), call(2, 2340, 960)]
    const sizes = new Map([['0:0', 20], ['0:1', 20], ['0:2', 12]])
    const e = estimateCost(40, 20, calls, sizes, { input: 3, output: 15, cache_write_5m: 3.75, cache_read: 0.3 })
    expect(e.calls).toBe(2)
    expect(e.inputTokens).toBe(2 * 1800 + 40 * 45)
    expect(e.outputTokens).toBe(40 * 80)
    expect(e.costUsd).toBeCloseTo((5400 * 3 + 3200 * 15) / 1e6, 10)
  })
  it('never guesses a missing price', () => {
    expect(estimateCost(10, 20, [call(0, 100, 10)], new Map([['0:0', 1]]), undefined).costUsd).toBeNull()
  })
})

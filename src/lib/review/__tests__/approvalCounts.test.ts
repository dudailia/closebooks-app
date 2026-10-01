import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/types'
import { approvalBreakdown, approvalCounts } from '@/lib/review/approvalCounts'
import { approveTransaction, recategorizeTransaction } from '@/lib/review/approve'

const tx = (id: string, over: Partial<Transaction> = {}): Transaction => ({
  id, date: '2026-06-01', description: 'X', original_description: 'X', amount: 10, type: 'debit',
  suggested_category: 'Software', suggested_account_code: '6100', confidence: 0.97, status: 'pending', ...over,
})

describe('approvalCounts', () => {
  it('a high-confidence row a reviewer approved counts as reviewer, not auto', () => {
    // Pending despite 0.97 (e.g. it had a validation flag), then approved by hand.
    const reviewed = approveTransaction(tx('r', { confidence: 0.97 }))
    const auto = tx('a', { status: 'approved', approvedBy: 'ai', categorizationSource: 'ai' })
    const c = approvalCounts([reviewed, auto, tx('p')])
    expect(c).toEqual({ approved: 2, byAi: 1, byRule: 0, byReviewer: 1, notRecorded: 0 })
    expect(approvalBreakdown(c)).toBe('1 auto-approved by AI · 1 by reviewer')
  })

  it('counts rule and recategorised rows, and old rows by their source', () => {
    const chart = [{ code: '6200', name: 'Taxes', type: 'expense' as const }]
    const c = approvalCounts([
      tx('rule', { status: 'edited', categorizationSource: 'firm_rule', approvedBy: 'rule' }),
      recategorizeTransaction(tx('re'), '6200', chart),
      tx('old-rule', { status: 'edited', categorizationSource: 'firm_rule' }),
      tx('old-edit', { status: 'edited' }),
      tx('old-approved', { status: 'approved' }),
      tx('flagged', { status: 'flagged' }),
    ])
    expect(c).toEqual({ approved: 5, byAi: 0, byRule: 2, byReviewer: 2, notRecorded: 1 })
    expect(approvalBreakdown(c)).toBe('2 by firm rule · 2 by reviewer · 1 not recorded')
  })

  it('says so when nothing is approved', () => {
    expect(approvalBreakdown(approvalCounts([tx('p')]))).toBe('none approved')
  })
})

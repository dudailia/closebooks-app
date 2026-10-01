import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategorizationJob, ChartOfAccounts, Transaction } from '@/types'

// A fake Supabase that stores upserted rows and serves them back, so the
// reload test goes through db.ts's real save and load mapping.
const fakeDb = vi.hoisted(() => {
  const tables: Record<string, Map<string, Record<string, unknown>>> = {}
  const table = (name: string) => (tables[name] ??= new Map())
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from(name: string) {
      const filters: Array<[string, unknown]> = []
      const rows = () => [...table(name).values()].filter((r) => filters.every(([c, v]) => r[c] === v))
      const query = {
        select: () => query,
        eq: (col: string, val: unknown) => { filters.push([col, val]); return query },
        order: async () => ({ data: rows(), error: null }),
        maybeSingle: async () => ({ data: name === 'firms' ? { id: 'firm-1' } : rows()[0] ?? null, error: null }),
        upsert: async (input: Record<string, unknown> | Record<string, unknown>[]) => {
          for (const r of Array.isArray(input) ? input : [input]) table(name).set(String(r.id), JSON.parse(JSON.stringify(r)))
          return { error: null }
        },
      }
      return query
    },
  }
  return { client, reset: () => { for (const k of Object.keys(tables)) delete tables[k] } }
})

vi.mock('@/lib/supabase/client', () => ({ createClient: () => fakeDb.client, supabaseConfigured: true }))

import { approveSelected, approveTransaction, recategorizeTransaction } from '@/lib/review/approve'
import { approvalCounts } from '@/lib/review/approvalCounts'
import { dbGetJob, dbSaveJob } from '@/lib/db'
import { memoryDeleteJob } from '@/lib/memoryData'
import { canonicalizeTransactionForExport } from '@/lib/exportValidation'
import { generateJournalEntries } from '@/lib/autopilot/journalEntries'

const COA: ChartOfAccounts[] = [
  { code: '1000', name: 'Checking Account', type: 'asset' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset' },
  { code: '4100', name: 'Service Revenue', type: 'revenue' },
]

const stripePayout: Transaction = {
  id: 'tx-stripe',
  date: '2026-03-12',
  description: 'STRIPE TRANSFER PAYOUT',
  original_description: 'STRIPE TRANSFER PAYOUT',
  amount: 6340,
  type: 'credit',
  suggested_category: 'Service Revenue',
  suggested_account_code: '4100',
  confidence: 0.91,
  status: 'pending',
  categorizationSource: 'ai',
}

function job(transactions: Transaction[]): CategorizationJob {
  return {
    id: 'job-1', client_name: 'Acme Corp', created_at: '2026-03-31T00:00:00Z', status: 'review',
    total_transactions: transactions.length, auto_categorized: 0, approved: 0, flagged: 0,
    transactions, chart_of_accounts: COA,
  }
}

beforeEach(() => fakeDb.reset())

describe('recategorise then approve', () => {
  it("keeps the reviewer's account, with source = human", () => {
    const edited = recategorizeTransaction(stripePayout, '1100', COA)
    const approved = approveTransaction(edited)

    // An edit already approves the row; approving again leaves it as it is.
    expect(approved).toBe(edited)
    expect(approved).toMatchObject({
      status: 'edited',
      final_account_code: '1100',
      final_category: 'Accounts Receivable',
      categorizationSource: 'manual',
    })

    // Export uses the reviewer's account
    expect(canonicalizeTransactionForExport(approved, COA).final_account_code).toBe('1100')

    // Journal entry posts to it, attributed to a human
    const { entries } = generateJournalEntries([approved], COA)
    expect(entries).toHaveLength(1)
    expect(entries[0].source).toBe('human')
    expect(entries[0].lines.map((l) => [l.accountCode, l.debit, l.credit])).toEqual([
      ['1000', 6340, 0],
      ['1100', 0, 6340],
    ])
  })

  it("keeps the reviewer's account after a save and reload from Supabase", async () => {
    const approved = approveTransaction(recategorizeTransaction(stripePayout, '1100', COA))
    await dbSaveJob(job([approved]))
    memoryDeleteJob('job-1') // force the load to come from the database, not memory

    const reloaded = await dbGetJob('job-1')
    const tx = reloaded?.transactions[0]
    expect(tx).toMatchObject({
      status: 'edited',
      final_account_code: '1100',
      final_category: 'Accounts Receivable',
      categorizationSource: 'manual',
    })
    expect(generateJournalEntries(reloaded!.transactions, COA).entries[0]).toMatchObject({ source: 'human' })
  })

  it('approving without an edit accepts the suggestion', () => {
    expect(approveTransaction(stripePayout)).toMatchObject({
      status: 'approved', final_account_code: '4100', final_category: 'Service Revenue', categorizationSource: 'ai',
    })
  })
})

describe('approving rows that are already approved', () => {
  const aiApproved: Transaction = { ...stripePayout, id: 'tx-ai', status: 'approved', approvedBy: 'ai', confidence: 0.97 }
  const ruleApplied: Transaction = {
    ...stripePayout, id: 'tx-rule', status: 'edited', categorizationSource: 'firm_rule', approvedBy: 'rule',
    final_account_code: '1100', final_category: 'Accounts Receivable',
  }
  const pending: Transaction = { ...stripePayout, id: 'tx-pending' }

  it('approveTransaction leaves an AI or rule approval unchanged', () => {
    expect(approveTransaction(aiApproved)).toBe(aiApproved)
    expect(approveTransaction(ruleApplied)).toBe(ruleApplied)
    expect(approveTransaction(pending)).toMatchObject({ status: 'approved', approvedBy: 'reviewer' })
  })

  it('select all + approve keeps who approved each row; only pending rows become reviewer approvals', () => {
    const rows = [aiApproved, ruleApplied, pending]
    const { next, approved, priors } = approveSelected(rows, rows.map((t) => t.id))

    expect(next.map((t) => [t.id, t.status, t.approvedBy])).toEqual([
      ['tx-ai', 'approved', 'ai'],
      ['tx-rule', 'edited', 'rule'],
      ['tx-pending', 'approved', 'reviewer'],
    ])
    // Only the row that changed is audited, undone and counted in "Approved N".
    expect(approved.map((t) => t.id)).toEqual(['tx-pending'])
    expect(priors).toEqual([pending])
    // The close report's breakdown (the bug: it said "3 by reviewer").
    expect(approvalCounts(next)).toMatchObject({ approved: 3, byAi: 1, byRule: 1, byReviewer: 1 })
  })

  it('rows not selected are untouched', () => {
    const { next, approved } = approveSelected([pending, aiApproved], ['tx-ai'])
    expect(next[0]).toBe(pending)
    expect(approved).toEqual([])
  })
})

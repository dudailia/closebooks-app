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

import { approveTransaction, recategorizeTransaction } from '@/lib/review/approve'
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

    expect(approved).toMatchObject({
      status: 'approved',
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
      status: 'approved',
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

import { describe, expect, it } from 'vitest'
import type { ChartOfAccounts, Transaction } from '@/types'
import {
  JournalBalanceError,
  assertBalanced,
  findBankAccount,
  generateJournalEntries,
  journalEntriesToCSV,
  type JournalEntry,
} from '@/lib/autopilot/journalEntries'

const COA: ChartOfAccounts[] = [
  { code: '1000', name: 'Checking Account', type: 'asset' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset' },
  { code: '4000', name: 'Sales Revenue', type: 'revenue' },
  { code: '6100', name: 'Subscriptions & Software', type: 'expense' },
  { code: '6200', name: 'Office Supplies', type: 'expense' },
]

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    date: '2026-03-10',
    description: 'ADOBE CREATIVE CLOUD',
    original_description: 'ADOBE CREATIVE CLOUD',
    amount: 59.99,
    type: 'debit',
    suggested_category: 'Subscriptions & Software',
    suggested_account_code: '6100',
    confidence: 0.95,
    status: 'approved',
    final_category: 'Subscriptions & Software',
    final_account_code: '6100',
    categorizationSource: 'ai',
    ...overrides,
  }
}

describe('generateJournalEntries', () => {
  it('money out: debits the approved account and credits the bank', () => {
    const r = generateJournalEntries([tx()], COA)
    expect(r.exceptions).toEqual([])
    expect(r.entries).toHaveLength(1)
    const [entry] = r.entries
    expect(entry.entryNumber).toBe('JE-0001')
    expect(entry.memo).toBe('Posted to 6100 Subscriptions & Software')
    expect(entry.source).toBe('ai')
    expect(entry.lines).toEqual([
      { accountCode: '6100', accountName: 'Subscriptions & Software', debit: 59.99, credit: 0, memo: 'Posted to 6100 Subscriptions & Software' },
      { accountCode: '1000', accountName: 'Checking Account', debit: 0, credit: 59.99, memo: 'ADOBE CREATIVE CLOUD' },
    ])
    expect(r.totals).toEqual({ debit: 59.99, credit: 59.99 })
  })

  it('money in: debits the bank and credits the approved account', () => {
    const r = generateJournalEntries([
      tx({ type: 'credit', amount: 1950, description: 'CLIENT PAYMENT', final_account_code: '4000', final_category: 'Sales Revenue' }),
    ], COA)
    expect(r.entries[0].lines).toEqual([
      { accountCode: '1000', accountName: 'Checking Account', debit: 1950, credit: 0, memo: 'CLIENT PAYMENT' },
      { accountCode: '4000', accountName: 'Sales Revenue', debit: 0, credit: 1950, memo: 'Posted to 4000 Sales Revenue' },
    ])
    expect(r.checks).toEqual([])
  })

  it('ignores the sign of amount; direction comes from type', () => {
    const r = generateJournalEntries([tx({ amount: -59.99 })], COA)
    expect(r.entries[0].lines[0]).toMatchObject({ accountCode: '6100', debit: 59.99, credit: 0 })
    expect(r.entries[0].lines[1]).toMatchObject({ accountCode: '1000', debit: 0, credit: 59.99 })
  })

  it('split: one line per split plus the bank line', () => {
    const r = generateJournalEntries([
      tx({
        amount: 100,
        status: 'edited',
        splits: [
          { id: 's1', amount: 60, account_code: '6100', category: 'Subscriptions & Software' },
          { id: 's2', amount: 40, account_code: '6200', category: 'Office Supplies' },
        ],
      }),
    ], COA)
    expect(r.exceptions).toEqual([])
    const [entry] = r.entries
    expect(entry.memo).toBe('Posted to 6100 Subscriptions & Software, 6200 Office Supplies')
    expect(entry.lines.map((l) => [l.accountCode, l.debit, l.credit])).toEqual([
      ['6100', 60, 0],
      ['6200', 40, 0],
      ['1000', 0, 100],
    ])
  })

  it('rounds to whole cents: 0.10 + 0.20 splits of a 0.30 transaction balance exactly', () => {
    const r = generateJournalEntries([
      tx({
        amount: 0.3,
        splits: [
          { id: 's1', amount: 0.1, account_code: '6100', category: 'Subscriptions & Software' },
          { id: 's2', amount: 0.2, account_code: '6200', category: 'Office Supplies' },
        ],
      }),
    ], COA)
    expect(r.exceptions).toEqual([])
    expect(r.entries[0].lines.map((l) => l.debit + l.credit)).toEqual([0.1, 0.2, 0.3])
    expect(r.totals).toEqual({ debit: 0.3, credit: 0.3 })
  })

  it('splits that do not sum to the transaction: no entry, listed as an exception', () => {
    const r = generateJournalEntries([
      tx({
        amount: 100,
        splits: [
          { id: 's1', amount: 60, account_code: '6100', category: 'Subscriptions & Software' },
          { id: 's2', amount: 30, account_code: '6200', category: 'Office Supplies' },
        ],
      }),
    ], COA)
    expect(r.entries).toEqual([])
    expect(r.exceptions).toHaveLength(1)
    expect(r.exceptions[0].reason).toBe('Splits total $90.00 but the transaction is $100.00.')
  })

  it('account code not in the chart: no entry, listed as an exception', () => {
    const r = generateJournalEntries([tx({ final_account_code: '9999' })], COA)
    expect(r.entries).toEqual([])
    expect(r.exceptions).toEqual([
      expect.objectContaining({ transactionId: 'tx-1', reason: 'Account code "9999" is not in the chart of accounts.' }),
    ])
  })

  it('split account code not in the chart: no entry, listed as an exception', () => {
    const r = generateJournalEntries([
      tx({ amount: 10, splits: [{ id: 's1', amount: 10, account_code: '8888', category: 'Unknown' }] }),
    ], COA)
    expect(r.entries).toEqual([])
    expect(r.exceptions[0].reason).toBe('Split account code "8888" is not in the chart of accounts.')
  })

  it('unapproved and flagged transactions: no entry, listed as exceptions', () => {
    const r = generateJournalEntries([
      tx({ id: 'p', status: 'pending', final_account_code: undefined }),
      tx({ id: 'f', status: 'flagged' }),
    ], COA)
    expect(r.entries).toEqual([])
    expect(r.exceptions.map((e) => [e.transactionId, e.reason])).toEqual([
      ['p', 'Not approved.'],
      ['f', 'Flagged for review.'],
    ])
    expect(r.totals).toEqual({ debit: 0, credit: 0 })
  })

  it('approved without final_account_code uses the approved suggestion; edited without one is an exception', () => {
    const r = generateJournalEntries([
      tx({ id: 'a', final_account_code: undefined }),
      tx({ id: 'e', status: 'edited', final_account_code: undefined }),
    ], COA)
    expect(r.entries.map((e) => [e.sourceTransactionId, e.lines[0].accountCode])).toEqual([['a', '6100']])
    expect(r.exceptions.map((e) => [e.transactionId, e.reason])).toEqual([['e', 'No approved account code.']])
  })

  it('refund case: money in to an expense account still posts, flagged "check: possible refund"', () => {
    const r = generateJournalEntries([
      tx({ id: 'in', type: 'credit', amount: 20, description: 'ADOBE REFUND' }),
      tx({ id: 'out', type: 'debit', amount: 75, final_account_code: '4000', final_category: 'Sales Revenue' }),
    ], COA)
    expect(r.entries).toHaveLength(2)
    expect(r.entries[0].lines.map((l) => [l.accountCode, l.debit, l.credit])).toEqual([
      ['1000', 20, 0],
      ['6100', 0, 20],
    ])
    expect(r.checks).toEqual([
      { transactionId: 'in', entryNumber: 'JE-0001', reason: 'check: possible refund', detail: 'Money in posted to expense account 6100 Subscriptions & Software.' },
      { transactionId: 'out', entryNumber: 'JE-0002', reason: 'check: possible refund', detail: 'Money out posted to revenue account 4000 Sales Revenue.' },
    ])
  })

  it('no bank account in the chart: every transaction is an exception', () => {
    const noBank = COA.filter((a) => a.code !== '1000')
    const r = generateJournalEntries([tx({ id: 'x' }), tx({ id: 'y' })], noBank)
    expect(r.bankAccount).toBeNull()
    expect(r.entries).toEqual([])
    expect(r.exceptions.map((e) => e.reason)).toEqual([
      'No bank account in the chart of accounts.',
      'No bank account in the chart of accounts.',
    ])
  })

  it('transaction posted to the bank account itself: no entry, listed as an exception', () => {
    const r = generateJournalEntries([tx({ final_account_code: '1000', final_category: 'Checking Account' })], COA)
    expect(r.entries).toEqual([])
    expect(r.exceptions[0].reason).toBe('Posted to the bank account itself (1000 Checking Account).')
  })

  it('numbers entries in date order and keeps debits = credits in total', () => {
    const r = generateJournalEntries([
      tx({ id: 'late', date: '2026-03-20', amount: 10 }),
      tx({ id: 'early', date: '2026-03-01', amount: 5.55 }),
      tx({ id: 'in', date: '2026-03-15', type: 'credit', amount: 100, final_account_code: '4000' }),
    ], COA)
    expect(r.entries.map((e) => [e.entryNumber, e.sourceTransactionId])).toEqual([
      ['JE-0001', 'early'],
      ['JE-0002', 'in'],
      ['JE-0003', 'late'],
    ])
    expect(r.totals).toEqual({ debit: 115.55, credit: 115.55 })
  })

  it('source: rule, human, or ai', () => {
    const r = generateJournalEntries([
      tx({ id: 'rule', status: 'edited', categorizationSource: 'firm_rule' }),
      tx({ id: 'manual', status: 'edited', categorizationSource: 'manual' }),
      tx({ id: 'edited', status: 'edited', categorizationSource: 'ai' }),
      tx({ id: 'copilot', status: 'edited', categorizationSource: 'copilot' }),
      tx({ id: 'ai', status: 'approved', categorizationSource: 'ai' }),
    ], COA)
    expect(r.entries.map((e) => [e.sourceTransactionId, e.source])).toEqual([
      ['rule', 'rule'],
      ['manual', 'human'],
      ['edited', 'human'],
      ['copilot', 'ai'],
      ['ai', 'ai'],
    ])
  })
})

describe('assertBalanced', () => {
  const line = (debit: number, credit: number) => ({ accountCode: '6100', accountName: 'X', debit, credit, memo: '' })
  const entry = (lines: JournalEntry['lines'], n = 1): JournalEntry => ({
    id: `je_${n}`, entryNumber: `JE-000${n}`, date: '2026-03-01', description: '', memo: '',
    source: 'ai', sourceTransactionId: `t${n}`, lines,
  })

  it('throws on an unbalanced entry', () => {
    expect(() => assertBalanced([entry([line(10, 0), line(0, 9.99)])])).toThrow(JournalBalanceError)
    expect(() => assertBalanced([entry([line(10, 0), line(0, 9.99)])])).toThrow(
      'Entry JE-0001 is unbalanced: debits $10.00, credits $9.99.',
    )
  })

  it('passes balanced entries and returns the totals', () => {
    expect(assertBalanced([entry([line(0.1, 0), line(0.2, 0), line(0, 0.3)]), entry([line(5, 0), line(0, 5)], 2)]))
      .toEqual({ debit: 5.3, credit: 5.3 })
  })
})

describe('findBankAccount', () => {
  it('prefers an asset named checking, then code 1000, then cash/bank', () => {
    expect(findBankAccount([
      { code: '1000', name: 'Cash and Bank', type: 'asset' },
      { code: '1010', name: 'Business Checking', type: 'asset' },
    ])?.code).toBe('1010')
    expect(findBankAccount([
      { code: '1000', name: 'Operating', type: 'asset' },
      { code: '1050', name: 'Petty Cash', type: 'asset' },
    ])?.code).toBe('1000')
    expect(findBankAccount([{ code: '1050', name: 'Cash on Hand', type: 'asset' }])?.code).toBe('1050')
    expect(findBankAccount([{ code: '6100', name: 'Bank Fees', type: 'expense' }])).toBeNull()
  })
})

describe('journalEntriesToCSV', () => {
  it('writes the bank account comment, the header, and one row per line', () => {
    const csv = journalEntriesToCSV(generateJournalEntries([tx({ description: 'ADOBE, INC "CC"' })], COA))
    expect(csv.split('\r\n')).toEqual([
      '# Bank account: 1000 Checking Account',
      'Date,Entry #,Account Code,Account Name,Debit,Credit,Memo,Source',
      '2026-03-10,JE-0001,6100,Subscriptions & Software,59.99,,Posted to 6100 Subscriptions & Software,ai',
      '2026-03-10,JE-0001,1000,Checking Account,,59.99,"ADOBE, INC ""CC""",ai',
      '',
    ])
  })
})

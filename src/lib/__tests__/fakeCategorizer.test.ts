import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@/types'
import { fakeModelEnabled } from '@/lib/ai/fakeCategorizer'
import { categorizeTransactionsWithUsage } from '@/lib/categorize'
import { loadChart } from '../../../eval/data'

const chart = loadChart()

function tx(id: string, description: string, type: 'debit' | 'credit', amount = 120): Transaction {
  return {
    id, date: '2026-06-02', description, original_description: description, amount, type,
    suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending',
  }
}

afterEach(() => vi.unstubAllEnvs())

describe('fake categoriser gate', () => {
  it('is off unless CLOSEBOOKS_FAKE_MODEL=1', () => {
    vi.stubEnv('CLOSEBOOKS_FAKE_MODEL', '')
    vi.stubEnv('VERCEL', '')
    expect(fakeModelEnabled()).toBe(false)
  })

  it('is on locally with CLOSEBOOKS_FAKE_MODEL=1', () => {
    vi.stubEnv('CLOSEBOOKS_FAKE_MODEL', '1')
    vi.stubEnv('VERCEL', '')
    expect(fakeModelEnabled()).toBe(true)
  })

  it('is never on in a Vercel deployment', () => {
    vi.stubEnv('CLOSEBOOKS_FAKE_MODEL', '1')
    vi.stubEnv('VERCEL', '1')
    expect(fakeModelEnabled()).toBe(false)
  })
})

describe('fake categoriser through the real engine', () => {
  it('answers every row with an account from the chart, no API client given', async () => {
    vi.stubEnv('CLOSEBOOKS_FAKE_MODEL', '1')
    vi.stubEnv('VERCEL', '')
    const rows = [
      tx('a', 'ZOOM.US 888-799-9666 CA', 'debit', 15.99),
      tx('b', 'STRIPE TRANSFER ST-CKA0BCSQP1', 'credit', 4921.09),
      tx('c', 'GUSTO DES:NET ID:123', 'debit', 4210),
      tx('d', 'SOMETHING UNKNOWN 42', 'debit', 77),
    ]
    const { transactions, calls } = await categorizeTransactionsWithUsage(rows, chart)
    const codes = new Set(chart.map((a) => a.code))
    expect(transactions.map((t) => t.suggested_account_code)).toEqual(['6100', '4100', '5100', '5000'])
    for (const t of transactions) expect(codes.has(t.suggested_account_code)).toBe(true)
    // Unknown vendor: low confidence, goes to review rather than auto-approving.
    expect(transactions[3].status).toBe('pending')
    expect(transactions[2].status).toBe('approved')
    expect(calls.every((c) => c.inputTokens === 0 && c.outputTokens === 0)).toBe(true)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChartOfAccounts, Transaction } from '@/types'

// The app's module-level Anthropic client is replaced by this fake.
const create = vi.hoisted(() => vi.fn())
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create } },
}))

import {
  AUTO_APPROVE_THRESHOLD,
  CATEGORIZE_MODEL,
  categorizeTransactions,
  categorizeTransactionsWithUsage,
} from '@/lib/categorize'

const COA: ChartOfAccounts[] = [
  { code: '1000', name: 'Checking Account', type: 'asset' },
  { code: '4100', name: 'Service Revenue', type: 'revenue' },
  { code: '5400', name: 'Office Supplies', type: 'expense' },
  { code: '6100', name: 'Subscriptions & Software', type: 'expense' },
]

const tx = (i: number, description: string, amount: number, type: Transaction['type'] = 'debit'): Transaction => ({
  id: `t${i}`, date: '2026-06-01', description, original_description: description, amount, type,
  suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending',
})

const TXS = [
  tx(0, 'ADOBE *CREATIVE CLOUD 408-536-6000 CA', 179.97), // clean match → approved
  tx(1, 'MYSTERY VENDOR 123', 50),                         // unknown code → flagged
  tx(2, 'STAPLES 00115 AUSTIN TX', 12.5),                  // small amount → confidence −0.08
  tx(3, 'REFUND SOMETHING', 40),                           // debit to revenue → direction review
  tx(4, 'NOT RETURNED BY MODEL', 10),                      // missing from reply → flagged
]

const REPLY = JSON.stringify([
  { index: 0, suggested_category: 'Subscriptions & Software', suggested_account_code: '6100', confidence: 0.96, reasoning: 'Adobe.' },
  { index: 1, suggested_category: 'Consulting', suggested_account_code: '9999', confidence: 0.9, reasoning: 'Guess.' },
  { index: 2, suggested_category: 'Office Supplies', suggested_account_code: '5400', confidence: 0.9, reasoning: 'Staples.' },
  { index: 3, suggested_category: 'Service Revenue', suggested_account_code: '4100', confidence: 0.95, reasoning: 'Revenue.' },
])

const message = (text: string) => ({
  content: [{ type: 'text', text }],
  usage: { input_tokens: 1200, output_tokens: 300, cache_read_input_tokens: 50, cache_creation_input_tokens: 0 },
})

beforeEach(() => {
  create.mockReset()
  create.mockResolvedValue(message(REPLY))
})

const EXPECTED = [
  { id: 't0', suggested_account_code: '6100', suggested_category: 'Subscriptions & Software', confidence: 0.96, status: 'approved', validation_flags: [] },
  { id: 't1', suggested_account_code: '9999', suggested_category: 'Consulting', confidence: 0.55, status: 'flagged', validation_flags: ['coa_account_unknown'] },
  { id: 't2', suggested_account_code: '5400', suggested_category: 'Office Supplies', status: 'pending', validation_flags: [] },
  { id: 't3', suggested_account_code: '4100', suggested_category: 'Service Revenue', confidence: 0.6, status: 'pending', validation_flags: ['coa_direction_review'] },
  { id: 't4', suggested_account_code: '', status: 'flagged' },
]

describe('categorizeTransactions output is unchanged by usage reporting', () => {
  it('produces the expected categorisations through the app path', async () => {
    const out = await categorizeTransactions(TXS, COA)
    expect(out).toHaveLength(5)
    out.forEach((t, i) => expect(t).toMatchObject(EXPECTED[i]))
    expect(out[2].confidence).toBeCloseTo(0.82, 10)
    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0].model).toBe(CATEGORIZE_MODEL)
    // The 2026-09-30 eval decision (src/lib/ai/models.ts).
    expect(CATEGORIZE_MODEL).toBe('claude-sonnet-5-5')
    expect(AUTO_APPROVE_THRESHOLD).toBe(0.93)
  })

  it('categorizeTransactionsWithUsage returns exactly the same transactions', async () => {
    const plain = await categorizeTransactions(TXS, COA)
    const withUsage = await categorizeTransactionsWithUsage(TXS, COA)
    expect(withUsage.transactions).toEqual(plain)
  })

  it('reports model, tokens and latency per call', async () => {
    const { calls, batches } = await categorizeTransactionsWithUsage(TXS, COA, [], { model: 'test-model' })
    expect(create.mock.calls[0][0].model).toBe('test-model')
    expect(calls).toEqual([expect.objectContaining({
      batchIndex: 0, attempt: 1, model: 'test-model',
      inputTokens: 1200, outputTokens: 300, cacheReadTokens: 50, cacheWriteTokens: 0,
    })])
    expect(calls[0].latencyMs).toBeGreaterThanOrEqual(0)
    expect(calls[0].error).toBeUndefined()
    expect(batches).toEqual([expect.objectContaining({ batchIndex: 0, size: 5, ok: true })])
  })

  it('an injected client gives the same output as the default client', async () => {
    const other = vi.fn().mockResolvedValue(message(REPLY))
    const viaDefault = await categorizeTransactions(TXS, COA)
    const viaInjected = await categorizeTransactionsWithUsage(TXS, COA, [], { client: { messages: { create: other } } as never })
    expect(viaInjected.transactions).toEqual(viaDefault)
  })

  it('a retried call is recorded twice without changing the output', async () => {
    create.mockReset()
    create.mockRejectedValueOnce(new Error('socket hang up')).mockResolvedValue(message(REPLY))
    const { transactions, calls } = await categorizeTransactionsWithUsage(TXS, COA)
    create.mockReset()
    create.mockResolvedValue(message(REPLY))
    expect(transactions).toEqual(await categorizeTransactions(TXS, COA))
    expect(calls.map((c) => [c.attempt, c.error ?? null, c.inputTokens])).toEqual([
      [1, 'socket hang up', 0],
      [2, null, 1200],
    ])
  })

  it('a reply with no JSON is retried once, then flags the batch; both calls record their tokens', async () => {
    create.mockResolvedValue(message('sorry, no json'))
    const { transactions, calls, batches } = await categorizeTransactionsWithUsage(TXS, COA)
    expect(transactions.every((t) => t.status === 'flagged')).toBe(true)
    expect(calls.map((c) => [c.attempt, c.inputTokens, c.error])).toEqual([
      [1, 1200, 'No JSON array found in Claude response'],
      [2, 1200, 'No JSON array found in Claude response'],
    ])
    expect(batches[0].ok).toBe(false)
  })
})

// Replies from models that think before answering (e.g. claude-opus-5-5):
// content = [thinking, text]. Previously content[0] was read and rejected.
const thinking = { type: 'thinking', thinking: 'Let me map each transaction…', signature: 'sig' }
const withContent = (content: unknown[]) => ({
  content,
  usage: { input_tokens: 1200, output_tokens: 300, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
})

describe('reading replies', () => {
  it('ignores a thinking block and reads the text block, in one call', async () => {
    const expected = await categorizeTransactions(TXS, COA) // plain text reply
    create.mockReset()
    create.mockResolvedValue(withContent([thinking, { type: 'text', text: REPLY }]))
    const { transactions, calls } = await categorizeTransactionsWithUsage(TXS, COA)
    expect(transactions).toEqual(expected)
    expect(calls).toHaveLength(1)
    expect(calls[0].error).toBeUndefined()
  })

  it('joins several text blocks', async () => {
    const expected = await categorizeTransactions(TXS, COA)
    create.mockReset()
    // Blocks are joined with a newline, so split between two JSON objects.
    const cut = REPLY.indexOf('},{') + 2
    create.mockResolvedValue(withContent([thinking, { type: 'text', text: REPLY.slice(0, cut) }, { type: 'text', text: REPLY.slice(cut) }]))
    expect((await categorizeTransactionsWithUsage(TXS, COA)).transactions).toEqual(expected)
  })

  it('a thinking-only reply is retried once, then flags the batch (was: three billed attempts)', async () => {
    create.mockResolvedValue(withContent([thinking]))
    const { transactions, calls } = await categorizeTransactionsWithUsage(TXS, COA)
    expect(transactions.every((t) => t.status === 'flagged')).toBe(true)
    expect(calls.map((c) => c.error)).toEqual([
      'No text in Claude response (content types: thinking)',
      'No text in Claude response (content types: thinking)',
    ])
  })

  it('an unparseable reply followed by a good one recovers on the single retry', async () => {
    const expected = await categorizeTransactions(TXS, COA)
    create.mockReset()
    create.mockResolvedValueOnce(message('[{"index": 0, "suggested_category": }]')).mockResolvedValue(message(REPLY))
    const { transactions, calls } = await categorizeTransactionsWithUsage(TXS, COA)
    expect(transactions).toEqual(expected)
    expect(calls.map((c) => c.error ?? null)).toEqual([expect.stringMatching(/^Failed to parse Claude JSON/), null])
  })

  it('network errors still get up to three attempts', async () => {
    create.mockRejectedValue(new Error('socket hang up'))
    const { calls } = await categorizeTransactionsWithUsage(TXS, COA)
    expect(calls.map((c) => c.attempt)).toEqual([1, 2, 3])
  }, 20000)
})

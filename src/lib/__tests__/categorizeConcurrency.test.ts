import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/types'
import { BATCH_SIZE, CATEGORIZE_CONCURRENCY, categorizeTransactionsWithUsage } from '@/lib/categorize'
import { loadChart, loadTruth } from '../../../eval/data'

// The 292-row synthetic statement from eval/, in the app's upload shape.
const chart = loadChart()
const rows: Transaction[] = loadTruth().map((r) => ({
  id: r.id, date: r.date, description: r.description, original_description: r.description, amount: r.amount, type: r.type,
  suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending',
}))
const expense = chart.find((a) => a.type === 'expense')!

/**
 * A fake model (no API calls). Its answer for a row depends only on the row's
 * text, so any scheduling must give the same result. Replies take `delayMs`
 * (or a per-batch delay) and the fake records how many calls overlap.
 */
function fakeModel(opts: { delayMs: number | ((call: number) => number); failBatchContaining?: string }) {
  let inFlight = 0
  let maxInFlight = 0
  let callNo = 0
  const prompts: string[] = []
  const create = async ({ messages }: { messages: Array<{ content: string }> }) => {
    const prompt = messages[0].content
    prompts.push(prompt)
    inFlight++
    maxInFlight = Math.max(maxInFlight, inFlight)
    const delay = typeof opts.delayMs === 'function' ? opts.delayMs(callNo++) : opts.delayMs
    await new Promise((r) => setTimeout(r, delay))
    inFlight--
    if (opts.failBatchContaining && prompt.includes(opts.failBatchContaining)) throw new Error('network error (fake)')
    const lines = [...prompt.matchAll(/^(\d+): date=.*? \| description=\"(.*?)\" \|/gm)]
    const items = lines.map(([, index, desc]) => ({
      index: Number(index), suggested_category: expense.name, suggested_account_code: expense.code,
      confidence: 0.5 + (desc.length % 50) / 100, reasoning: 'fake',
    }))
    return { content: [{ type: 'text', text: JSON.stringify(items) }], usage: { input_tokens: 10, output_tokens: 10 } }
  }
  return { client: { messages: { create } } as never, stats: () => ({ maxInFlight, prompts }) }
}

describe('concurrent batches', () => {
  it('a 292-row statement gives the same rows, order and prompts at 4 at a time as one at a time', async () => {
    expect(rows).toHaveLength(292)
    const one = fakeModel({ delayMs: 1 })
    const four = fakeModel({ delayMs: (n) => (n % 3) * 7 }) // replies arrive out of order
    const seq = await categorizeTransactionsWithUsage(rows, chart, [], { client: one.client, concurrency: 1 })
    const par = await categorizeTransactionsWithUsage(rows, chart, [], { client: four.client })
    expect(par.transactions.map((t) => t.id)).toEqual(rows.map((t) => t.id))
    expect(par.transactions).toEqual(seq.transactions)
    expect([...four.stats().prompts].sort()).toEqual([...one.stats().prompts].sort())
    expect(par.batches.map((b) => b.batchIndex)).toEqual([...Array(Math.ceil(292 / BATCH_SIZE)).keys()])
    expect(par.calls.map((c) => c.batchIndex)).toEqual([...Array(15).keys()])
  })

  it(`never has more than ${CATEGORIZE_CONCURRENCY} calls in flight`, async () => {
    const fake = fakeModel({ delayMs: 5 })
    await categorizeTransactionsWithUsage(rows, chart, [], { client: fake.client })
    expect(fake.stats().maxInFlight).toBe(CATEGORIZE_CONCURRENCY)
    const two = fakeModel({ delayMs: 5 })
    await categorizeTransactionsWithUsage(rows, chart, [], { client: two.client, concurrency: 2 })
    expect(two.stats().maxInFlight).toBe(2)
  })

  it('15 batches take about 4 rounds instead of 15', async () => {
    const delay = 40
    const fake = fakeModel({ delayMs: delay })
    const started = Date.now()
    await categorizeTransactionsWithUsage(rows, chart, [], { client: fake.client })
    const elapsed = Date.now() - started
    // ceil(15 / 4) = 4 rounds; one-at-a-time would be 15 × 40 ms = 600 ms.
    expect(elapsed).toBeGreaterThanOrEqual(4 * delay - 5)
    expect(elapsed).toBeLessThan(15 * delay * 0.6)
  })

  it('a failed batch flags only its own rows, in place', async () => {
    const target = rows[45] // batch 2
    const fake = fakeModel({ delayMs: 1, failBatchContaining: `description="${target.description}"` })
    const out = await categorizeTransactionsWithUsage(rows, chart, [], { client: fake.client })
    expect(out.transactions.map((t) => t.id)).toEqual(rows.map((t) => t.id))
    const failed = new Set(out.batches.filter((b) => !b.ok).map((b) => b.batchIndex))
    expect(failed.has(2)).toBe(true)
    out.transactions.forEach((t, i) => {
      const inFailed = failed.has(Math.floor(i / BATCH_SIZE))
      expect(t.status === 'flagged' && !t.suggested_account_code).toBe(inFailed)
    })
  }, 20000)
})

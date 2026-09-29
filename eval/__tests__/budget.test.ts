import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { Budget, BudgetExceeded, budgetedClient, callCostUsd, worstCaseAttemptUsd, MAX_OUTPUT_TOKENS } from '../budget'
import { categorizeTransactionsWithUsage } from '@/lib/categorize'
import type { ChartOfAccounts, Transaction } from '@/types'

const price = { input: 3, output: 15, cache_write_5m: 3.75, cache_read: 0.3 }
const ledger = () => join(mkdtempSync(join(tmpdir(), 'cb-budget-')), 'ledger.json')

describe('cost', () => {
  it('prices a call from API usage', () => {
    expect(callCostUsd({ input_tokens: 2710, output_tokens: 1677 }, price)).toBeCloseTo(0.033285, 10)
  })
  it('worst case assumes 2 chars per token and the full 4096-token output', () => {
    expect(worstCaseAttemptUsd(10_000, price)).toBeCloseTo((5000 * 3 + MAX_OUTPUT_TOKENS * 15) / 1e6, 10)
  })
})

describe('Budget', () => {
  it('refuses an attempt that could pass the cap, without calling the API', async () => {
    const inner = { messages: { create: vi.fn() } }
    const budget = new Budget(0.05, ledger())
    const client = budgetedClient(inner, budget, price, 't')
    await expect(client.messages.create({ model: 'm', system: 'x'.repeat(10_000), messages: [{ content: 'y' }] } as never))
      .rejects.toBeInstanceOf(BudgetExceeded)
    expect(inner.messages.create).not.toHaveBeenCalled()
    expect(budget.refused).toBe(true)
    expect(budget.spentUsd).toBe(0)
  })

  it('records actual spend and keeps it across invocations via the ledger', async () => {
    const path = ledger()
    const inner = { messages: { create: vi.fn().mockResolvedValue({ usage: { input_tokens: 1000, output_tokens: 1000 } }) } }
    const b1 = new Budget(1, path)
    await budgetedClient(inner, b1, price, 't').messages.create({ model: 'm', messages: [{ content: 'hi' }] } as never)
    expect(b1.spentUsd).toBeCloseTo(0.018, 10)
    expect(new Budget(1, path).spentUsd).toBeCloseTo(0.018, 10)
  })

  it('stops the real engine between batches when the cap is reached', async () => {
    const coa: ChartOfAccounts[] = [{ code: '6100', name: 'Subscriptions & Software', type: 'expense' }]
    const txs: Transaction[] = Array.from({ length: 40 }, (_, i) => ({
      id: `t${i}`, date: '2026-06-01', description: 'ADOBE CC', original_description: 'ADOBE CC', amount: 50, type: 'debit',
      suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending',
    }))
    const reply = JSON.stringify(Array.from({ length: 20 }, (_, index) => ({ index, suggested_category: 'Subscriptions & Software', suggested_account_code: '6100', confidence: 0.9, reasoning: 'r' })))
    // Each call really costs $0.06; the worst case is ~$0.07, so one call fits under $0.10 and a second can't.
    const inner = { messages: { create: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: reply }], usage: { input_tokens: 5000, output_tokens: 3000 } }) } }
    const budget = new Budget(0.1, ledger())
    const client = budgetedClient(inner, budget, price, 't')
    const first = await categorizeTransactionsWithUsage(txs.slice(0, 20), coa, [], { client: client as never })
    expect(first.transactions.every((t) => t.status === 'approved')).toBe(true)
    expect(budget.refused).toBe(false)
    const second = await categorizeTransactionsWithUsage(txs.slice(20), coa, [], { client: client as never })
    expect(budget.refused).toBe(true)
    expect(inner.messages.create).toHaveBeenCalledTimes(1)
    expect(second.calls.every((c) => c.error?.startsWith('budget cap'))).toBe(true)
    expect(budget.spentUsd).toBeLessThanOrEqual(0.1)
  }, 20000)
})

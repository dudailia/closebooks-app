import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/types'
import { buildCategorizeRequest, CATEGORIZE_SYSTEM_PROMPT } from '@/lib/categorize'
import { applyPromptVariant, PROMPT_VARIANTS } from '../../../eval/prompts/variants'
import { loadChart } from '../../../eval/data'

const chart = loadChart()
const batch: Transaction[] = [
  { id: 'a', date: '2026-06-02', description: 'STRIPE TRANSFER ST-CKA0BCSQP1', original_description: '', amount: 4921.09, type: 'credit', suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending' },
  { id: 'b', date: '2026-06-03', description: 'GUSTO DES:TAX ID:1', original_description: '', amount: 812.4, type: 'debit', suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending' },
]
const corrections = [{ description: 'ADOBE *CREATIVE CLD', fromCategory: 'Office Supplies', toCategory: 'Subscriptions & Software' }]

describe('buildCategorizeRequest', () => {
  it('without options is the app request: string system prompt, one string user message, no cache_control', () => {
    const req = buildCategorizeRequest(batch, chart, corrections, 'claude-sonnet-5-5')
    expect(req.system).toBe(CATEGORIZE_SYSTEM_PROMPT)
    expect(typeof req.messages[0].content).toBe('string')
    expect(JSON.stringify(req)).not.toContain('cache_control')
    expect(req.max_tokens).toBe(4096)
    const content = req.messages[0].content as string
    expect(content.startsWith('Chart of Accounts:\n[1000] Checking Account (asset)')).toBe(true)
    expect(content).toContain('0: date=2026-06-02 | description="STRIPE TRANSFER ST-CKA0BCSQP1" | amount=4921.09 | type=credit')
  })

  it('with cache: same text, split after the chart and corrections, two breakpoints', () => {
    const plain = buildCategorizeRequest(batch, chart, corrections, 'm')
    const cached = buildCategorizeRequest(batch, chart, corrections, 'm', { cache: true })
    const blocks = cached.messages[0].content as Array<{ text: string; cache_control?: unknown }>
    expect(blocks.map((b) => b.text).join('')).toBe(plain.messages[0].content)
    expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' })
    expect(blocks[1].cache_control).toBeUndefined()
    expect(blocks[0].text).not.toContain('date=')
    expect(cached.system).toEqual([{ type: 'text', text: CATEGORIZE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }])
  })

  it('the cached prefix is the same for every batch of an upload', () => {
    const a = buildCategorizeRequest(batch.slice(0, 1), chart, corrections, 'm', { cache: true })
    const b = buildCategorizeRequest(batch.slice(1), chart, corrections, 'm', { cache: true })
    expect((a.messages[0].content as Array<{ text: string }>)[0].text).toBe((b.messages[0].content as Array<{ text: string }>)[0].text)
  })

  it('takes a replacement system prompt', () => {
    expect(buildCategorizeRequest(batch, chart, [], 'm', { systemPrompt: 'X' }).system).toBe('X')
  })
})

describe('prompt variants', () => {
  it('every edit of every variant finds its text in the current app prompt', () => {
    for (const name of Object.keys(PROMPT_VARIANTS)) {
      const out = applyPromptVariant(CATEGORIZE_SYSTEM_PROMPT, name)
      expect(out).not.toBe(CATEGORIZE_SYSTEM_PROMPT)
      for (const e of PROMPT_VARIANTS[name].edits) expect(out).toContain(e.replace)
    }
  })

  it('ar-liabilities removes the "deposits are revenue" guidance', () => {
    const out = applyPromptVariant(CATEGORIZE_SYSTEM_PROMPT, 'ar-liabilities')
    expect(out).not.toContain('Credits/deposits are almost always revenue')
    expect(out).toContain('Accounts Receivable when the chart has it')
    expect(out).toContain('Payroll Liabilities')
  })

  it('an unknown variant is an error', () => {
    expect(() => applyPromptVariant(CATEGORIZE_SYSTEM_PROMPT, 'nope')).toThrow(/unknown prompt variant/)
  })
})

// Hard spending cap for eval runs. Wraps the Anthropic client so every API
// attempt (retries included) is checked BEFORE it is sent: if actual spend so
// far plus that attempt's worst-case cost would pass the cap, the attempt is
// refused and nothing is billed. Actual spend is appended to a ledger file
// after every call, so the cap holds across separate eval/run.ts invocations.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { ModelPrice } from './metrics'

/** categorize.ts sends max_tokens 4096; an attempt can't bill more output than that. */
export const MAX_OUTPUT_TOKENS = 4096
/** Conservative bound on input tokens: 2 characters per token (English text is ~3–4). */
export const CHARS_PER_TOKEN_BOUND = 2

export class BudgetExceeded extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BudgetExceeded'
  }
}

export interface LedgerEntry {
  at: string
  model: string
  label: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  costUsd: number
}

export interface Usage {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

export function callCostUsd(u: Usage, price: ModelPrice): number {
  const need = (p: number | null | undefined, what: string) => {
    if (p === null || p === undefined) throw new Error(`no ${what} price; cannot enforce the budget`)
    return p
  }
  return (
    (u.input_tokens ?? 0) * need(price.input, 'input') +
    (u.output_tokens ?? 0) * need(price.output, 'output') +
    (u.cache_read_input_tokens ?? 0) * need(price.cache_read, 'cache read') +
    (u.cache_creation_input_tokens ?? 0) * need(price.cache_write_5m, 'cache write')
  ) / 1_000_000
}

/** Worst case for one attempt: the whole prompt as input, plus the maximum output. */
export function worstCaseAttemptUsd(promptChars: number, price: ModelPrice): number {
  return callCostUsd({ input_tokens: Math.ceil(promptChars / CHARS_PER_TOKEN_BOUND), output_tokens: MAX_OUTPUT_TOKENS }, price)
}

export class Budget {
  readonly capUsd: number
  private readonly ledgerPath: string
  private entries: LedgerEntry[]
  /** Set once an attempt has been refused. */
  refused = false

  constructor(capUsd: number, ledgerPath: string) {
    this.capUsd = capUsd
    this.ledgerPath = ledgerPath
    this.entries = existsSync(ledgerPath) ? (JSON.parse(readFileSync(ledgerPath, 'utf8')).entries as LedgerEntry[]) : []
  }

  get spentUsd(): number {
    return this.entries.reduce((s, e) => s + e.costUsd, 0)
  }

  /** Throws BudgetExceeded (without spending) if `worstUsd` might not fit. */
  check(worstUsd: number): void {
    if (this.spentUsd + worstUsd > this.capUsd) {
      this.refused = true
      throw new BudgetExceeded(
        `budget cap: spent $${this.spentUsd.toFixed(4)}, next call could cost up to $${worstUsd.toFixed(4)}, cap $${this.capUsd.toFixed(2)}`,
      )
    }
  }

  record(entry: LedgerEntry): void {
    this.entries.push(entry)
    mkdirSync(dirname(this.ledgerPath), { recursive: true })
    writeFileSync(this.ledgerPath, JSON.stringify({ capUsd: this.capUsd, spentUsd: this.spentUsd, entries: this.entries }, null, 2) + '\n')
  }
}

interface MessagesLike {
  messages: { create: (params: never) => Promise<unknown> }
}

type CreateParams = { model: string; system?: unknown; messages: Array<{ content: unknown }> }

/** A client that checks the budget before each attempt and records what it cost. */
export function budgetedClient<T extends MessagesLike>(inner: T, budget: Budget, price: ModelPrice, label: string): T {
  return {
    messages: {
      create: async (params: CreateParams) => {
        const size = (v: unknown) => (typeof v === 'string' ? v.length : JSON.stringify(v ?? '').length)
        const chars = size(params.system) + params.messages.reduce((s, m) => s + size(m.content), 0)
        // A request with cache_control may be billed as a cache write, which costs
        // more than plain input, so the worst case uses the write price.
        const cached = JSON.stringify(params).includes('"cache_control"')
        const worstPrice = cached && price.cache_write_5m != null && price.cache_write_5m > (price.input ?? 0)
          ? { ...price, input: price.cache_write_5m }
          : price
        budget.check(worstCaseAttemptUsd(chars, worstPrice))
        const res = (await inner.messages.create(params as never)) as { usage?: Usage }
        const u = res.usage ?? {}
        budget.record({
          at: new Date().toISOString(), model: params.model, label,
          inputTokens: u.input_tokens ?? 0, outputTokens: u.output_tokens ?? 0,
          cacheReadTokens: u.cache_read_input_tokens ?? 0, cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
          costUsd: callCostUsd(u, price),
        })
        return res
      },
    },
  } as unknown as T
}

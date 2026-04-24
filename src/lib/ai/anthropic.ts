import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic()
  }
  return _client
}

export const AI_MODELS = {
  opus:   'claude-opus-4-7',
  sonnet: 'claude-sonnet-4-6',
  haiku:  'claude-haiku-4-5-20251001',
} as const

export type AiModelKey = keyof typeof AI_MODELS

export interface TokenUsage {
  input: number
  output: number
  cacheRead?: number
  cacheCreate?: number
}

export function costOfUsage(model: AiModelKey, usage: TokenUsage): number {
  const rates: Record<AiModelKey, { in: number; out: number }> = {
    sonnet: { in: 3,  out: 15 },
    haiku:  { in: 1,  out: 5  },
    opus:   { in: 15, out: 75 },
  }
  const r = rates[model]
  return (usage.input / 1_000_000) * r.in + (usage.output / 1_000_000) * r.out
}

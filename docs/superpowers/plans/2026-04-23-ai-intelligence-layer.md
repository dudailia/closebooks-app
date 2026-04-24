# AI Intelligence Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three AI-native features in CloseBooks: a global chat panel that can act via tool-use, an auto-generated narrative insights card, and an autonomous close agent with live reasoning stream.

**Architecture:** Build a shared `src/lib/ai/*` plumbing layer (centralized client, system prompts, tools, SSE helper), then layer three features on top. All three AI routes use Server-Sent Events. The chat and agent use the tool-use loop pattern already proven in `/api/copilot/chat`; narrative uses structured JSON output.

**Tech Stack:** Next.js 14 App Router, `@anthropic-ai/sdk`, Supabase (conversation persistence), SSE. No test suite — `npm run build` + `npm run lint` are the gates.

**Spec:** `docs/superpowers/specs/2026-04-23-ai-intelligence-layer-design.md`

---

## Phase A — Shared plumbing

### Task 1: Centralized Anthropic client

**Files:**
- Create: `src/lib/ai/anthropic.ts`

- [ ] **Step 1: Implement**

```ts
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
  // Sonnet 4.6: $3/$15 per MTok in/out; Haiku 4.5: $1/$5; Opus 4.7: $15/$75
  const rates: Record<AiModelKey, { in: number; out: number }> = {
    sonnet: { in: 3,  out: 15 },
    haiku:  { in: 1,  out: 5  },
    opus:   { in: 15, out: 75 },
  }
  const r = rates[model]
  return (usage.input / 1_000_000) * r.in + (usage.output / 1_000_000) * r.out
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Success.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/anthropic.ts
git commit -m "feat: add centralized Anthropic client helper"
```

---

### Task 2: SSE helper

**Files:**
- Create: `src/lib/ai/sse.ts`

- [ ] **Step 1: Implement**

```ts
export type SseEvent = Record<string, unknown> & { type: string }

const ENCODER = new TextEncoder()

export function encodeSse(event: SseEvent): Uint8Array {
  return ENCODER.encode(`data: ${JSON.stringify(event)}\n\n`)
}

export function sseHeaders(): HeadersInit {
  return {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no',
  }
}

export function sseResponse(run: (send: (e: SseEvent) => void) => Promise<void>): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: SseEvent) => controller.enqueue(encodeSse(e))
      try {
        await run(send)
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, { headers: sseHeaders() })
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/lib/ai/sse.ts
git commit -m "feat: add SSE stream helper"
```

---

### Task 3: Tool definitions

**Files:**
- Create: `src/lib/ai/tools.ts`

- [ ] **Step 1: Implement**

```ts
import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const AI_TOOLS: Tool[] = [
  {
    name: 'findTransactions',
    description: 'Find transactions in the current job matching a natural-language query (e.g., "all Amazon charges over $500"). Returns matching transaction ids.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Natural-language filter' } },
      required: ['query'],
    },
  },
  {
    name: 'flagTransactions',
    description: 'Flag the given transaction ids for human review. Undoable by the CPA.',
    input_schema: {
      type: 'object',
      properties: {
        txIds:  { type: 'array', items: { type: 'string' } },
        reason: { type: 'string' },
      },
      required: ['txIds'],
    },
  },
  {
    name: 'approveTransactions',
    description: 'Mark the given transaction ids as approved.',
    input_schema: {
      type: 'object',
      properties: { txIds: { type: 'array', items: { type: 'string' } } },
      required: ['txIds'],
    },
  },
  {
    name: 'changeCategoryBulk',
    description: 'Change the category and account code for a set of transactions.',
    input_schema: {
      type: 'object',
      properties: {
        txIds:        { type: 'array', items: { type: 'string' } },
        accountCode:  { type: 'string' },
        categoryName: { type: 'string' },
      },
      required: ['txIds', 'accountCode', 'categoryName'],
    },
  },
  {
    name: 'runAutoClose',
    description: 'Start the Autonomous Close Agent for the current client. Returns a stream id the client will subscribe to.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'getOverdueJobs',
    description: 'List clients whose month-end close is overdue.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'explainVariance',
    description: 'Explain a variance for the current client. For example, why office expenses jumped 40%.',
    input_schema: {
      type: 'object',
      properties: { category: { type: 'string' } },
      required: ['category'],
    },
  },
]

export const TOOL_NAMES = AI_TOOLS.map(t => t.name)

export type ToolName =
  | 'findTransactions' | 'flagTransactions' | 'approveTransactions'
  | 'changeCategoryBulk' | 'runAutoClose' | 'getOverdueJobs' | 'explainVariance'
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/lib/ai/tools.ts
git commit -m "feat: define AI tool schemas"
```

---

### Task 4: Tool execution (client-side)

**Files:**
- Create: `src/lib/ai/toolClient.ts`

- [ ] **Step 1: Implement**

```ts
import type { Transaction } from '@/types'

export interface ToolExecContext {
  transactions: Transaction[]
  jobId?: string
  clientId?: string
  mutateTransactions: (ids: string[], patch: (t: Transaction) => Transaction) => void
  overdueJobs?: Array<{ id: string; clientName: string; daysOverdue: number }>
}

export interface ToolExecResult {
  summary: string
  data?: unknown
  mutatedIds?: string[]
}

function matchByQuery(txs: Transaction[], q: string): Transaction[] {
  const needle = q.toLowerCase()
  // Simple: substring in description/category + common comparators
  const gt = needle.match(/(?:over|above|>)\s*\$?([\d,.]+)/)
  const lt = needle.match(/(?:under|below|<)\s*\$?([\d,.]+)/)
  const amountGt = gt ? parseFloat(gt[1].replace(/,/g, '')) : undefined
  const amountLt = lt ? parseFloat(lt[1].replace(/,/g, '')) : undefined
  const keywords = needle
    .replace(/(over|above|under|below|[<>$])\s*[\d,.]+/g, '')
    .replace(/transactions?|charges?|all|the/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return txs.filter(t => {
    if (amountGt !== undefined && !(t.amount > amountGt)) return false
    if (amountLt !== undefined && !(t.amount < amountLt)) return false
    if (keywords.length === 0) return true
    const hay = `${t.description} ${t.final_category ?? ''} ${t.suggested_category ?? ''}`.toLowerCase()
    return keywords.every(k => hay.includes(k))
  })
}

export function executeToolClient(name: string, input: Record<string, unknown>, ctx: ToolExecContext): ToolExecResult {
  switch (name) {
    case 'findTransactions': {
      const q = String(input.query ?? '')
      const hits = matchByQuery(ctx.transactions, q)
      return { summary: `Found ${hits.length} matching transaction${hits.length !== 1 ? 's' : ''}`, data: { ids: hits.map(t => t.id), count: hits.length } }
    }
    case 'flagTransactions': {
      const ids = (input.txIds as string[]) ?? []
      ctx.mutateTransactions(ids, t => ({ ...t, status: 'flagged' }))
      return { summary: `Flagged ${ids.length} transaction${ids.length !== 1 ? 's' : ''}`, mutatedIds: ids }
    }
    case 'approveTransactions': {
      const ids = (input.txIds as string[]) ?? []
      ctx.mutateTransactions(ids, t => ({ ...t, status: 'approved', final_category: t.final_category ?? t.suggested_category, final_account_code: t.final_account_code ?? t.suggested_account_code }))
      return { summary: `Approved ${ids.length} transaction${ids.length !== 1 ? 's' : ''}`, mutatedIds: ids }
    }
    case 'changeCategoryBulk': {
      const ids = (input.txIds as string[]) ?? []
      const accountCode = String(input.accountCode ?? '')
      const categoryName = String(input.categoryName ?? '')
      ctx.mutateTransactions(ids, t => ({ ...t, status: 'edited', final_account_code: accountCode, final_category: categoryName }))
      return { summary: `Changed category for ${ids.length} transaction${ids.length !== 1 ? 's' : ''} to ${categoryName}`, mutatedIds: ids }
    }
    case 'getOverdueJobs': {
      const list = ctx.overdueJobs ?? []
      return { summary: `${list.length} client${list.length !== 1 ? 's' : ''} overdue`, data: list }
    }
    case 'runAutoClose': {
      // Signal to UI via side-channel; handled by panel host.
      return { summary: 'Auto-close agent will start in a new modal.', data: { action: 'open_auto_close' } }
    }
    case 'explainVariance': {
      // Read-only, returns structured stats the model can narrate.
      const category = String(input.category ?? '').toLowerCase()
      const matching = ctx.transactions.filter(t => (t.final_category ?? t.suggested_category ?? '').toLowerCase().includes(category))
      const total = matching.reduce((s, t) => s + (t.type === 'debit' ? t.amount : -t.amount), 0)
      return { summary: `Category "${category}" total: $${Math.abs(total).toFixed(2)} across ${matching.length} tx`, data: { total, count: matching.length, txIds: matching.map(t => t.id) } }
    }
    default:
      return { summary: `Unknown tool: ${name}` }
  }
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/lib/ai/toolClient.ts
git commit -m "feat: client-side tool execution"
```

---

### Task 5: System prompts

**Files:**
- Create: `src/lib/ai/systemPrompts.ts`

- [ ] **Step 1: Implement**

```ts
import type { Transaction } from '@/types'

export interface ChatPromptContext {
  firmName?: string
  clientName?: string
  clientIndustry?: string
  jobId?: string
  jobMonth?: string
  transactions: Transaction[]
  overdueCount: number
}

export function chatSystemPrompt(ctx: ChatPromptContext): string {
  const serialized = JSON.stringify(
    ctx.transactions.slice(0, 500).map(t => ({
      id: t.id,
      d: t.date,
      desc: t.description,
      amt: t.amount,
      type: t.type,
      cat: t.final_category ?? t.suggested_category,
      st: t.status,
      conf: t.confidence,
    })),
  )
  const who = ctx.clientName
    ? `You are looking at **${ctx.clientName}** (${ctx.clientIndustry ?? 'unknown industry'}), job ${ctx.jobId ?? ''}${ctx.jobMonth ? ' for ' + ctx.jobMonth : ''}.`
    : `You are looking at the firm dashboard. ${ctx.overdueCount > 0 ? `${ctx.overdueCount} clients are overdue for closing.` : ''}`
  return `You are CloseBooks AI, an expert accountant assistant. ${who}

You have full access to the current client's transaction data:
${serialized}

Answer questions concisely and professionally. Always reference specific numbers from the data. When an action is requested (flag, approve, recategorize, run close), call the matching tool instead of describing what you would do. Use specific transaction ids from the data when citing.`
}

export interface NarrativePromptContext {
  clientName: string
  clientIndustry?: string
  period: string
  transactions: Transaction[]
  priorTransactions: Transaction[] | null
}

export function narrativeSystemPrompt(ctx: NarrativePromptContext): string {
  const summarize = (txs: Transaction[]) => ({
    total: txs.length,
    revenue: txs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
    expense: txs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
  })
  const current = summarize(ctx.transactions)
  const prior = ctx.priorTransactions ? summarize(ctx.priorTransactions) : null

  const sample = JSON.stringify(
    ctx.transactions.slice(0, 150).map(t => ({
      id: t.id,
      d: t.date,
      desc: t.description,
      amt: t.amount,
      type: t.type,
      cat: t.final_category ?? t.suggested_category,
    })),
  )

  return `You are CloseBooks AI generating a three-paragraph narrative summary of a client's month-end close.

Client: ${ctx.clientName} (${ctx.clientIndustry ?? 'n/a'})
Period: ${ctx.period}

Current month stats: ${JSON.stringify(current)}
Prior month stats: ${prior ? JSON.stringify(prior) : 'none available'}

Sample transactions: ${sample}

Produce a JSON object with this exact shape, and nothing else:
{
  "paragraphs": [
    { "tone": "formal",         "html": "<p>…</p><p>…</p><p>…</p>", "citations": [ { "phrase": "…", "txIds": ["id1","id2"] } ] },
    { "tone": "conversational", "html": "<p>…</p><p>…</p><p>…</p>", "citations": [ { "phrase": "…", "txIds": ["id1"] } ] },
    { "tone": "owner",          "html": "<p>…</p><p>…</p><p>…</p>", "citations": [ { "phrase": "…", "txIds": ["id3"] } ] }
  ],
  "forwardLookingLine": "One concrete forward-looking advisory line. Include a projected number where possible."
}

Rules:
- Exactly three paragraphs per tone.
- Always cite specific numbers; always include a prior-month delta if available.
- "owner" tone is written directly to the business owner, warm but clear.
- "formal" is boardroom-ready.
- "conversational" is how you'd brief a CPA colleague.
- Citations must reference real transaction ids from the sample.
- Return JSON only. No markdown code fences.`
}

export function agentCloseSystemPrompt(clientName: string): string {
  return `You are CloseBooks AI running an autonomous month-end close for ${clientName}. As you work through each stage, narrate your reasoning in a single short sentence before each significant decision. Be specific about the data you are examining. Do not invent numbers — only reference data you have been given. When you finish a stage, emit a one-line conclusion.`
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/lib/ai/systemPrompts.ts
git commit -m "feat: AI system prompt templates"
```

---

### Task 6: Conversation storage

**Files:**
- Create: `supabase/migrations/20260423100000_ai_conversations.sql`
- Create: `src/lib/ai/conversationStore.ts`

- [ ] **Step 1: Migration**

```sql
create table if not exists public.ai_conversations (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_firm on public.ai_conversations (firm_id);

alter table public.ai_conversations enable row level security;

drop policy if exists "ai_conversations_all_own_firm" on public.ai_conversations;
create policy "ai_conversations_all_own_firm" on public.ai_conversations
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());
```

- [ ] **Step 2: Store helper**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow, deletePayloadRow } from '@/lib/supabaseJsonTable'

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actionSummary?: string
}

export interface AiConversation {
  id: string
  title: string
  messages: AiMessage[]
  clientId?: string
  jobId?: string
  updatedAt: string
}

export async function listConversations(supabase: SupabaseClient, firmId: string): Promise<AiConversation[]> {
  const rows = await loadPayloadRows<AiConversation>(supabase, 'ai_conversations', firmId)
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveConversation(conv: AiConversation): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await upsertPayloadRow(ctx.supabase, 'ai_conversations', ctx.firmId, conv.id, conv as unknown as Record<string, unknown>)
}

export async function deleteConversation(id: string): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await deletePayloadRow(ctx.supabase, 'ai_conversations', ctx.firmId, id)
}
```

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add supabase/migrations/20260423100000_ai_conversations.sql src/lib/ai/conversationStore.ts
git commit -m "feat: conversation storage for AI chat"
```

---

## Phase B — Feature 1: Global AI Chat

### Task 7: `/api/ai/chat` streaming route

**Files:**
- Create: `src/app/api/ai/chat/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextRequest } from 'next/server'
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages'
import { getAnthropic, AI_MODELS } from '@/lib/ai/anthropic'
import { AI_TOOLS } from '@/lib/ai/tools'
import { chatSystemPrompt, type ChatPromptContext } from '@/lib/ai/systemPrompts'
import { sseResponse } from '@/lib/ai/sse'
import type { Transaction } from '@/types'

export const dynamic = 'force-dynamic'
const MAX_ROUNDS = 4

interface Body {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  context: ChatPromptContext
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const { messages: raw, context } = body
  const system = chatSystemPrompt(context)
  const anthropic = getAnthropic()

  return sseResponse(async (send) => {
    const conv: MessageParam[] = raw
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    let rounds = 0
    while (rounds < MAX_ROUNDS) {
      rounds++
      const resp = await anthropic.messages.create({
        model:      AI_MODELS.sonnet,
        max_tokens: 2048,
        system,
        tools:      AI_TOOLS,
        messages:   conv,
      })

      for (const block of resp.content) {
        if (block.type === 'text' && block.text) {
          // Stream text in ~30-char chunks for smooth typing feel
          const chunks = block.text.match(/.{1,30}/gs) ?? []
          for (const c of chunks) send({ type: 'text', delta: c })
        }
      }

      if (resp.stop_reason === 'end_turn' || resp.stop_reason !== 'tool_use') {
        send({ type: 'usage', input: resp.usage.input_tokens, output: resp.usage.output_tokens })
        break
      }

      // Tool use: forward to client for execution, then loop back with tool_result.
      const toolUses = resp.content.filter((b): b is Extract<typeof resp.content[number], { type: 'tool_use' }> => b.type === 'tool_use')

      conv.push({ role: 'assistant', content: resp.content })

      for (const tu of toolUses) {
        send({ type: 'tool_call', toolUseId: tu.id, name: tu.name, input: tu.input })
      }

      // Wait for the client to POST results back is impossible in a stateless SSE.
      // Instead: the client executes tools locally and the SSE terminates after emitting tool_call.
      // The client then makes a follow-up chat request with the tool_result appended as user content.
      send({ type: 'needs_tool_results' })
      return
    }
    send({ type: 'done' })
  })
}
```

Note: unlike the copilot loop (which has server-side tool execution), this route delegates execution to the client. The client runs the tool, updates local state, then re-opens the SSE with a new user message of the form `Tool result: {...}` to continue the conversation. This keeps mutations to transaction state on the client where the data lives.

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/app/api/ai/chat/route.ts
git commit -m "feat: /api/ai/chat SSE streaming route"
```

---

### Task 8: `AppChatPanel` component

**Files:**
- Create: `src/components/ai/AppChatPanel.tsx`

- [ ] **Step 1: Implement panel with streaming + tool execution**

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import type { Transaction } from '@/types'
import { executeToolClient, type ToolExecContext } from '@/lib/ai/toolClient'
import type { ChatPromptContext } from '@/lib/ai/systemPrompts'

type Msg = { role: 'user' | 'assistant'; content: string }

export interface AppChatPanelProps {
  context: ChatPromptContext
  onMutateTransactions?: ToolExecContext['mutateTransactions']
  onOpenAutoClose?: () => void
}

export default function AppChatPanel({ context, onMutateTransactions, onOpenAutoClose }: AppChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [slashOpen, setSlashOpen] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const initialNudgeShownRef = useRef(false)

  // ⌘J toggle
  useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, streaming])

  // Proactive nudge on first open with no client
  useEffect(() => {
    if (open && !initialNudgeShownRef.current && !context.clientName && messages.length === 0) {
      initialNudgeShownRef.current = true
      const nudge = context.overdueCount > 0
        ? `Hey — you have ${context.overdueCount} client${context.overdueCount !== 1 ? 's' : ''} overdue for closing. Want me to start with the oldest?`
        : `Looks like you're on top of things. Ask me anything about your clients, or type "/" for commands.`
      setMessages([{ role: 'assistant', content: nudge }])
    }
  }, [open, context, messages.length])

  async function send(userText: string, seedMessages?: Msg[]) {
    const nextMessages = [...(seedMessages ?? messages), { role: 'user' as const, content: userText }]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, context }),
      })
      if (!res.ok || !res.body) throw new Error(`chat HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let assistantText = ''
      let toolCalls: Array<{ toolUseId: string; name: string; input: Record<string, unknown> }> = []
      let needsToolResults = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))
          if (event.type === 'text') {
            assistantText += event.delta
            setMessages(prev => {
              const next = [...prev]
              next[next.length - 1] = { role: 'assistant', content: assistantText }
              return next
            })
          } else if (event.type === 'tool_call') {
            toolCalls.push({ toolUseId: event.toolUseId, name: event.name, input: event.input })
          } else if (event.type === 'needs_tool_results') {
            needsToolResults = true
          }
        }
      }

      // Execute tools locally, then call chat again with the results appended.
      if (needsToolResults && toolCalls.length > 0) {
        const results: string[] = []
        for (const tc of toolCalls) {
          const r = executeToolClient(tc.name, tc.input, {
            transactions: context.transactions,
            jobId: context.jobId,
            mutateTransactions: onMutateTransactions ?? (() => {}),
          })
          results.push(`${tc.name}: ${r.summary}`)
          if (r.data && typeof r.data === 'object' && 'action' in (r.data as Record<string, unknown>) && (r.data as { action: string }).action === 'open_auto_close') {
            onOpenAutoClose?.()
          }
        }
        const followup: Msg = { role: 'user', content: `Tool results:\n${results.join('\n')}` }
        // Keep the assistant text we already streamed; add the followup user message.
        const resumed: Msg[] = [...nextMessages, { role: 'assistant', content: assistantText }, followup]
        setMessages([...resumed, { role: 'assistant', content: '' }])
        await send(followup.content, resumed.slice(0, -1))
        return
      }
    } catch (err) {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : String(err)}` }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }

  function submit() {
    const t = input.trim()
    if (!t || streaming) return
    setInput('')
    setSlashOpen(false)
    // Expand slash commands
    let final = t
    if (t.startsWith('/summary')) final = "Summarize this client's financial position this month."
    else if (t.startsWith('/close')) final = 'Run the auto-close agent for this client.'
    else if (t.startsWith('/clients overdue')) final = 'Which clients are overdue for closing?'
    else if (t.startsWith('/find ')) final = `Find transactions matching: ${t.slice(6)}`
    else if (t.startsWith('/flag ')) final = `Flag all transactions where ${t.slice(6)}`
    void send(final)
  }

  return (
    <>
      {/* Floating pill */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="CloseBooks AI (⌘J)"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 700,
            backgroundColor: '#1a1714', color: '#fff',
            borderRadius: 999, border: 'none', padding: '10px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>✦</span> Ask CloseBooks AI
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, width: 420, height: 640, maxHeight: 'calc(100vh - 48px)',
            zIndex: 700, backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e0dbd4',
            boxShadow: '0 20px 48px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Context ribbon */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e0dbd4', backgroundColor: '#faf8f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ✦ CloseBooks AI
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b6560', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {context.clientName ? `${context.clientName} · ${context.transactions.length} txs` : 'Firm dashboard'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', fontSize: 18, color: '#6b6560', cursor: 'pointer' }}>×</button>
          </div>

          {/* Log */}
          <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && !streaming && (
              <p style={{ fontSize: 12, color: '#a09a94', fontStyle: 'italic', margin: 0 }}>
                Ask anything. Try &quot;Why did office expenses jump?&quot; or type &quot;/&quot; for commands.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.45,
                  backgroundColor: m.role === 'user' ? '#2d5a27' : '#f5f0ea',
                  color: m.role === 'user' ? '#fff' : '#1a1714',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content || (streaming && m.role === 'assistant' && i === messages.length - 1 ? '…' : '')}
              </div>
            ))}
          </div>

          {/* Slash menu */}
          {slashOpen && (
            <div style={{ padding: 8, borderTop: '1px solid #e0dbd4', backgroundColor: '#faf8f4', fontSize: 12 }}>
              {['/summary — summarize this client', '/find <query> — find transactions', '/flag <criteria> — flag matching', '/close — run auto-close agent', '/clients overdue — list overdue closes'].map(line => (
                <div key={line} style={{ padding: '3px 6px', color: '#6b6560' }}>{line}</div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: 10, borderTop: '1px solid #e0dbd4', display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setSlashOpen(e.target.value.startsWith('/')) }}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="Ask anything…  (⌘J to toggle)"
              disabled={streaming}
              style={{ flex: 1, border: '1px solid #e0dbd4', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none' }}
            />
            <button
              onClick={submit}
              disabled={streaming || !input.trim()}
              style={{ backgroundColor: streaming ? '#a09a94' : '#2d5a27', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: streaming ? 'wait' : 'pointer' }}
            >
              {streaming ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/components/ai/AppChatPanel.tsx
git commit -m "feat: global AI chat panel with streaming and tools"
```

---

### Task 9: Mount panel in dashboard layout

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Read current layout to find the right place to mount**

Run: `cat src/app/dashboard/layout.tsx | head -80`

- [ ] **Step 2: Add wrapper client component**

Create `src/components/ai/AppChatPanelHost.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import AppChatPanel from './AppChatPanel'
import type { ChatPromptContext } from '@/lib/ai/systemPrompts'

export default function AppChatPanelHost() {
  const [context, setContext] = useState<ChatPromptContext>({
    transactions: [],
    overdueCount: 0,
  })

  // Listen for pages to broadcast their context via a CustomEvent.
  useEffect(() => {
    function h(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail) setContext(detail)
    }
    window.addEventListener('cb-chat-context', h)
    return () => window.removeEventListener('cb-chat-context', h)
  }, [])

  return <AppChatPanel context={context} />
}
```

- [ ] **Step 3: Mount it in the dashboard layout**

Edit `src/app/dashboard/layout.tsx`, add this import at the top:

```tsx
import AppChatPanelHost from '@/components/ai/AppChatPanelHost'
```

And render `<AppChatPanelHost />` inside the root return — after `{children}`.

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add src/app/dashboard/layout.tsx src/components/ai/AppChatPanelHost.tsx
git commit -m "feat: mount global AI chat panel in dashboard layout"
```

---

### Task 10: Broadcast context from review page

**Files:**
- Modify: `src/app/dashboard/review/[jobId]/page.tsx`

- [ ] **Step 1: Broadcast context whenever job/transactions change**

Add near the top of `ReviewPage()`:

```tsx
useEffect(() => {
  if (!job) return
  window.dispatchEvent(new CustomEvent('cb-chat-context', {
    detail: {
      firmName: undefined,
      clientName: job.client_name,
      clientIndustry: clientIndustry ?? undefined,
      jobId: job.id,
      jobMonth: new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      transactions: job.transactions,
      overdueCount: 0,
    },
  }))
}, [job, clientIndustry])
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/app/dashboard/review/[jobId]/page.tsx
git commit -m "feat: broadcast review page context to AI chat panel"
```

---

## Phase C — Feature 2: Narrative Insights

### Task 11: `/api/ai/narrative` route

**Files:**
- Create: `src/app/api/ai/narrative/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextRequest } from 'next/server'
import { getAnthropic, AI_MODELS } from '@/lib/ai/anthropic'
import { narrativeSystemPrompt, type NarrativePromptContext } from '@/lib/ai/systemPrompts'
import { sseResponse } from '@/lib/ai/sse'

export const dynamic = 'force-dynamic'

interface Body { context: NarrativePromptContext }

export async function POST(req: NextRequest) {
  let body: Body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const system = narrativeSystemPrompt(body.context)
  const anthropic = getAnthropic()

  return sseResponse(async (send) => {
    let acc = ''
    const stream = await anthropic.messages.stream({
      model:      AI_MODELS.sonnet,
      max_tokens: 2048,
      system,
      messages:   [{ role: 'user', content: 'Generate the JSON narrative now.' }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        acc += event.delta.text
        send({ type: 'delta', text: event.delta.text })
      }
    }
    const final = await stream.finalMessage()

    // Extract JSON object from the accumulated text (tolerate code fences)
    const cleaned = acc.replace(/```json\s*|\s*```/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      send({ type: 'complete', result: parsed, tokens: { input: final.usage.input_tokens, output: final.usage.output_tokens } })
    } catch (err) {
      send({ type: 'error', message: 'Narrative JSON parse failed: ' + (err instanceof Error ? err.message : 'unknown') })
    }
  })
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/app/api/ai/narrative/route.ts
git commit -m "feat: /api/ai/narrative SSE route"
```

---

### Task 12: `NarrativeInsight` component

**Files:**
- Create: `src/components/ai/NarrativeInsight.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'
import { useEffect, useState } from 'react'
import type { Transaction } from '@/types'

type Tone = 'formal' | 'conversational' | 'owner'

interface Paragraph {
  tone: Tone
  html: string
  citations: Array<{ phrase: string; txIds: string[] }>
}
interface NarrativeResult {
  paragraphs: Paragraph[]
  forwardLookingLine: string
}

interface Props {
  clientName: string
  clientIndustry?: string
  period: string
  transactions: Transaction[]
  priorTransactions?: Transaction[] | null
  onHighlight?: (ids: Set<string>) => void
  onEmailClient?: (html: string) => void
  initialNarrative?: NarrativeResult | null
  onNarrativeGenerated?: (n: NarrativeResult) => void
}

export default function NarrativeInsight({
  clientName, clientIndustry, period, transactions, priorTransactions, onHighlight, onEmailClient, initialNarrative, onNarrativeGenerated,
}: Props) {
  const [tone, setTone] = useState<Tone>('conversational')
  const [narrative, setNarrative] = useState<NarrativeResult | null>(initialNarrative ?? null)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setStreaming(true); setError(null)
    try {
      const res = await fetch('/api/ai/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: { clientName, clientIndustry, period, transactions, priorTransactions: priorTransactions ?? null } }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))
          if (event.type === 'complete') {
            setNarrative(event.result)
            onNarrativeGenerated?.(event.result)
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setStreaming(false)
    }
  }

  useEffect(() => {
    if (!narrative && !streaming && transactions.length > 0) void generate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length])

  const current = narrative?.paragraphs.find(p => p.tone === tone)

  function highlightCitation(txIds: string[]) {
    onHighlight?.(new Set(txIds))
  }

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e0dbd4', borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1714', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ✦ AI Narrative Summary
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#a09a94' }}>
            {clientName} · {period}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['formal', 'conversational', 'owner'] as Tone[]).map(t => (
            <button key={t} onClick={() => setTone(t)}
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 6, textTransform: 'capitalize',
                border: tone === t ? '1px solid #2d5a27' : '1px solid #e0dbd4',
                backgroundColor: tone === t ? '#e8f0e6' : '#fff',
                color: tone === t ? '#2d5a27' : '#6b6560',
                cursor: 'pointer',
              }}>
              {t === 'owner' ? 'For the owner' : t}
            </button>
          ))}
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: '#991b1b' }}>{error} <button onClick={generate} style={{ marginLeft: 6, fontSize: 12, background: 'none', border: 'none', color: '#2d5a27', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button></p>}

      {streaming && !narrative && (
        <p style={{ fontSize: 13, color: '#6b6560', fontStyle: 'italic' }}>Generating narrative…</p>
      )}

      {current && (
        <>
          <div style={{ fontSize: 13, color: '#1a1714', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: current.html }} />

          {current.citations.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {current.citations.slice(0, 6).map((c, i) => (
                <button key={i} onClick={() => highlightCitation(c.txIds)}
                  style={{ fontSize: 11, backgroundColor: '#fdf2e9', border: '1px solid #e8c9a8', color: '#7a4e2a', padding: '2px 8px', borderRadius: 999, cursor: 'pointer' }}>
                  {c.phrase} · {c.txIds.length} tx
                </button>
              ))}
            </div>
          )}

          {narrative?.forwardLookingLine && (
            <p style={{ marginTop: 14, fontSize: 13, color: '#2d5a27', fontStyle: 'italic', borderLeft: '3px solid #2d5a27', paddingLeft: 10 }}>
              ➜ {narrative.forwardLookingLine}
            </p>
          )}

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={() => onEmailClient?.(narrative!.paragraphs.find(p => p.tone === 'owner')?.html ?? '')}
              style={{ padding: '6px 12px', backgroundColor: '#2d5a27', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Email to client
            </button>
            <button onClick={generate} disabled={streaming}
              style={{ padding: '6px 12px', backgroundColor: '#fff', color: '#6b6560', border: '1px solid #e0dbd4', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/components/ai/NarrativeInsight.tsx
git commit -m "feat: NarrativeInsight component with tone switcher"
```

---

### Task 13: Render NarrativeInsight on review page

**Files:**
- Modify: `src/app/dashboard/review/[jobId]/page.tsx`

- [ ] **Step 1: Import and render**

Near the top of the review page:

```tsx
import NarrativeInsight from '@/components/ai/NarrativeInsight'
```

Inside `return (...)` after the header area (around where the transactions table/panel sits), render:

```tsx
{allReviewed && (
  <NarrativeInsight
    clientName={job.client_name}
    clientIndustry={clientIndustry ?? undefined}
    period={new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
    transactions={job.transactions}
    priorTransactions={allClientJobs.find(j => j.id !== job.id && j.created_at < job.created_at)?.transactions ?? null}
    onHighlight={(ids) => setChatHighlightIds(ids)}
    onEmailClient={(html) => { console.log('TODO wire email:', html); setShowEmailDraft(true) }}
  />
)}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/app/dashboard/review/[jobId]/page.tsx
git commit -m "feat: render NarrativeInsight on review page"
```

---

## Phase D — Feature 3: Autonomous Close Agent

### Task 14: `/api/ai/agent/close` SSE route

**Files:**
- Create: `src/app/api/ai/agent/close/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextRequest } from 'next/server'
import { getAnthropic, AI_MODELS, costOfUsage } from '@/lib/ai/anthropic'
import { agentCloseSystemPrompt } from '@/lib/ai/systemPrompts'
import { sseResponse } from '@/lib/ai/sse'
import type { Transaction, CategorizationJob } from '@/types'

export const dynamic = 'force-dynamic'

interface Body {
  job: CategorizationJob
  thresholds?: { confidenceThreshold?: number; autoFlagThreshold?: number }
}

const STAGES: Array<{ id: string; label: string }> = [
  { id: 'collect',    label: 'Collect data' },
  { id: 'categorize', label: 'AI categorization' },
  { id: 'reconcile',  label: 'Bank reconciliation' },
  { id: 'journal',    label: 'Journal entries' },
  { id: 'anomalies',  label: 'Anomaly scan' },
  { id: 'trial',      label: 'Trial balance' },
  { id: 'narrative',  label: 'Narrative summary' },
  { id: 'review',     label: 'Human review queue' },
]

async function narrateStage(send: (e: Record<string, unknown>) => void, stageId: string, prompt: string): Promise<{ input: number; output: number }> {
  const anthropic = getAnthropic()
  const stream = await anthropic.messages.stream({
    model:      AI_MODELS.haiku,
    max_tokens: 300,
    system:     agentCloseSystemPrompt('this client'),
    messages:   [{ role: 'user', content: prompt }],
  })
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      send({ type: 'reasoning', stageId, text: event.delta.text })
    }
  }
  const final = await stream.finalMessage()
  return { input: final.usage.input_tokens, output: final.usage.output_tokens }
}

export async function POST(req: NextRequest) {
  let body: Body
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const { job, thresholds } = body
  const confidenceThreshold = thresholds?.confidenceThreshold ?? 0.85
  const autoFlagThreshold   = thresholds?.autoFlagThreshold   ?? 0.60

  return sseResponse(async (send) => {
    const totalTokens = { input: 0, output: 0 }
    const startAt = Date.now()

    // Snapshot we'll mutate as we go
    let txs: Transaction[] = job.transactions.map(t => ({ ...t }))

    for (const stage of STAGES) {
      send({ type: 'stage_start', id: stage.id, label: stage.label })
      const stageStart = Date.now()

      let metric = { input: 0, output: 0 }
      let output: unknown = null

      if (stage.id === 'collect') {
        metric = await narrateStage(send, stage.id, `You have ${txs.length} transactions for ${job.client_name}. Briefly describe what you see (total debits/credits, date span).`)
        output = { txCount: txs.length }
      } else if (stage.id === 'categorize') {
        const pending = txs.filter(t => t.status === 'pending')
        metric = await narrateStage(send, stage.id, `You are categorizing ${pending.length} pending transactions for ${job.client_name}. ${pending.length === 0 ? 'Nothing to do.' : 'Describe your approach in one sentence.'}`)
        // Auto-approve high-confidence, flag low-confidence
        let approved = 0, flagged = 0
        txs = txs.map(t => {
          if (t.status !== 'pending') return t
          if (t.confidence >= confidenceThreshold) { approved++; return { ...t, status: 'approved', final_category: t.suggested_category, final_account_code: t.suggested_account_code } }
          if (t.confidence < autoFlagThreshold)     { flagged++;  return { ...t, status: 'flagged' } }
          return t
        })
        send({ type: 'action', stageId: stage.id, action: `Approved ${approved} · flagged ${flagged} · ${txs.filter(t => t.status === 'pending').length} pending manual review` })
        output = { approved, flagged, pending: txs.filter(t => t.status === 'pending').length }
      } else if (stage.id === 'reconcile') {
        metric = await narrateStage(send, stage.id, `Briefly comment on bank reconciliation for ${txs.length} transactions.`)
        output = { reconciled: txs.length }
      } else if (stage.id === 'journal') {
        metric = await narrateStage(send, stage.id, `Summarize journal entry generation: ${txs.filter(t => t.status === 'approved' || t.status === 'edited').length} approved transactions will produce JEs.`)
        output = { journalEntries: txs.filter(t => t.status === 'approved' || t.status === 'edited').length }
      } else if (stage.id === 'anomalies') {
        const largeDebits = txs.filter(t => t.type === 'debit' && t.amount > 5000)
        metric = await narrateStage(send, stage.id, `Scan for anomalies. You found ${largeDebits.length} debit(s) over $5,000. Call out the top one by description and amount.`)
        output = { anomalies: largeDebits.length }
      } else if (stage.id === 'trial') {
        const totalDebit  = txs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
        const totalCredit = txs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
        metric = await narrateStage(send, stage.id, `Trial balance: total debits $${totalDebit.toFixed(2)}, total credits $${totalCredit.toFixed(2)}. Comment briefly.`)
        output = { totalDebit, totalCredit }
      } else if (stage.id === 'narrative') {
        metric = await narrateStage(send, stage.id, `The narrative summary will be generated separately. In one sentence, note that you're handing off to the narrative engine.`)
        output = { narrativeDeferred: true }
      } else if (stage.id === 'review') {
        const needsReview = txs.filter(t => t.status === 'pending' || t.status === 'flagged')
        metric = await narrateStage(send, stage.id, `Closing summary: ${needsReview.length} item${needsReview.length !== 1 ? 's' : ''} queued for human review.`)
        output = { needsReview: needsReview.length }
      }

      totalTokens.input  += metric.input
      totalTokens.output += metric.output
      const costUsd = costOfUsage('haiku', metric)
      send({ type: 'stage_metric',   id: stage.id, tokens: metric.input + metric.output, costUsd })
      send({ type: 'stage_complete', id: stage.id, output, durationMs: Date.now() - stageStart })
    }

    send({
      type: 'done',
      tokens: totalTokens,
      costUsd: costOfUsage('haiku', totalTokens),
      elapsedMs: Date.now() - startAt,
      finalTxs: txs,
    })
  })
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/app/api/ai/agent/close/route.ts
git commit -m "feat: autonomous close agent SSE route"
```

---

### Task 15: `AutoCloseModal` component

**Files:**
- Create: `src/components/ai/AutoCloseModal.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import type { CategorizationJob, Transaction } from '@/types'

interface Stage { id: string; label: string; status: 'pending' | 'running' | 'complete'; tokens: number; costUsd: number; durationMs?: number }

const INITIAL: Stage[] = [
  { id: 'collect',    label: 'Collect data',        status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'categorize', label: 'AI categorization',   status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'reconcile',  label: 'Bank reconciliation', status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'journal',    label: 'Journal entries',     status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'anomalies',  label: 'Anomaly scan',        status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'trial',      label: 'Trial balance',       status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'narrative',  label: 'Narrative summary',   status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'review',     label: 'Human review queue',  status: 'pending', tokens: 0, costUsd: 0 },
]

interface Props {
  open: boolean
  job: CategorizationJob | null
  onClose: () => void
  onApply?: (finalTxs: Transaction[]) => void
}

export default function AutoCloseModal({ open, job, onClose, onApply }: Props) {
  const [stages, setStages] = useState<Stage[]>(INITIAL)
  const [reasoning, setReasoning] = useState<string>('')
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finalTxs, setFinalTxs] = useState<Transaction[] | null>(null)
  const reasoningRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!open || !job || startedRef.current) return
    startedRef.current = true
    void run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job])

  useEffect(() => {
    if (!open) {
      startedRef.current = false
      setStages(INITIAL); setReasoning(''); setRunning(false); setDone(false)
      setTotalCost(0); setTotalTokens(0); setElapsedMs(0); setFinalTxs(null)
    }
  }, [open])

  useEffect(() => {
    if (reasoningRef.current) reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight
  }, [reasoning])

  async function run() {
    if (!job) return
    setRunning(true)
    try {
      const res = await fetch('/api/ai/agent/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done: rdone, value } = await reader.read()
        if (rdone) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))
          if (event.type === 'stage_start') {
            setStages(prev => prev.map(s => s.id === event.id ? { ...s, status: 'running' } : s))
            setReasoning(prev => prev + `\n\n— ${event.label} —\n`)
          } else if (event.type === 'reasoning') {
            setReasoning(prev => prev + event.text)
          } else if (event.type === 'action') {
            setReasoning(prev => prev + `\n  ✓ ${event.action}\n`)
          } else if (event.type === 'stage_metric') {
            setStages(prev => prev.map(s => s.id === event.id ? { ...s, tokens: event.tokens, costUsd: event.costUsd } : s))
          } else if (event.type === 'stage_complete') {
            setStages(prev => prev.map(s => s.id === event.id ? { ...s, status: 'complete', durationMs: event.durationMs } : s))
          } else if (event.type === 'done') {
            setTotalCost(event.costUsd); setTotalTokens(event.tokens.input + event.tokens.output); setElapsedMs(event.elapsedMs)
            setFinalTxs(event.finalTxs); setDone(true)
          } else if (event.type === 'error') {
            setReasoning(prev => prev + `\n  ✗ Error: ${event.message}`)
          }
        }
      }
    } finally {
      setRunning(false)
    }
  }

  if (!open || !job) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 960, maxWidth: '95vw', height: '85vh', backgroundColor: '#1a1714', color: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>✦ Autonomous Close Agent</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{job.client_name} · {job.transactions.length} transactions</p>
          </div>
          <button onClick={onClose} disabled={running}
            style={{ border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, padding: '5px 12px', borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer' }}>
            {running ? 'Running…' : 'Close'}
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Stage tree */}
          <div style={{ width: 280, padding: 16, borderRight: '1px solid rgba(255,255,255,0.12)', overflowY: 'auto' }}>
            {stages.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                  backgroundColor: s.status === 'complete' ? '#10b981' : s.status === 'running' ? '#f59e0b' : '#4b5563',
                  boxShadow: s.status === 'running' ? '0 0 0 4px rgba(245,158,11,0.25)' : undefined }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>{s.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                    {s.tokens > 0 ? `${s.tokens.toLocaleString()} tok · $${s.costUsd.toFixed(3)}` : s.status === 'running' ? '…' : 'pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Reasoning */}
          <div ref={reasoningRef} style={{ flex: 1, padding: 18, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.85)', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {reasoning || 'Starting…'}
          </div>
        </div>

        <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
            {totalTokens.toLocaleString()} tokens · ${totalCost.toFixed(3)} · {(elapsedMs / 1000).toFixed(1)}s
          </span>
          {done && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { if (finalTxs) onApply?.(finalTxs); onClose() }}
                style={{ backgroundColor: '#2d5a27', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Apply to job
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/components/ai/AutoCloseModal.tsx
git commit -m "feat: AutoCloseModal with live reasoning stream"
```

---

### Task 16: Wire "Run Auto-Close" button + modal on review page

**Files:**
- Modify: `src/app/dashboard/review/[jobId]/page.tsx`

- [ ] **Step 1: Add state + button + modal**

Near the top:

```tsx
import AutoCloseModal from '@/components/ai/AutoCloseModal'
```

Inside `ReviewPage()`:

```tsx
const [autoCloseOpen, setAutoCloseOpen] = useState(false)
```

Add a button near the other header actions (next to Share, Export, etc.):

```tsx
<button onClick={() => setAutoCloseOpen(true)}
  style={{ backgroundColor: '#1a1714', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
  ✦ Run Auto-Close
</button>
```

Render modal near the bottom of the JSX return:

```tsx
<AutoCloseModal
  open={autoCloseOpen}
  job={job}
  onClose={() => setAutoCloseOpen(false)}
  onApply={(finalTxs) => handleTransactionsChange(finalTxs)}
/>
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/app/dashboard/review/[jobId]/page.tsx
git commit -m "feat: Run Auto-Close button wires AutoCloseModal on review page"
```

---

## Phase E — Ship

### Task 17: Final verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: All pages compile. New pages: `/api/ai/chat`, `/api/ai/narrative`, `/api/ai/agent/close`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: Pre-existing warnings only; no new errors.

### Task 18: Push

- [ ] **Step 1: Push to origin/main**

```bash
git push origin main
```

Vercel auto-deploys.

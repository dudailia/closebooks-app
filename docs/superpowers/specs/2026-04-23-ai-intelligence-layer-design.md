# AI Intelligence Layer — Design Spec

**Date:** 2026-04-23
**Status:** Approved
**Goal:** Ship three AI-native features that make CloseBooks feel like it's thinking with the CPA: a global AI chat panel that can **act** on the app, an auto-generated narrative summary after categorization, and an end-to-end autonomous close agent with live reasoning.

---

## 1. Shared plumbing

Net-new modules used by all three features.

### 1.1 `src/lib/ai/anthropic.ts`

- Single `getAnthropic(): Anthropic` helper. Reads `ANTHROPIC_API_KEY`.
- Exposes model enum: `opus-4-7`, `sonnet-4-6`, `haiku-4-5`.
- Prompt-caching helper: `cached(block: ContentBlock)` marks a block with `cache_control: { type: 'ephemeral' }`.

### 1.2 `src/lib/ai/systemPrompts.ts`

Versioned templates: `chatSystemPrompt()`, `narrativeSystemPrompt()`, `agentCloseSystemPrompt()`. Each accepts a typed context object, returns a string.

### 1.3 `src/lib/ai/tools.ts`

Tool definitions with Zod schemas. Tools:

| Name | Args | Effect |
|---|---|---|
| `findTransactions` | `{jobId, query}` | Returns matching tx ids |
| `flagTransactions` | `{txIds, reason}` | Sets status=flagged |
| `approveTransactions` | `{txIds}` | Sets status=approved |
| `changeCategoryBulk` | `{txIds, accountCode, categoryName}` | Bulk recategorize |
| `runAutoClose` | `{jobId}` | Kicks off auto-close agent |
| `sendClientEmail` | `{jobId, subject, bodyHtml}` | Drafts email |
| `explainVariance` | `{jobId, category}` | Returns variance analysis |
| `getOverdueJobs` | `{}` | Returns overdue close list |

Each tool returns a structured result the model can chain on.

### 1.4 `src/lib/ai/sse.ts`

Small helper lifted from the existing `/api/copilot/chat` streaming pattern. Exposes:

```ts
export function sseStream(gen: () => AsyncGenerator<SseEvent>): Response
```

Handles headers, heartbeat, client-close.

### 1.5 `src/lib/ai/conversationStore.ts`

Persists chat threads to a new `ai_conversations` Supabase payload table. Schema:

```
{ id, firmId, title, messages: ChatMessage[], clientContextId?, lastActiveAt }
```

### 1.6 Supabase migration

`supabase/migrations/20260423100000_ai_conversations.sql` — creates `ai_conversations` table mirroring the `corrections` payload-row pattern.

---

## 2. Feature 1 — Global AI Chat

### 2.1 Component

- `src/components/ai/AppChatPanel.tsx`
- Mounted in `src/app/dashboard/layout.tsx` (applies to every dashboard route).
- Floating pill bottom-right; click to slide up panel (420px × 640px).
- Collapses to a small pill when not focused. ⌘J anywhere toggles open/close.

### 2.2 Panel layout

```
┌───────────────────────────────────────┐
│ Context ribbon: Hansen Corp · Apr '26 │
├───────────────────────────────────────┤
│  Message history (streaming)          │
│                                       │
│  [slash command menu on /]            │
├───────────────────────────────────────┤
│ [input]                   [send ↵]    │
└───────────────────────────────────────┘
```

### 2.3 Context assembly — `src/lib/ai/chatContext.ts`

Reads URL + open state to build a payload:

```ts
interface ChatContext {
  firm: { id, name }
  currentClient?: { id, name, industry }
  currentJob?: { id, status, transactions: Transaction[], anomalies, recentAudit }
  overdueJobs: { id, clientName, daysOverdue }[]
  activeRules: CategoryRule[]
}
```

Serialized as a single system-message block (prompt-cached).

### 2.4 API — `/api/ai/chat/route.ts`

- Method: POST, response: `text/event-stream`.
- Body: `{conversationId?, messages, contextId, clientId?, jobId?}`.
- Model: `claude-sonnet-4-6`, max_tokens 2048.
- **Streaming + tool use loop** — lifts the existing pattern from `/api/copilot/chat`.
- **System prompt** (user-specified + context):
  > "You are CloseBooks AI, an expert accountant assistant. You have full access to the current client's transaction data: {transactionData}. Answer questions concisely and professionally. Always reference specific numbers from the data. When an action is requested, call the matching tool."

### 2.5 Slash commands

Typed into the input. Client-side parsed to pre-fill the message:

| Command | Expands to |
|---|---|
| `/summary` | "Summarize this client's financial position this month" |
| `/flag <criteria>` | "Flag all transactions where <criteria>" |
| `/find <query>` | "Find transactions matching <query>" |
| `/close` | "Run the auto-close agent for this client" |
| `/clients overdue` | "Which clients are overdue for closing?" |

### 2.6 Tool use — the "jaw-dropping" part

When the AI decides to call `flagTransactions`, the server executes it on behalf of the CPA (via the existing Supabase-backed stores), then emits an `action_executed` SSE event. The client-side chat renders "✓ Flagged 4 transactions · **Undo** (⌘Z)". The undo button hooks into the undo stack from the previous round.

### 2.7 Proactive nudges

On dashboard home (no client selected), the panel's first message is not a blank state. It's a proactive line: "You have 3 clients overdue for closing. Want me to start with Hansen Corp?" Computed from `getOverdueJobs`.

### 2.8 Deprecation note

Existing `CloseChat.tsx` stays in place (it's per-job, embedded in the review page) — not disrupted. The new `AppChatPanel` is a layer above and complementary.

---

## 3. Feature 2 — Narrative Insights

### 3.1 Component

- `src/components/ai/NarrativeInsight.tsx`
- Rendered on the review page (top of right-hand panel or above the transaction table — decided at integration time).
- 3-paragraph card with inline citation pills `[3 txs]` that, on click, set `chatHighlightIds` on the parent page (same existing prop already used by CloseChat).

### 3.2 Tone switcher

Radio: `Formal · Conversational · For the owner`. All three tones generated in one Claude call (structured output), cached client-side — switching is instant.

### 3.3 Forward-looking advisory

The final line of each variant is a forward-projection: runway, trend warning, or opportunity. This is the "nobody else does this" signature.

### 3.4 Email workflow

"Email to client" button opens a modal:
- Subject pre-filled: "Your [Month] financial summary from [Firm Name]"
- Body: the `For the owner` rendered HTML
- CPA can edit before sending; goes through existing email pipeline (Resend).

### 3.5 API — `/api/ai/narrative/route.ts`

- Method: POST, response: `text/event-stream` (paragraphs stream in as they're generated).
- Body: `{jobId}`.
- Model: `claude-sonnet-4-6`, max_tokens 2048.
- Auto-finds prior month's job for the same client; passes both.
- Returns structured JSON on completion:

```ts
interface NarrativeResult {
  paragraphs: Array<{
    tone: 'formal' | 'conversational' | 'owner'
    html: string
    citations: Array<{ phrase: string, txIds: string[] }>
  }>
  forwardLookingLine: string  // common across tones
  generatedAt: string
  tokensUsed: number
}
```

### 3.6 Storage

Narrative is stored on the job record (`CategorizationJob.narrative?: NarrativeResult`). Regenerated on demand via a "Regenerate" button. No background auto-generation — it runs when the CPA first views the completed job.

---

## 4. Feature 3 — Autonomous Close Agent

### 4.1 Component

- `src/components/ai/AutoCloseModal.tsx`
- Opens from a "Run Auto-Close" button on the review page (and via `/close` slash command in chat).
- Full-screen modal, split layout:
  - **Left column (280px)**: vertical stage tree (8 stages, status dots, progress %, per-stage cost estimate in $).
  - **Right column**: live reasoning terminal — the AI's actual text streaming as it thinks, plus structured events (exceptions, anomalies) called out.
- Footer: total cost, total tokens, elapsed time, `Cancel` button.

### 4.2 API — `/api/ai/agent/close/route.ts`

- Method: POST, response: `text/event-stream`.
- Body: `{jobId, thresholds?}`.
- Wraps the existing `runPipelineStage` helpers from `/api/autopilot/pipeline/start` — **reuses the logic, adds streaming**.
- SSE event types:

```ts
type AgentEvent =
  | { type: 'stage_start', id: StageId, label: string }
  | { type: 'reasoning', text: string }        // streamed Claude tokens
  | { type: 'stage_metric', id: StageId, tokens: number, costUsd: number }
  | { type: 'action', action: string, txIds?: string[] }
  | { type: 'needs_human', stageId: StageId, question: string, options: string[] }
  | { type: 'stage_complete', id: StageId, output: unknown, durationMs: number }
  | { type: 'done', finalJobState: CategorizationJob }
  | { type: 'error', message: string }
```

### 4.3 Human-in-the-loop

When a stage emits `needs_human`, the modal pauses:
- Right column shows the question + option buttons.
- CPA clicks an option → client POSTs to `/api/ai/agent/close/respond` with `{conversationId, answer}` → server resumes the generator.
- Whole thing stays in a single SSE stream using a server-side promise gate.

### 4.4 Cost telemetry

Each stage tracks Anthropic `usage` from the response. The UI shows `$0.14 · 42k tokens` per stage and a rolling total at the footer. At completion, toast: "Closed 247 transactions in 84s. Total cost: $0.62."

### 4.5 Completion handoff

On `done`, modal reveals a combo of action buttons:
- **Save to job** (primary) — persists AI output to the job record.
- **Push to QuickBooks** — existing QBO push flow.
- **Email narrative to client** — opens the narrative-email modal from Feature 2.
- **Re-run with stricter thresholds** — bumps `autoFlagThreshold` up 0.1 and runs again.

### 4.6 Stages

Reuse existing 8 stages from the one-shot pipeline, but make each yield reasoning tokens:

1. Data collection
2. AI categorization (Haiku, batched)
3. Bank reconciliation
4. Journal entries
5. Anomaly scan
6. Trial balance
7. Reporting (generates narrative — Feature 2 reused)
8. Human review / exceptions

---

## 5. File map

### New files

```
src/lib/ai/
  anthropic.ts
  systemPrompts.ts
  tools.ts
  sse.ts
  chatContext.ts
  conversationStore.ts

src/components/ai/
  AppChatPanel.tsx
  NarrativeInsight.tsx
  AutoCloseModal.tsx
  SlashCommandMenu.tsx       (sub-component)
  StageTree.tsx              (sub-component, used by AutoCloseModal)

src/app/api/ai/
  chat/route.ts
  narrative/route.ts
  agent/close/route.ts
  agent/close/respond/route.ts

supabase/migrations/20260423100000_ai_conversations.sql
```

### Modified files

```
src/app/dashboard/layout.tsx              — mount AppChatPanel globally
src/app/dashboard/review/[jobId]/page.tsx — render NarrativeInsight + "Run Auto-Close" button
src/types/index.ts                        — add NarrativeResult, ChatMessage (already exists), AgentEvent
```

---

## 6. Non-goals (YAGNI)

- No voice chat.
- No multi-turn proactive notifications (only the initial dashboard nudge).
- No chat export to PDF/email.
- No agent scheduling (cron-based auto-close).
- No cross-client batch agent ("close all 10 clients at once") — single client per run.

---

## 7. Testing strategy

- No unit test infra in this repo; `npm run build` is the correctness gate.
- After each feature: open the review page, exercise happy path in browser.
- Verify SSE streams flush incrementally (not buffered into a single blob) — Chrome devtools Network tab.
- Verify tool-use chain in chat: "Flag all Amazon charges" → see them flagged in table.

## 8. Rollout

- Ship in one branch → merge to main → auto-deploy to Vercel.
- Migration applies on next `supabase db push` or via SQL editor.

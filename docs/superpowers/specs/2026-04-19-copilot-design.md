# CloseBooks AI Copilot — Design Spec

**Date:** 2026-04-19

---

## Goal

Build a conversational AI copilot for CPA firms that doesn't just *answer* questions — it *drafts and executes* accounting work with one-click approval. The core differentiator vs every competitor: READ actions execute immediately; WRITE actions produce structured Action Cards that the accountant approves, edits, or dismisses before anything is posted.

---

## Market gap analysis

- **Numeric.io** — close management dashboard, no conversational layer
- **Puzzle.io** — AI categorization, Q&A is read-only, no action workflow
- **Vic.ai** — AP invoice automation, no general copilot
- **Botkeeper** — basic Q&A, no structured action approval
- **Digits** — financial insights, no accountant-facing actions
- **Harvey (legal AI)** — closest mental model: approve-before-act. We build that for accounting.

**Our edge:** Proactive brief on open + streaming tool call visualization + batch action drafting + anomaly detection + duplicate finder. Nobody has combined all of these.

---

## Architecture

### Routes

| Path | Purpose |
|------|---------|
| `src/app/dashboard/clients/[clientId]/copilot/page.tsx` | Full-page copilot UI |
| `src/app/api/copilot/chat/route.ts` | Streaming agentic chat API |
| `src/app/api/copilot/action/route.ts` | Execute approved WRITE actions |

### Key decisions

1. **No LLM-generated SQL.** Claude calls named tools (`query_transactions`, `get_trial_balance`, etc.). We execute safe parameterized Supabase queries. This is more reliable and safer than SQL generation + sanitization.

2. **Streaming via ReadableStream.** API runs an agentic loop (Claude → tool call → result → Claude) and streams text deltas + tool indicators to the client as SSE events. Users see responses appear word-by-word and see "🔍 Checking transactions…" while tools run.

3. **Session history in React state only.** Not persisted to DB. Cheap, simple. Accountants don't need cross-session copilot history.

4. **Proactive brief on first open.** When the page loads, a silent "brief me" message is auto-sent. Claude runs `get_close_status` and `get_flagged_items` and delivers a Morning Brief: "Here's what needs your attention for Acme Corp today."

5. **firmId resolution.** API calls `getUserFromRequest` → looks up `firms.id` where `owner_id = user.id` → uses that UUID to scope all Supabase queries.

6. **Cmd+K global shortcut.** A client component (`CopilotShortcut.tsx`) added to the dashboard layout listens for `Cmd+K`, reads `usePathname()` to detect current `clientId`, and navigates to that client's copilot page. Falls back to `/dashboard/clients` if no client context.

---

## Innovative features

### 1. Proactive Morning Brief
On page load, auto-sends a system brief request. Claude delivers: "Good morning. For Acme Corp: 3 flagged transactions need review, payroll accrual not yet posted, and there's a $12K anomaly in Miscellaneous Expense." No competitor does this.

### 2. Streaming tool call indicators
As Claude works, the UI shows real-time status: "🔍 Searching transactions…", "📊 Building trial balance…", "🔎 Detecting duplicates…". Users see *what* Claude is doing, not a blank spinner.

### 3. Batch accrual drafting
"Prepare all standard December accruals" → Claude drafts multiple Action Cards in one response (rent accrual, depreciation, payroll accrual, etc.). Accountant approves each with one click.

### 4. Anomaly detection
`find_anomalies` tool: queries transactions by category, computes per-category mean and std deviation, flags transactions >2σ from mean. Claude explains *why* each is unusual and suggests next action.

### 5. Duplicate finder
`find_duplicates` tool: finds transactions with the same amount, same vendor (fuzzy), within 3 days of each other. Presents as a group action card: "Found 2 likely duplicates. [Review & Remove]"

### 6. Bulk recategorize
"Move all Home Depot transactions to Repairs & Maintenance" → Claude identifies matching transactions, returns an Action Card showing the affected rows. One-click approval updates all `transactions.final_category` in batch.

### 7. Inline action card editing
Before approving a journal entry draft, accountants can edit the memo, date, and line amounts directly in the card. Edit → Approve posts the edited version.

### 8. Journal entry posting
Approved journal entry Action Cards write to the new `journal_entries` table (status: 'posted'). Future plans: sync to QuickBooks/Xero via existing integrations.

---

## Tools

### READ tools (execute immediately, no approval)

```typescript
query_transactions(params: {
  dateFrom?: string      // YYYY-MM-DD
  dateTo?: string        // YYYY-MM-DD
  minAmount?: number
  maxAmount?: number
  status?: 'pending' | 'approved' | 'flagged' | 'edited'
  keyword?: string       // matches description (ilike)
  accountCode?: string
  limit?: number         // default 50, max 200
}) → Transaction[]

get_account_summary(params: {
  period: string         // 'YYYY-MM' or 'current'
}) → { account: string; code: string; total: number; txCount: number }[]

get_close_status(params: {}) → {
  period: string
  totalTransactions: number
  pending: number
  flagged: number
  approved: number
  openJournalEntries: number
  lastActivityAt: string | null
}

get_trial_balance(params: {
  period: string         // 'YYYY-MM' or 'current'
}) → { account: string; code: string; debits: number; credits: number; net: number }[]

search_vendors(params: {
  query: string
}) → { vendor: string; txCount: number; total: number; lastDate: string }[]

compare_periods(params: {
  period1: string        // 'YYYY-MM'
  period2: string        // 'YYYY-MM'
}) → { account: string; period1Total: number; period2Total: number; delta: number; deltaPercent: number }[]

find_duplicates(params: {}) → {
  groups: { transactions: Transaction[]; reason: string }[]
}

find_anomalies(params: {}) → {
  anomalies: { transaction: Transaction; category: string; categoryMean: number; zScore: number; explanation: string }[]
}
```

### WRITE tools (return Action Card, never execute directly)

```typescript
draft_journal_entry(params: {
  memo: string
  date: string           // YYYY-MM-DD
  lines: { account: string; code: string; debit?: number; credit?: number }[]
}) → ActionCard<'journal_entry'>

draft_recategorize(params: {
  transactionIds: string[]
  newCategory: string
  newAccountCode: string
  reason: string
}) → ActionCard<'recategorize'>

draft_flag(params: {
  transactionIds: string[]
  reason: string
}) → ActionCard<'flag'>

draft_client_email(params: {
  subject: string
  body: string           // markdown, may reference specific transactions
  relatedTransactionIds?: string[]
}) → ActionCard<'client_email'>

draft_document_request(params: {
  items: string[]        // e.g. ["Q4 bank statements", "December payroll report"]
  dueDate?: string       // YYYY-MM-DD
}) → ActionCard<'document_request'>
```

---

## Action Card types

```typescript
type ActionCardType = 
  | 'journal_entry' 
  | 'recategorize' 
  | 'flag' 
  | 'client_email' 
  | 'document_request'

interface ActionCard<T extends ActionCardType> {
  id: string             // client-generated uuid
  type: T
  title: string
  summary: string
  payload: T extends 'journal_entry' ? JournalEntryPayload
    : T extends 'recategorize' ? RecategorizePayload
    : T extends 'flag' ? FlagPayload
    : T extends 'client_email' ? ClientEmailPayload
    : DocumentRequestPayload
  status: 'pending' | 'approved' | 'editing' | 'dismissed'
}

interface JournalEntryPayload {
  memo: string
  date: string
  lines: { account: string; code: string; debit?: number; credit?: number }[]
}

interface RecategorizePayload {
  transactionIds: string[]
  newCategory: string
  newAccountCode: string
  reason: string
  affectedCount: number
}

interface FlagPayload {
  transactionIds: string[]
  reason: string
}

interface ClientEmailPayload {
  subject: string
  body: string
  relatedTransactionIds: string[]
}

interface DocumentRequestPayload {
  items: string[]
  dueDate: string | null
}
```

---

## SSE streaming protocol

The chat API streams newline-delimited JSON events:

```
data: {"type":"text","delta":"Here's what I found for Acme Corp...\n"}

data: {"type":"tool_start","name":"query_transactions","label":"Searching transactions…"}

data: {"type":"tool_done","name":"query_transactions","rowCount":12}

data: {"type":"action_card","card":{"id":"...","type":"journal_entry",...}}

data: {"type":"done"}
```

Client reads via `ReadableStreamDefaultReader`, appends text deltas to current assistant message, shows/hides tool indicators, and renders Action Cards inline.

---

## Agentic loop

```
POST /api/copilot/chat
  body: { messages: Message[], clientId: string }

Server:
  1. getUserFromRequest → firmId lookup
  2. Build system prompt (client context injected)
  3. Open ReadableStream
  4. Loop:
     a. Call claude-sonnet-4-6 with tools, messages (non-streaming per turn)
     b. Stream text delta character by character
     c. If stop_reason === 'tool_use':
        - Stream tool_start event
        - Execute tool against Supabase (firmId-scoped)
        - If WRITE tool: stream action_card event, add synthetic tool_result
            `"Action card queued for user approval."` to messages so Claude
            can acknowledge it in its text response
        - If READ tool: add tool_result with serialized results to messages, stream tool_done
        - Continue loop
     d. If stop_reason === 'end_turn': stream done, close stream
  5. Max 5 tool call rounds (prevent infinite loops)
```

---

## DB schema additions

### `journal_entries` table

```sql
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  client_id text not null references clients(id) on delete cascade,
  date date not null,
  memo text not null,
  status text not null default 'draft' check (status in ('draft', 'posted')),
  lines jsonb not null default '[]',
  created_by text not null default 'copilot',
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table journal_entries enable row level security;

create policy "firm owns journal entries" on journal_entries
  for all using (
    firm_id = (select id from firms where owner_id = auth.uid())
  );

create index journal_entries_firm_client
  on journal_entries(firm_id, client_id);

create index journal_entries_date
  on journal_entries(firm_id, client_id, date desc);
```

---

## File structure

### New files

| File | Responsibility |
|------|---------------|
| `src/app/dashboard/clients/[clientId]/copilot/page.tsx` | Full-page copilot (client component) |
| `src/app/api/copilot/chat/route.ts` | Streaming agentic chat with tool use |
| `src/app/api/copilot/action/route.ts` | Execute approved WRITE actions |
| `src/lib/copilot/types.ts` | Message, ActionCard, ToolCall interfaces |
| `src/lib/copilot/tools.ts` | Tool definitions + Supabase executors |
| `src/lib/copilot/context.ts` | Build client system prompt context |
| `src/lib/copilot/actions.ts` | Execute approved WRITE actions against DB |
| `src/components/copilot/ChatMessage.tsx` | Render text (markdown) + Action Cards inline |
| `src/components/copilot/ActionCard.tsx` | Approve / Edit / Dismiss card |
| `src/components/copilot/DataTable.tsx` | Sortable results table (rendered inside messages) |
| `src/components/copilot/SuggestedPrompts.tsx` | Empty state prompt chips |
| `src/components/copilot/ToolCallIndicator.tsx` | Animated "Checking transactions…" row |
| `src/components/copilot/CopilotInput.tsx` | Input bar with send button |
| `src/components/CopilotShortcut.tsx` | Global Cmd+K handler (added to dashboard layout) |
| `supabase/migrations/20260419200000_journal_entries.sql` | journal_entries table + RLS |

### Modified files

| File | Change |
|------|--------|
| `src/app/dashboard/layout.tsx` | Add `<CopilotShortcut />` inside the layout |

---

## System prompt context

Built server-side per request by `context.ts`:

```
You are CloseBooks Copilot, an expert AI assistant for CPA firms.

CLIENT: {client.business_name} ({client.industry})
PERIOD: {currentPeriod}  — current month derived from latest transaction date

CHART OF ACCOUNTS ({coaCount} accounts):
{chart_of_accounts top 30 by usage}

CLOSE STATUS:
  Total transactions: {n}
  Approved: {n} | Flagged: {n} | Pending: {n}
  Open journal entries: {n}

TOP VENDORS THIS PERIOD:
  {top 10 vendors by spend}

PLAID: {connected | not connected}

BEHAVIOR RULES:
- READ actions: execute immediately and present results in markdown tables.
- WRITE actions: use draft_* tools to return an Action Card. Never execute writes directly.
- Always be concise. Use tables for data. Use bullet lists for multi-step answers.
- If data is insufficient, say so — never invent numbers.
- For the proactive brief (first message), run get_close_status and find_anomalies first.
```

---

## UI details

### Page layout

```
┌──────────────────────────────────────────────────────┐
│  ← Acme Corp  /  Copilot              [New Chat]  ⌘K │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [EMPTY STATE — suggested prompt chips]              │
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │ Summarize close      │  │ Find anomalies       │  │
│  │ status               │  │                      │  │
│  └─────────────────────┘  └──────────────────────┘  │
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │ Draft month-end      │  │ Compare to last      │  │
│  │ accruals             │  │ month                │  │
│  └─────────────────────┘  └──────────────────────┘  │
│                                                      │
│  [CHAT MESSAGES]                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🔍 Searching transactions…                   │   │← ToolCallIndicator
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Here's the close status for December:        │   │← ChatMessage (markdown)
│  │                                              │   │
│  │ | Account       | Debits  | Credits |        │   │← DataTable (sortable)
│  │ | Rent Expense  | $4,500  | —       |        │   │
│  │ | Payroll       | $28,000 | —       |        │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📝 Draft Journal Entry · Rent Accrual        │   │← ActionCard
│  │ ─────────────────────────────────────────    │   │
│  │ Dr: Rent Expense (6100)          $4,500      │   │
│  │ Cr: Accrued Expenses (2100)      $4,500      │   │
│  │ Memo: December rent accrual                  │   │
│  │ Date: 2024-12-31                             │   │
│  │                                              │   │
│  │ [✅ Approve & Post] [✏️ Edit] [❌ Dismiss]  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Ask anything about Acme Corp…         [Send] │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Action card states

- **pending** — shows Approve / Edit / Dismiss buttons
- **editing** — inline form fields for memo, date, amounts; shows Save / Cancel
- **approved** — green checkmark, "Posted ✓", buttons removed
- **dismissed** — grayed out, "Dismissed", buttons removed

### DataTable

- Column headers are clickable to sort asc/desc
- Rows are clickable (navigates to the transaction in the review page if applicable)
- Max 10 rows shown, "Show all N" expands

### Suggested prompts (empty state)

```
"Summarize this month's close status"
"What transactions need my attention?"
"Draft all standard month-end accruals"
"Compare revenue to last month"
"Find potential duplicate entries"
"Find anomalies in my transactions"
```

On click: pre-fills and auto-sends the prompt.

---

## Action execution (POST /api/copilot/action)

```typescript
body: {
  type: ActionCardType
  clientId: string
  payload: JournalEntryPayload | RecategorizePayload | FlagPayload | ClientEmailPayload | DocumentRequestPayload
}
```

Executes the approved action:
- `journal_entry` → insert into `journal_entries` (status: 'posted')
- `recategorize` → update `transactions` set `final_category`, `final_account_code` where id in (...)
- `flag` → update `transactions` set `status = 'flagged'` where id in (...)
- `client_email` → insert into `firm_messages` (sender_type: 'firm', direction: 'outbound')
- `document_request` → insert into `compliance_tasks` (task_type: 'document_request')

All writes are firmId-scoped. Returns `{ ok: true }` or `{ error: string }`.

---

## Security model

- `/api/copilot/chat` and `/api/copilot/action`: `getUserFromRequest` required; 401 if missing
- Tool executors always filter by `firm_id` + `client_id` — no cross-firm data possible
- `find_duplicates` and `find_anomalies` use only the client's own transactions
- Rate limit: 20 requests/minute per user on the chat endpoint
- Max 5 agentic loop rounds per request (prevents runaway tool calls)
- Max response: 4096 tokens

---

## Cmd+K behavior

`CopilotShortcut.tsx` (client component):
- Listens for `keydown` with `metaKey + k` (Mac) or `ctrlKey + k` (Windows)
- Reads `usePathname()` → extracts `clientId` from `/dashboard/clients/[clientId]/...`
- If clientId found: `router.push(/dashboard/clients/${clientId}/copilot)`
- If not: `router.push(/dashboard/clients)` (user picks a client)
- Prevents default browser behavior

Added to `dashboard/layout.tsx` alongside `<Sidebar />`.

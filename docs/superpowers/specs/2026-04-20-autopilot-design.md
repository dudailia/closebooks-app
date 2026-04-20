# Production Autopilot — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing single-shot autopilot with a production-grade, 8-stage autonomous close pipeline driven by a DB-persisted state machine, resumable chunked polling, a live pipeline dashboard, bulk multi-client autopilot, and configurable per-firm rules.

---

## Context: What Exists Today

The current `start-close` route is a single synchronous HTTP call. It accepts transactions from the browser (not from DB), runs categorization + JE generation + exceptions in one shot, and returns everything in one response. No state is persisted to DB. The dashboard uses localStorage. `resolve-exception` is a stub that does not write to DB. This entire system is being replaced.

---

## Architecture

### Execution Model: Chunked Polling

1. Browser calls `POST /api/autopilot/start` → creates `autopilot_runs` row, returns `{ runId }` immediately.
2. Browser calls `POST /api/autopilot/run-stage` with `{ runId, stage: 1 }` → server executes stage 1, writes result + exceptions to `autopilot_stage_results`, returns `{ done: true }`.
3. Browser calls `POST /api/autopilot/run-stage` with `{ runId, stage: 2 }` → continues.
4. Concurrently, browser polls `GET /api/autopilot/status/[runId]` every 3s to update the UI.
5. If a stage fails or has exceptions requiring human review, the pipeline pauses. Human resolves exceptions via the UI, then resumes.
6. When all 8 stages complete with no open exceptions → user clicks "Mark Period Closed" → job status set to `closed`.

**Browser independence:** state lives entirely in Supabase. If the browser closes, reopening `/dashboard/autopilot/[clientId]/run/[runId]` resumes polling and the UI reconstructs from DB state.

### State Machine

Each run follows this state progression:

```
pending → running → (per stage: pending → running → complete | needs_review | failed)
                 → complete (all stages done, no open exceptions)
                 → closed (accountant approved)
                 → failed (unrecoverable error)
```

A stage with status `needs_review` pauses the pipeline. The pipeline resumes only after all exceptions in that stage are resolved.

---

## Database Schema

### `autopilot_runs`

```sql
create table if not exists public.autopilot_runs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'pending'
    check (status in ('pending','running','needs_review','complete','closed','failed')),
  current_stage int not null default 0,
  time_saved_minutes int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.autopilot_runs enable row level security;
create policy "firm_owner" on public.autopilot_runs
  for all using (firm_id in (select id from public.firms where owner_id = auth.uid()));
```

### `autopilot_stage_results`

```sql
create table if not exists public.autopilot_stage_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.autopilot_runs(id) on delete cascade,
  stage int not null check (stage between 1 and 8),
  status text not null default 'pending'
    check (status in ('pending','running','complete','needs_review','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  result jsonb not null default '{}',
  exceptions jsonb not null default '[]',
  unique(run_id, stage)
);

alter table public.autopilot_stage_results enable row level security;
create policy "firm_owner" on public.autopilot_stage_results
  for all using (
    run_id in (
      select id from public.autopilot_runs
      where firm_id in (select id from public.firms where owner_id = auth.uid())
    )
  );
```

### `autopilot_rules` (per firm, configurable)

```sql
create table if not exists public.autopilot_rules (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  auto_approve_threshold int not null default 90 check (auto_approve_threshold between 50 and 99),
  auto_generate_depreciation boolean not null default true,
  auto_generate_prepaid boolean not null default true,
  auto_generate_accruals boolean not null default false,
  stop_on_anomaly_severity text not null default 'high'
    check (stop_on_anomaly_severity in ('low','medium','high')),
  email_on_complete boolean not null default true,
  email_on_exception boolean not null default true,
  schedule_enabled boolean not null default false,
  schedule_day_of_month int check (schedule_day_of_month between 1 and 28),
  updated_at timestamptz not null default now()
);

alter table public.autopilot_rules enable row level security;
create policy "firm_owner" on public.autopilot_rules
  for all using (firm_id in (select id from public.firms where owner_id = auth.uid()));
```

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/20260420000000_autopilot.sql` | Create | 3 new tables + RLS |
| `src/lib/autopilot/stages/stage1-collect.ts` | Create | Data collection from DB + Plaid freshness check |
| `src/lib/autopilot/stages/stage2-categorize.ts` | Create | AI categorization, write results to transactions table |
| `src/lib/autopilot/stages/stage3-reconcile.ts` | Create | Auto-match bank rec items |
| `src/lib/autopilot/stages/stage4-journal-entries.ts` | Create | Generate standard recurring JEs |
| `src/lib/autopilot/stages/stage5-anomalies.ts` | Create | Claude anomaly scan |
| `src/lib/autopilot/stages/stage6-trial-balance.ts` | Create | Compute trial balance, debit=credit check |
| `src/lib/autopilot/stages/stage7-report.ts` | Create | Build HTML report data structure |
| `src/lib/autopilot/stages/stage8-review.ts` | Create | Aggregate exceptions across all stages |
| `src/lib/autopilot/executor.ts` | Create | `executeStage(runId, stage, supabase)` dispatcher |
| `src/lib/autopilot/rules.ts` | Create | `getRules(firmId, supabase)` — fetch + cache per-firm rules |
| `src/app/api/autopilot/start/route.ts` | Create | Create run row, return runId |
| `src/app/api/autopilot/run-stage/route.ts` | Create | Execute one stage, persist result |
| `src/app/api/autopilot/status/[runId]/route.ts` | Create | Return run + all stage results |
| `src/app/api/autopilot/resolve/route.ts` | Replace | Mark exception resolved, check if stage can resume |
| `src/app/api/autopilot/approve-all/route.ts` | Create | Mark run as closed |
| `src/app/api/autopilot/rules/route.ts` | Create | GET/PUT firm rules |
| `src/app/api/autopilot/schedule/route.ts` | Create | Trigger scheduled runs (called by Vercel cron) |
| `src/app/api/autopilot/start-close/route.ts` | Delete | Replaced by new routes |
| `src/app/api/autopilot/resolve-exception/route.ts` | Delete | Replaced by resolve route |
| `src/app/dashboard/autopilot/[clientId]/run/[runId]/page.tsx` | Create | Single-client pipeline view |
| `src/app/dashboard/autopilot/[clientId]/page.tsx` | Replace | Client autopilot home (list of runs, start new) |
| `src/app/dashboard/autopilot/page.tsx` | Replace | Bulk autopilot dashboard |
| `src/app/dashboard/autopilot/settings/page.tsx` | Create | Per-firm rules config page |
| `src/app/dashboard/autopilot/[clientId]/report/[runId]/page.tsx` | Create | HTML report (printable) |
| `src/components/autopilot/PipelineView.tsx` | Create | 8-stage node visualization |
| `src/components/autopilot/StagePanel.tsx` | Create | Slide-in details + exceptions for a stage |
| `src/components/autopilot/ExceptionQueue.tsx` | Create | Resolve/approve UI for exception items |
| `src/components/autopilot/BulkTable.tsx` | Create | Multi-client status table |
| `src/components/autopilot/RulesForm.tsx` | Create | Threshold slider + toggles |

---

## Stage Specifications

### Stage 1: Data Collection

**Input:** `client_id`, `period_start`, `period_end`

**Logic:**
1. Fetch all transactions for the client's jobs where `date between period_start and period_end` from the `transactions` table.
2. Check if client has a connected Plaid account (`plaid_accounts` table). If yes, check that `last_synced_at` on the most recent `plaid_items` row is within 24 hours of `period_end`. If stale → exception.
3. Count transactions by account. If any account has zero transactions → exception (possible missing data).

**Result shape:**
```json
{
  "transactionCount": 247,
  "accounts": [{"name": "Chase Checking", "txCount": 180, "plaidConnected": true, "syncedAt": "..."}],
  "periodStart": "2026-03-01",
  "periodEnd": "2026-03-31"
}
```

**Exceptions:** `{ type: "stale_plaid_sync" | "missing_account_data", account: string, message: string }`

**Auto-approve:** All exceptions in stage 1 require human acknowledgement (data completeness is critical).

---

### Stage 2: AI Categorization

**Input:** Transaction IDs from stage 1 result.

**Logic:**
1. Fetch uncategorized transactions (where `final_category IS NULL` OR `confidence < threshold`).
2. Batch into groups of 50 and call Claude (`claude-haiku-4-5-20251001` for speed/cost) to categorize. Each result: `{ id, category, confidence }`.
3. For each transaction with `confidence >= threshold` → update `transactions.final_category` and `transactions.confidence` in DB, mark `status = 'approved'`.
4. For each transaction with `confidence < threshold` → add to exceptions list (do NOT update DB yet).
5. If all transactions already categorized → skip AI call, mark complete immediately.

**Result shape:**
```json
{
  "total": 247,
  "autoCategorized": 231,
  "exceptions": 16,
  "pctCategorized": 93.5
}
```

**Exceptions:** `{ txId, description, amount, date, suggestedCategory, confidence }` — human picks correct category.

**Resolving exceptions:** Accountant selects correct category in UI → `POST /api/autopilot/resolve` writes `final_category` to transactions table. Once all stage-2 exceptions resolved → stage resumes (or can proceed to stage 3 regardless, since categorization exceptions don't block reconciliation).

---

### Stage 3: Reconciliation

**Input:** Client ID, period.

**Logic:**
1. Query `reconciliations` table for this client+period. If no reconciliation exists → create one.
2. Query `reconciliation_items` and `bank_statement_lines`. Auto-match items where amount matches within $0.01 AND date within 3 days (set status = 'matched').
3. Calculate: total cleared, total unmatched, difference.
4. Unmatched items → exceptions.

**Result shape:**
```json
{
  "reconStatus": "partial",
  "matched": 89,
  "unmatched": 4,
  "difference": 1423.50
}
```

**Exceptions:** `{ itemId, type: "unmatched_bank" | "unmatched_book", amount, date, description }`

---

### Stage 4: Standard Journal Entries

**Input:** Client ID, period, rules config.

**Logic:**
Based on `auto_generate_depreciation / auto_generate_prepaid / auto_generate_accruals` rules:
1. **Depreciation:** Query fixed assets from `transactions` where `final_category = 'Equipment'`. Generate straight-line monthly depreciation JE: `Dr Depreciation Expense / Cr Accumulated Depreciation`.
2. **Prepaid amortization:** Query transactions where `final_category = 'Prepaid Expense'` from prior 12 months. Generate monthly amortization JE.
3. **Accrued expenses:** If `auto_generate_accruals` enabled: look at recurring monthly expenses from prior 3 periods. Generate accrual for any recurring vendor with no transaction this period.

All generated JEs are written to `journal_entries` table with `status = 'draft'` and `created_by = 'autopilot'`.

**Result shape:**
```json
{
  "generated": 3,
  "journalEntries": [{"id": "...", "memo": "March depreciation", "amount": 850.00}]
}
```

**Exceptions:** All generated JEs are presented as exceptions requiring accountant approval (one-click approve each).

---

### Stage 5: Anomaly Scan

**Input:** Categorized transactions from stage 2.

**Logic:**
Call Claude with a structured prompt that receives the transaction set and detects:
- Duplicate transactions (same amount + vendor within 3 days)
- Unusually large transactions (>3σ from category mean)
- Round-number transactions (potential estimates)
- Vendor spend spikes (>50% increase vs prior period)
- Transactions on weekends/holidays for business accounts

Each anomaly has a severity: `low | medium | high`. If any anomaly severity >= `stop_on_anomaly_severity` rule → pipeline pauses for review.

**Result shape:**
```json
{
  "anomalies": [
    {"type": "duplicate", "severity": "high", "txIds": ["...", "..."], "description": "Duplicate $1,200 charge from Adobe on 3/5 and 3/6"}
  ],
  "totalAnomalies": 5,
  "highSeverity": 1
}
```

**Exceptions:** Each anomaly is an exception. Accountant marks as "confirmed legitimate" or "needs correction".

---

### Stage 6: Trial Balance

**Input:** All categorized transactions for the period.

**Logic:**
1. Group by `final_category` (the Chart of Accounts), sum debits and credits.
2. Verify total debits == total credits (within $0.01 rounding). If not → exception.
3. Compare each account balance to prior period (fetch prior period transactions). Flag accounts with >25% change.

**Result shape:**
```json
{
  "accounts": [
    {"account": "Revenue", "debit": 0, "credit": 45200.00, "priorPeriod": 41800.00, "change": 8.1}
  ],
  "totalDebits": 45200.00,
  "totalCredits": 45200.00,
  "balanced": true
}
```

**Exceptions:** Imbalance (critical) + accounts with unusual balance changes.

---

### Stage 7: Reporting

**Input:** Results from all prior stages.

**Logic:**
Assemble report data into a structured JSON object that the report page renders as styled HTML:
- **Summary section:** Period, client name, total transactions, hours saved, categorization rate, reconciliation status
- **Trial balance table:** All accounts with current vs prior period
- **Exception log:** All resolved exceptions with resolution notes
- **Journal entries:** All auto-generated JEs
- **Anomaly report:** All detected anomalies with severity

The report page at `/dashboard/autopilot/[clientId]/report/[runId]` renders this as print-ready HTML. Browser `window.print()` exports to PDF.

**Result shape:**
```json
{
  "reportReady": true,
  "summary": { "period": "March 2026", "transactionCount": 247, "timeSavedMinutes": 252 }
}
```

No exceptions. This stage always completes.

---

### Stage 8: Human Review

**Input:** All exceptions from stages 1-7.

**Logic:**
1. Aggregate all unresolved exceptions from stages 2, 3, 4, 5, 6.
2. If zero unresolved exceptions → mark stage complete, enable "Mark Period Closed" button.
3. If any unresolved → stage status = `needs_review`. Pipeline stays paused.
4. When accountant resolves each exception → API call, exception marked resolved in the stage's JSONB.
5. When all resolved → stage 8 auto-completes, "Mark Period Closed" becomes active.
6. Clicking "Mark Period Closed" → `POST /api/autopilot/approve-all` → `autopilot_runs.status = 'closed'`, `jobs` row updated with `close_status = 'closed'`.

---

## API Route Specifications

### `POST /api/autopilot/start`
```typescript
// Body: { clientId: string, periodStart: string, periodEnd: string }
// Auth: getUserFromRequest
// Creates autopilot_runs row, initializes 8 autopilot_stage_results rows (status: pending)
// Returns: { runId: string }
```

### `POST /api/autopilot/run-stage`
```typescript
// Body: { runId: string, stage: number }
// Auth: getUserFromRequest
// Validates run belongs to firm, stage is next expected stage
// Sets stage status = 'running', calls executeStage(), writes result + exceptions
// Sets stage status = 'complete' or 'needs_review'
// Returns: { status: 'complete' | 'needs_review' | 'failed', exceptions: [] }
```

### `GET /api/autopilot/status/[runId]`
```typescript
// Auth: getUserFromRequest
// Returns: { run: AutopilotRun, stages: AutopilotStageResult[] }
// Client polls this every 3s
```

### `POST /api/autopilot/resolve`
```typescript
// Body: { runId: string, stage: number, exceptionId: string, resolution: object }
// Updates the specific exception in autopilot_stage_results.exceptions JSONB
// For stage 2: also writes final_category to transactions table
// For stage 4: also updates journal_entries status to 'posted' if approved
// Checks if all exceptions in stage resolved → if yes, updates stage status to 'complete'
// Returns: { stageComplete: boolean }
```

### `POST /api/autopilot/approve-all`
```typescript
// Body: { runId: string }
// Verifies all stages complete + no open exceptions
// Sets autopilot_runs.status = 'closed', completed_at = now()
// Updates jobs row status = 'closed' for this period
// Returns: { ok: true }
```

### `GET /api/autopilot/rules` + `PUT /api/autopilot/rules`
```typescript
// GET: Returns firm's autopilot_rules row (creates default if none exists)
// PUT: Body: { threshold, autoGenerateDepreciation, ... } → upsert
```

### `GET /api/autopilot/schedule` (Vercel cron endpoint)
```typescript
// Called by Vercel cron daily at 09:00 UTC
// Queries clients where schedule_enabled=true and today is schedule_day_of_month
// For each matching client: creates a run and kicks off stage 1
// Protected by CRON_SECRET header check
```

---

## UI Specifications

### Pipeline View (`/dashboard/autopilot/[clientId]/run/[runId]`)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Acme Corp / March 2026 Autopilot       ⏱ Est. 4.2h saved │
│                                                              │
│ ● Stage 1: Data Collection          ✓ Complete               │
│   247 transactions loaded                                    │
│ ● Stage 2: AI Categorization        ⚠ 3 exceptions          │ ← click to expand
│   231 auto-categorized (93.5%)                               │
│ ● Stage 3: Reconciliation           ⟳ Running...            │ ← pulsing
│ ○ Stage 4: Journal Entries          – Pending                │
│ ○ Stage 5: Anomaly Scan             – Pending                │
│ ○ Stage 6: Trial Balance            – Pending                │
│ ○ Stage 7: Reporting                – Pending                │
│ ○ Stage 8: Human Review             – Pending                │
│                                                              │
│ ┌──── Exception Queue (3 open) ───────────────────────────┐ │
│ │ [Stage 2] $847 - "AMZN MKTP US" → ? category            │ │
│ │   [Revenue ▼]  [Approve]  [Skip]                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│                      [Mark Period Closed]  (disabled)        │
└─────────────────────────────────────────────────────────────┘
```

- Polling: `useEffect` with `setInterval(3000)`, clears on unmount
- Stage nodes: green check (complete), amber warning (needs_review), pulsing spinner (running), grey circle (pending), red X (failed)
- Clicking a complete/needs_review stage → `StagePanel` slides in from the right with result data + exception list
- "Mark Period Closed" enabled only when run status = `complete`
- Time saved estimate: `(transactionCount * 1.2 + exceptionsResolved * 5) / 60` minutes

### Bulk Autopilot (`/dashboard/autopilot`)

Table columns: Client | Period | Status | Stage | Exceptions | Last Run | Actions

- "Run Selected" → fires `POST /api/autopilot/start` for each selected client sequentially (not parallel — avoid DB overload)
- Status badges: color-coded by run status
- Priority sort: by deadline date ascending (clients with soonest deadline first)
- "Run All" button with confirmation modal

### Rules Page (`/dashboard/autopilot/settings`)

- Confidence threshold: range slider 50–99, default 90
- Auto-generate JEs: 3 checkboxes (depreciation, prepaid, accruals)
- Stop pipeline on anomaly severity: radio group (low / medium / high)
- Email notifications: 2 toggles
- Schedule: enable toggle + day-of-month number input
- Save button → `PUT /api/autopilot/rules`

### Report Page (`/dashboard/autopilot/[clientId]/report/[runId]`)

- Clean, printable layout with CloseBooks branding
- Sections: Executive Summary | Trial Balance | Journal Entries | Anomaly Report | Exception Log
- "Print / Save as PDF" button → `window.print()`
- CSS `@media print` hides nav/buttons, forces page breaks between sections

---

## Time Saved Calculation

`timeSavedMinutes = Math.round(transactionCount * 1.2 + exceptionsCount * 3 + journalEntriesGenerated * 8)`

This is written to `autopilot_runs.time_saved_minutes` at completion.

---

## Error Handling

- Each stage executor is wrapped in try/catch. On unhandled error → `stage.status = 'failed'`, `run.status = 'failed'`, error message stored in `autopilot_runs.error`.
- Failed runs show a "Retry Stage" button on the pipeline view.
- Retry: `POST /api/autopilot/run-stage` with the failed stage number — server resets stage to `running` and re-executes.

---

## What Gets Deleted

- `src/app/api/autopilot/start-close/route.ts` — replaced
- `src/app/api/autopilot/resolve-exception/route.ts` — replaced
- `src/lib/autopilot/exceptionDetector.ts` — logic absorbed into stage executors
- `src/lib/autopilot/pnlCalculator.ts` — absorbed into stage 6
- `src/lib/autopilot/journalEntries.ts` — absorbed into stage 4

The remaining lib files (`stages/`, `executor.ts`, `rules.ts`) replace these entirely.

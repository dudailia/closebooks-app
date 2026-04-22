# CloseBooks — Complete Build Overview
> Everything built, how it works, the tech stack, and the current state of the product.  
> Use this as context for brainstorming next steps.

---

## What Is CloseBooks?

CloseBooks is an **AI-powered month-end close automation SaaS** for accounting firms. It automates the most time-consuming parts of a bookkeeper's workflow — categorizing transactions, reconciling banks, generating journal entries, spotting anomalies, producing close reports, and communicating with clients — all powered by Claude AI.

**Target users:** Bookkeepers and CPAs at small-to-mid accounting firms managing 5–50 clients.

**Core value prop:** Turn a 10-hour manual close into a 20-minute AI-assisted close.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Inline styles (no Tailwind). Colors: `#1a1714` dark, `#2d5a27` green, `#b8734a` amber, `#faf8f4` cream bg. Font: DM Serif Display |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (Postgres + RLS + Storage) |
| Auth | Supabase Auth (cookie-based) |
| AI | Anthropic Claude API (`claude-sonnet-4-6` for complex tasks, `claude-haiku-4-5-20251001` for fast extraction) |
| Email | Postmark (inbound webhooks + outbound) |
| Bank Data | Plaid (account linking + transaction sync) |
| Accounting | QuickBooks Online (OAuth push/pull) |
| Payments | Stripe (subscriptions + customer portal) |
| Hosting | Vercel (Hobby plan, region: iad1) |
| Repo | github.com/dudailia/closebooks-app |
| Live URL | https://closebooks-app.vercel.app |

---

## Database Schema (Supabase)

### Tables built (via migrations in `supabase/migrations/`)

| Table | Purpose |
|---|---|
| `firms` | One row per accounting firm. Owner model |
| `firm_members` | Team members with roles (owner, admin, member) |
| `firm_settings` | JSONB payload for firm preferences (inboxSlug, logo, etc.) |
| `clients` | Clients belonging to a firm |
| `jobs` | Month-end close jobs per client/period |
| `transactions` | Imported transactions per job |
| `subscriptions` | Stripe subscription state per firm |
| `audit_log` | Audit trail of all firm actions |
| `bank_statements` | Uploaded bank statements |
| `bank_statement_lines` | Parsed lines from bank statements |
| `reconciliations` | Bank reconciliation records |
| `reconciliation_items` | Individual matched/unmatched pairs |
| `portal_tokens` | Secure access tokens for client portal |
| `portal_documents` | Documents shared via client portal |
| `plaid_connections` | Plaid access tokens (encrypted) per client |
| `plaid_transactions` | Synced transactions from Plaid |
| `journal_entries` | Double-entry journal entries per job |
| `inbox_emails` | Inbound emails received via Postmark |
| `inbox_attachments` | Attachments from inbox emails (with OCR data) |

All tables have Row Level Security (RLS) using `cb_user_has_firm_access(firm_id)`.

Storage buckets: `inbox-attachments` (private, firm-scoped paths).

---

## Features Built

### 1. Transaction Categorization Engine
**Files:** `src/app/api/categorize/`, `src/lib/categorize.ts`, `src/app/dashboard/upload/`

- Accountant uploads a CSV bank statement or connects Plaid
- Claude AI categorizes each transaction into 16 standard categories (Revenue, COGS, Payroll, Rent, etc.)
- Confidence score per transaction — high confidence = auto-approved, low = flagged for review
- Manual override with inline editing
- Chart of accounts upload for firm-specific mapping

---

### 2. Autopilot — 8-Stage Close Pipeline
**Files:** `src/app/api/autopilot/pipeline/start/route.ts`, `src/lib/autopilot/`, `src/components/autopilot/`, `src/app/dashboard/autopilot/`

The centerpiece feature. Runs a full month-end close automatically.

**8 stages:**
1. **Data Collection** — Load transactions, count accounts
2. **AI Categorization** — Claude Sonnet categorizes uncategorized transactions in batches. Auto-approves ≥90% confidence
3. **Bank Reconciliation** — Compare credits vs debits, flag differences
4. **Journal Entry Generation** — Claude Sonnet generates double-entry JEs for every transaction
5. **Anomaly Scan** — `exceptionDetector.ts` finds duplicates, outliers, unusual amounts
6. **Trial Balance** — Aggregate all JEs into a trial balance, verify DR = CR
7. **Reporting** — Calculate P&L (revenue, COGS, gross margin, net income)
8. **Human Review** — Surface all exceptions for accountant sign-off

**UI:**
- `PipelineViz.tsx` — Visual 8-node connected pipeline with status colors, pulsing dots, click-to-expand logs
- `CloseReport.tsx` — Full close report: P&L, exceptions, JE table, export
- `ExceptionCard.tsx` — Per-exception accept/flag card

**Bulk dashboard:** `autopilot/page.tsx` shows all clients pending close, "Run All" button, time saved stats.

---

### 3. Bank Reconciliation
**Files:** `src/app/dashboard/clients/[clientId]/bank-rec/`, `src/lib/bank-rec/`, `src/components/bank-rec/`

- Upload bank statement (CSV, OFX, or PDF)
- Parse into lines with `parse-csv.ts`, `parse-ofx.ts`, `parse-pdf.ts`
- AI-powered match suggestions — maps statement lines to book transactions
- Manual matching workspace with drag-and-drop style UI
- Tracks unmatched items, running difference, balance bar
- Saves reconciliation with full audit trail

---

### 4. Email Inbox + Document Processing Pipeline
**Files:** `src/app/api/inbox/webhook/route.ts`, `src/lib/inbox/`, `src/app/dashboard/inbox/`

Full inbound email pipeline:

**Webhook flow:**
1. Email arrives at Postmark inbound address
2. POST to `/api/inbox/webhook`
3. Extract firm slug from To address (`docs@{slug}.inbox.closebooks.app`)
4. Look up firm by slug from `firm_settings.payload->>'inboxSlug'`
5. Match sender to client (3-stage: subaddress → exact email → subject fuzzy → unassigned)
6. Store email in `inbox_emails`
7. Per attachment: upload to Supabase Storage, run Claude Haiku OCR, classify doc type (receipt/invoice/statement/CSV)
8. Store in `inbox_attachments` with extracted structured data

**Inbox UI (`/dashboard/inbox`):**
- Filter tabs: All / Unread / Receipts / Invoices / Statements / Unassigned
- Checkbox multi-select with batch archive toolbar
- Client name badge (color-coded), doc type badge, attachment count
- Assign-to-client inline
- Demo fallback when no real emails yet

**Setup page (`/dashboard/inbox/setup`):**
- Step-by-step slug config → Postmark webhook URL → DNS/MX guide → client instructions

**API routes:**
- `GET /api/inbox/emails` — list with status/client/pagination filters
- `GET /api/inbox/emails/[id]` — single email + attachments (auto-marks read)
- `PATCH /api/inbox/emails` — update status
- `POST /api/inbox/assign` — assign to client
- `POST /api/inbox/archive` — bulk archive
- `POST /api/inbox/send-request` — send document request via Postmark outbound

---

### 5. Document Vault
**Files:** `src/app/dashboard/vault/`, `src/lib/vaultStorage.ts`, `src/components/VaultDocumentCard.tsx`

- Central document library per firm
- Upload, tag, search documents
- Track document types: receipt, invoice, bank statement, tax form, contract, other
- Link documents to clients or jobs
- Document request workflow: create a request → share portal link → client uploads → auto-lands in vault

---

### 6. Cash Flow Radar
**Files:** `src/app/dashboard/radar/`, `src/lib/radar/`, `src/components/RadarClientCard.tsx`

- Multi-client cash health dashboard (red/yellow/green status)
- Per-client metrics: burn rate, cash runway (months), AR days, current cash position
- Alert generation: draft emails for clients in the red
- Aggregate report view

---

### 7. Predictive Analytics
**Files:** `src/app/dashboard/predict/`, `src/app/api/predict/`

- Cash flow forecasting per client based on transaction patterns
- Recurring transaction detection
- Tax opportunity identification from spend patterns
- Pattern analysis page with confidence indicators

---

### 8. Advisory Memos
**Files:** `src/app/dashboard/advisory/`, `src/app/api/advisory/`, `src/components/AdvisoryMemoViewer.tsx`

- Claude generates a multi-section business advisory memo per client
- Sections: cash flow trends, anomalies, benchmarks vs. industry, recommendations
- Filterable by status: draft / sent / archived
- Export to PDF/send to client

---

### 9. Tax Planning Suite
**Files:** `src/app/dashboard/tax-draft/`, `src/app/dashboard/tax-strategy/`, `src/app/dashboard/1099/`

- **Tax Draft:** Build and annotate a tax return with AI-identified opportunities (deductions, credits)
- **Tax Strategy:** Project full-year liability, run what-if scenarios
- **1099 Generator:** Generate and distribute 1099-NEC forms to contractors
- **Tax Handoff:** Export return package to CPA/tax software
- Review mode before export

---

### 10. Compliance Alerts
**Files:** `src/app/dashboard/compliance/`, `src/lib/regulatoryAlerts.ts`

- Regulatory requirement database (IRS deadlines, DOL rules, state requirements)
- Alerts sorted by severity and source
- Generate compliance letters for clients
- Compliance task list for firm-wide tracking

---

### 11. Audit Defense
**Files:** `src/app/dashboard/audit-defense/`, `src/app/api/audit-defense/`

- Analyze IRS audit risk from transaction data
- Generate audit defense package (documentation, explanations, supporting evidence)
- Package builder UI with checklist

---

### 12. Client Portal
**Files:** `src/app/dashboard/portal/`, `src/app/api/portal/`, `src/lib/portal/`

- Secure client-facing portal (separate from firm dashboard)
- Client sees: cash position, runway, document requests, messages
- Document upload from client side
- Message thread between firm and client
- Token-based auth (no Supabase account needed for client)
- Firm can configure and preview portal per client

---

### 13. AI Copilot (Chat Assistant)
**Files:** `src/app/dashboard/copilot/`, `src/app/api/copilot/`, `src/components/CopilotPanel.tsx`

- Claude-powered chat assistant embedded in the dashboard
- Cmd+K shortcut to open anywhere
- Tool calling: can execute actions directly (categorize batch, approve transactions, flag exceptions, send client email, create document request)
- Context-aware: knows which client/job you're looking at
- Per-client copilot at `/dashboard/clients/[clientId]/copilot`

---

### 14. Plaid Integration
**Files:** `src/lib/plaid/`, `src/app/api/integrations/plaid/`, `src/components/plaid/`

- Connect client bank accounts via Plaid Link
- Auto-sync transactions (cron: daily at 2am)
- Plaid webhook for real-time updates
- Encrypted access token storage
- Multi-account per client support

---

### 15. QuickBooks Online Integration
**Files:** `src/app/api/integrations/quickbooks/`, `src/lib/qboClient.ts`

- OAuth 2.0 connection flow
- Push journal entries and transactions to QBO
- Pull existing data for reconciliation
- Sandbox and production environment support

---

### 16. Network & Benchmarking
**Files:** `src/app/dashboard/network/`, `src/lib/benchmarkCalc.ts`, `src/lib/benchmarkNetwork.ts`

- Industry benchmark database (spend by category, margin, etc.)
- Compare individual client metrics vs. industry
- Cross-client network insights (anonymized trends across firm's client base)
- Pulse surveys across the client network

---

### 17. Billing & Subscriptions
**Files:** `src/app/api/stripe/`, `src/lib/billingStorage.ts`, `src/lib/subscriptionAccess.ts`

- Stripe subscriptions with 3 tiers
- Free trial management
- Stripe customer portal (self-serve upgrade/downgrade/cancel)
- Webhook handler for subscription lifecycle events
- Feature gating by plan tier
- Invoice generation for firm clients

---

### 18. Multi-Firm Architecture & Team
**Files:** `src/lib/permissions.ts`, `src/app/dashboard/team/`, `src/app/dashboard/settings/`

- Firm owner model with RLS enforced at DB level
- Team member roles: owner, admin, member
- Audit log of all firm actions
- Session management
- Firm-level settings and preferences

---

### 19. White-Label
**Files:** `src/app/dashboard/whitelabel/`

- Configure custom branding (logo, colors, name)
- Custom domain support
- White-label client management
- Revenue sharing tracking

---

### 20. Voice, Calendar, Time Tracking, Referrals
- **Voice:** Transcription + voice commands (`/api/voice/`, `/dashboard/voice/`)
- **Calendar:** Firm calendar for deadlines and events (`/dashboard/calendar/`)
- **Time Tracking:** Billable hours tracking (`/dashboard/time/`)
- **Referrals:** Referral program with tracking (`/dashboard/referrals/`)

---

## Key Architectural Decisions

### Always-200 Webhook Pattern
All inbound webhooks (Postmark, Plaid, Stripe) return HTTP 200 even on errors. This prevents retry storms. Errors are logged internally.

### Demo Fallback Pattern
All UI pages that fetch from APIs fall back to hardcoded demo data when the API returns empty or errors. This makes the app always look good in demos even before real data exists.

### Client-Orchestrated Pipeline
The autopilot pipeline runs client-side: the browser calls `/api/autopilot/pipeline/start`, waits for the full result, then animates stages completing. No SSE or polling needed — simpler and more reliable.

### Service Role Client for Webhooks
Postmark webhooks have no user session, so `serviceClient.ts` uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for webhook inserts.

### Supabase RLS Everywhere
Every table uses Row Level Security with `cb_user_has_firm_access(firm_id)`. No data leaks between firms even if API routes are misconfigured.

---

## Environment Variables Required

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (webhooks) |
| `ANTHROPIC_API_KEY` | Claude API |
| `POSTMARK_SERVER_TOKEN` | Postmark outbound email |
| `POSTMARK_FROM_EMAIL` | Verified sender address |
| `NEXT_PUBLIC_APP_URL` | App base URL |
| `PLAID_CLIENT_ID` | Plaid client ID |
| `PLAID_SECRET` | Plaid secret |
| `PLAID_ENV` | sandbox or production |
| `NEXT_PUBLIC_PLAID_ENV` | Client-side Plaid env |
| `QUICKBOOKS_CLIENT_ID` | QBO OAuth client ID |
| `QUICKBOOKS_CLIENT_SECRET` | QBO OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

---

## Current Known Issues / Tech Debt

1. **Pre-existing TS errors** in `api/stripe/webhook`, `api/agent/exceptions`, `api/subscription`, `dashboard/agent/page.tsx` — not from inbox/autopilot work, left as-is
2. **TS2802 (Set iteration)** in several older files — needs `downlevelIteration` or `Array.from()` fixes across the codebase
3. **Inbox `[documentId]` detail page** (`/dashboard/inbox/[documentId]/page.tsx`) still uses hardcoded demo data — needs to fetch from `/api/inbox/emails/[id]`
4. **Old webhook route** at `/api/inbox/receive-email/route.ts` is superseded by the new `/api/inbox/webhook/route.ts` — can be removed
5. **Plaid cron changed** from every 6 hours to daily (2am) to fit Vercel Hobby plan limits
6. **No real-time updates** — inbox, pipeline status all require manual refresh (no WebSocket/SSE)

---

## What's NOT Built Yet (Obvious Gaps)

- **Mobile app / mobile-responsive UI** — currently desktop-only
- **Email notifications** — no automated emails to accountants when new inbox emails arrive, when pipeline finishes, etc.
- **Real Supabase persistence for most features** — many features still use in-memory/localStorage storage (not the DB). The infrastructure is there (migrations done) but many API routes write to memory not Supabase
- **Onboarding flow** — no guided first-run experience
- **Search across everything** — no global search
- **Multi-currency support**
- **Actual QBO sync** — the OAuth flow exists but the push/pull is partially stubbed
- **2FA / MFA** for firm accounts
- **Client portal mobile experience**
- **Scheduled close runs** — no way to schedule autopilot to run on the 1st of each month automatically
- **Slack/Teams notifications**
- **Bulk CSV export of all data**
- **Partner/reseller portal** for white-label customers

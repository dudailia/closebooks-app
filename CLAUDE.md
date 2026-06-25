# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **New session? Read [`SESSION_LOG.md`](./SESSION_LOG.md) first** — it's the current handoff: what's fixed & deployed, known-but-unfixed bugs (incl. a critical client-persistence gap), temporary instrumentation to remove, and the live infra/seed state. This file (CLAUDE.md) is durable architecture; SESSION_LOG.md is where things stand right now.

## Commands

- `npm run dev` — Next.js dev server on `localhost:3000`
- `npm run build` — production build. **This is the primary correctness gate** — there is no test suite in this repo. Always run after any code change.
- `npm run lint` — ESLint via `next lint`. Pre-existing warnings exist; only fail the build on *new* errors you introduced.
- `supabase db push` — applies any new migrations in `supabase/migrations/` to the configured project. In many sessions this is skipped and the SQL is applied manually in the Supabase dashboard.

No test runner is configured. Verification is `npm run build` + manual browser check.

## Deploy flow

Pushing to `main` triggers a Vercel auto-deploy. `vercel.json` sets function timeouts. There is no separate staging branch — the workflow is commit → push → Vercel. Destructive operations on `main` (force push, reset) require explicit user authorization.

## Environment

Minimum: `ANTHROPIC_API_KEY`. Everything else is optional and the app degrades gracefully.

- Supabase missing → **demo mode**: data lives in an in-memory cache, no auth, routes fall through to `/dashboard`.
- `RESEND_API_KEY` missing → portal notification emails and monthly reports are skipped silently; **Supabase auth emails (signup confirmation, password reset) will also fail** unless Resend SMTP is configured separately in the Supabase dashboard (Authentication → SMTP Settings → Host: `smtp.resend.com`, Port: 465, User: `resend`, Pass: `RESEND_API_KEY`).
- `NEXT_PUBLIC_STRIPE_PRICE_*` env vars missing → `/pricing` shows a "not configured" hint instead of a checkout button.

See `.env.example` for the complete list and the full SQL schema.

## Architecture — the parts that span multiple files

### 1. Dual-store data layer (`src/lib/db.ts`)

All client-side data operations go through `db.ts`. It tries Supabase first; on any failure (no config, no session, network error) it silently falls back to the in-memory cache in `src/lib/memoryData.ts`. **Never import `db.ts` from server components or API routes** — it's client-only. Server-side data access goes directly through `@/lib/supabase/*` helpers.

Consequence: when adding a new persisted entity, write both a Supabase path (migration + `db.ts` function) and a memory-cache fallback, or the feature breaks in demo mode.

### 2. Firm-scoped payload-row tables

Many Supabase tables follow a **JSON-payload row pattern**: `id text primary key, firm_id uuid, payload jsonb`. Helper in `src/lib/supabaseJsonTable.ts` exposes `loadPayloadRows`, `upsertPayloadRow`, `deletePayloadRow`. Used by: `firm_settings`, `corrections`, `category_rules`, `ai_conversations`. RLS is always `firm_id = public.cb_firm_id()`. When adding a new firm-scoped entity with a flexible schema, prefer this pattern over a typed table — schema evolution becomes free.

### 3. Inline styles vs Tailwind

Tailwind 3.4 is installed but **most UI uses inline React styles with hardcoded hex colors**. The warm palette (`#faf8f4` cream, `#1a1714` ink, `#2d5a27` green, `#b8734a` amber) defines the product's look. When editing a component, match the surrounding style: if it uses inline styles, stay inline. Don't mass-convert to Tailwind.

### 4. Scoped dark theme (`globals.css`)

Cross-theme CSS variables in `:root` define the cream palette; a `[data-theme="dark"]` selector flips the values. Only two surfaces currently opt in:

- The landing page (`src/app/page.tsx`) and all public pages via `PublicShell` (`src/components/landing/PublicShell.tsx`).
- The transaction review page — its `<main>` content is wrapped in `<div data-theme="dark">`.

Dashboard chrome (sidebar, topbar, most pages) stays cream. When adding a new public page, wrap it in `PublicShell`. Never touch cream colors inside the `[data-theme="dark"]` subtree — use `var(--surface-card)`, `var(--text-primary)`, etc.

### 5. AI layer (`src/lib/ai/*`)

Centralized Anthropic access: `getAnthropic()` singleton in `anthropic.ts`, model enum (`sonnet`, `haiku`, `opus`), `costOfUsage()` helper. SSE response wrapper in `sse.ts` — use it for any streaming route. Tool definitions in `tools.ts` + client-side executor in `toolClient.ts` (tools mutate local state via a passed callback, *not* the server). System prompts in `systemPrompts.ts`.

The **chat + agent** pattern: the server streams `text` deltas, then emits `tool_call` events. The client executes the tools locally (so mutations go through the client's undo stack, localStorage, etc.), then re-opens the SSE with a follow-up user message containing the tool results. See `/api/ai/chat/route.ts` and `src/components/ai/AppChatPanel.tsx`.

### 6. Transaction review surface

`src/components/TransactionTable.tsx` is the workhorse. Sub-features live in `src/components/review/` (bulk action bar, split modal, command palette, history drawer, shortcut legend, inline category picker, toasts) and `src/lib/review/` (keyboard shortcut provider, undo stack, category rules engine, vendor normalization). Dozens of inline-hex colors have been migrated to CSS variables — the dark treatment is a token flip, not a rewrite.

Undo stack is session-only (max 50 entries). Every mutation (single edit, bulk approve, rule save + apply, split, duplicate) pushes an entry with an `inverse` function; `⌘Z` invokes it. New mutations must follow the same pattern or they'll be un-undoable.

### 7. Portal (`/portal/[token]`)

Magic-link style. `portal_tokens` table, `src/lib/portal/auth.ts` validates. Firm branding from `firm_settings` (logo, colors, firm name) is loaded on every request and passed into the UI and email templates. **No CloseBooks branding is ever shown to clients** — use `clientFacingName ?? firmName` and firm-driven colors.

### 8. Email (`src/emails/` + `src/lib/portal/notify.ts`)

Two stacks: the portal notifier uses an inline `emailHtml()` wrapper (short transactional emails), and React Email templates (`src/emails/MonthlyCloseReport.tsx`) handle the rich reports. When adding a new branded email to clients, prefer React Email for reach/readability and inline-style wrapper for short one-liners.

### 9. Health + rules + branding data flow

`FirmSettings` carries client-facing branding (`logoUrl`, `primaryColor`, `accentColor`, `emailFromName`, `clientFacingName`). Everything — portal header, monthly-report email, settings preview — reads from one `firm_settings` payload row. Update via `saveFirmSettings()`; hydrate via `hydrateFirmSettings()` on server routes.

Client health score (`src/lib/health/scoreClient.ts`) is a pure function: four weighted signals (on-time 30 / anomalies 20 / docs 20 / recon 30), bucketed into Excellent / Good / Attention / Critical. Called via `POST /api/clients/health` batching all clients in one request.

## Workflow convention — Superpowers skills

This project is built using the **superpowers** plugin. Every non-trivial feature follows `brainstorm → write spec → write plan → execute → push`. Specs live in `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`; implementation plans in `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`. Both are committed to git as design history. The HARD-GATE: never start implementation until the user approves a written design. User's repeated pattern is "approve, do everything" — move efficiently but still produce the spec + plan artifacts.

## Known caveats

- `Failed to patch lockfile` warnings during `npm run build` are pre-existing and non-fatal. The build is successful if `✓ Compiled successfully` appears.
- Many dashboard pages use hardcoded hex colors from the cream palette. Cross-theme migration to CSS variables is progressive — only the review surface and public pages are done so far.
- `src/app/dashboard/review/[jobId]/page.tsx` is a large file (1,600+ lines) handling the whole review experience. Edit with care; prefer extracting sub-components over growing the file.

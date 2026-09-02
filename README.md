# CloseBooks

AI-assisted month-end close for small CPA firms: upload a bank statement CSV, have Claude categorize every transaction against a chart of accounts, review and correct in a keyboard-driven grid, then export or push journal entries to QuickBooks Online.

**Live:** https://closebooks-app.vercel.app

---

## Status

Deployed and publicly reachable on Vercel, under active development. Billing is wired end-to-end but still in Stripe test mode, so there are no paying customers yet.

**No automated test coverage.** There is no test runner configured — no unit, integration, or end-to-end suite. The correctness gate is `npm run build` plus manual browser verification.

The build gate itself is real as of this commit: `next.config.mjs` sets `typescript.ignoreBuildErrors: false` and `eslint.ignoreDuringBuilds: false`, and the build passes clean. It did not used to. Both were `true`, which meant `next build` never ran `tsc` — that is how a call to a function that does not exist (`loadAgentPrefs`, a live `ReferenceError` on the agent page) shipped to production. Turning the flags on surfaced 70 type errors, 4 invalid Next.js route exports, and 2 real runtime bugs; all are fixed. 113 ESLint findings remain as warnings rather than errors — 83 unused variables and ~31 unescaped quotes in JSX. Those two rules plus `exhaustive-deps` are set to `warn` in `.eslintrc.json`; every correctness rule still fails the build. The codebase is type-clean, not lint-clean.

Read [Known limitations](#known-limitations) before evaluating this as a finished product.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind 3.4 is installed, but most UI is inline React styles over a CSS-variable palette; dark theme is a scoped `[data-theme="dark"]` token flip |
| AI | Anthropic SDK — `claude-sonnet-4-6` (categorization, advisory), `claude-haiku-4-5` (fast extraction), `claude-opus-4-7` (available in the model enum) |
| Data | Supabase (Postgres + Auth + row-level security), 15 SQL migrations |
| Payments | Stripe Checkout + webhooks |
| Email | Resend (transactional) and React Email (rich monthly reports); Postmark for **inbound** document email |
| Banking | Plaid (integration written, not configured — see limitations) |
| Accounting | Intuit QuickBooks Online OAuth + journal-entry push |
| Parsing | PapaParse (CSV), pdf-parse (PDF) |
| Motion | Framer Motion |
| Hosting | Vercel, push-to-`main` auto-deploy |

Roughly 106k lines across `src/`, 101 API routes, 86 dashboard pages.

## Architecture

Three decisions shape most of the codebase.

**Dual-store data layer.** All client-side reads and writes go through `src/lib/db.ts`, which tries Supabase first and silently falls back to an in-memory cache (`src/lib/memoryData.ts`) on any failure — missing config, no session, network error. That is what makes the public demo work with no account and no database. `db.ts` is client-only; server routes go directly through `@/lib/supabase/*`.

**Firm-scoped JSON-payload rows.** Several tables use `id text, firm_id uuid, payload jsonb` with RLS pinned to `firm_id = public.cb_firm_id()`, accessed through `src/lib/supabaseJsonTable.ts`. Schema evolution on `firm_settings`, `corrections`, `category_rules` and `ai_conversations` costs nothing.

**Server-streamed agent, client-executed tools.** `/api/ai/chat` streams text deltas over SSE, then emits `tool_call` events. The client executes those tools locally and re-opens the stream with the results.

## What was technically hard

**Making the AI agent's edits undoable.** The obvious design — let the server apply tool calls straight to the database — would have made every AI action invisible to the client's undo stack and inconsistent with the optimistic local state the review grid depends on. Instead the server streams tool *intents* and the client is the executor: `src/lib/ai/toolClient.ts` runs each tool against local state through the same mutation path a human click uses, then the client re-opens the SSE with a follow-up message containing the tool results. AI edits and manual edits are the same kind of event, so `⌘Z` works on both.

**Undo across bulk operations.** Every mutation — single edit, bulk approve, split, duplicate, rule-save-and-apply — pushes an entry carrying an `inverse` closure rather than a snapshot. Snapshotting a few thousand transactions per keystroke was not viable; inverse functions make undo O(size of the change) instead of O(size of the grid). Session-only, capped at 50 entries.

**A silent, total checkout failure caused by build-time inlining.** The pricing page resolved Stripe price IDs through a computed key — `process.env[priceEnvKey(tier, interval)]`. Next.js only inlines *statically written* `NEXT_PUBLIC_*` references into the client bundle, so every lookup was `undefined` in the browser, every tier silently rendered its "not configured" fallback link instead of a checkout button, and no request ever reached `/api/stripe/checkout`. Nothing errored; revenue was simply impossible. The fix was a static `PRICE_ENV` map of literal `process.env.NEXT_PUBLIC_*` references. The general lesson — dynamic env access is invisible to the bundler — now applies to every public var in the project.

**Degrading gracefully instead of failing.** Missing Supabase drops to demo mode, missing Resend skips notifications, missing Stripe price IDs hide the checkout button. This is good for demos and bad for debugging: the client-persistence bug described below existed precisely because a swallowed write looked identical to a successful one. Errors in `dbSaveClient`/`dbDeleteClient` now surface rather than being caught and dropped.

## Setup

Requires Node 18+.

```bash
git clone https://github.com/dudailia/closebooks-app.git
cd closebooks-app
npm install
cp .env.example .env.local
```

The only required variable is `ANTHROPIC_API_KEY`. With just that, the app runs in demo mode: no auth, no persistence beyond the browser tab, every AI feature functional.

```bash
npm run dev     # http://localhost:3000
npm run build   # the primary correctness gate — there is no test suite
npm run lint
```

To enable auth and persistence, create a Supabase project, set the three `SUPABASE`/`NEXT_PUBLIC_SUPABASE_*` variables, and apply the schema — either `supabase db push` against `supabase/migrations/`, or paste `supabase/CLOSEBOOKS_PASTE_ALL_IN_SUPABASE.sql` into the Supabase SQL editor.

`.env.example` documents every variable the code reads, grouped by subsystem, with no real values. Nothing in it is required except the Anthropic key; each block explains what degrades when it is absent.

## Known limitations

These are current and accurate as of this commit.

- **No automated tests.** No unit, integration, or end-to-end suite, and no test runner. Verification is `npm run build` plus manual browser checks.
- **ESLint findings are warnings, not errors.** 113 of them — unused variables and unescaped JSX quotes. Type checking is enforced; style linting is not.
- **CloseBooks cannot file anything with the IRS.** It is not an IRS-authorized e-file provider and has no e-file integration. `POST /api/1099/file` validates a payload and returns `501 Not Implemented`; the UI says so and the bulk action is labelled "mark as prepared", not "file". The "check TIN format" button is a local 9-digit format check — it does not query the IRS TIN Matching Program. *This endpoint previously returned a fabricated confirmation number and `status: "ACCEPTED"` reading "successfully submitted to the IRS". It never contacted the IRS. That was wrong and is fixed.*
- **Plaid is not configured in production.** Every `PLAID_*` variable is empty in the deployed environment, so bank connection is non-functional and "Pull from Bank" is a placeholder. The integration code exists but has never run against live Plaid.
- **Some surfaces show illustrative data, and say so in-app.** The Intelligence Network's peer benchmarks ("1,247+ firms") are a fixed reference dataset, not aggregated CloseBooks customer data — CloseBooks does not aggregate across firms. Tax-draft export returns a fixed sample return regardless of which client you request, prefixed `SAMPLE_`. Both carry an in-app notice.
- **Document-request email requires Postmark.** Without `POSTMARK_SERVER_TOKEN` the endpoint returns 503 rather than reporting a send that did not happen.
- **Onboarding job creation is memory-only.** `src/app/get-started/page.tsx` still calls `saveJob` from `@/lib/storage` (in-memory) rather than `dbSaveJob`. A job created during onboarding survives client-side navigation but may not survive a hard refresh unless a later `dbSaveJob` on the review page re-persists it. The equivalent bug for *clients* was fixed and verified against the database; this one is open.
- **Persistence is owner-only.** `getFirmId` in `src/lib/db.ts` resolves the firm via `firms.owner_id` only, so writes by non-owner team members will not persist. Single-owner firms are the only supported configuration today.
- **Stripe is test-mode.** Checkout, webhook, and subscription gating are verified end-to-end in test mode. Going live needs live keys, a separate live-mode webhook endpoint with its own signing secret, and the Billing Portal activated.
- **Export is CSV.** `/api/export` emits standard and QuickBooks-shaped CSV. PDF report export is not in the merged codebase.
- **Feature depth varies.** 86 dashboard surfaces exist and the AI-backed ones (categorization, advisory memos, tax strategy, audit-defense analysis) genuinely call Claude, but not every surface is equally finished. Judge them individually.

## License

No license file. All rights reserved.

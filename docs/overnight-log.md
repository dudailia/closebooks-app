# Overnight log, 2026-09-30 to 2026-10-01

Branch: `overnight`, created from `eval-harness` at `8f357bcf`.

## Morning summary

All 10 tasks done on branch `overnight` (12 commits after the branch point,
each pushed). Nothing was committed to `eval-harness` or `main`. No Anthropic
API calls, no live Supabase calls, no migration applied. API spend tonight: $0.

**Gate at the last commit:** `npm test` 178 tests in 21 files passing (was 135
in 16); `npm run typecheck` clean; `npm run build` passes; `npm run e2e`
1 test passing; lint warnings 112 to 108.

**Done**

| # | What | Where |
|---|---|---|
| 1 | Technical overview for the CTO (about 4 pages) | `docs/technical-overview.md` |
| 2 | 5-minute demo script with backup plans | `docs/demo-script.md` |
| 3 | 40 hard questions with sourced answers | `docs/likely-questions.md` |
| 4 | Playwright e2e of the core path, screenshots | `e2e/core-path.spec.ts`, `npm run e2e`, `docs/screenshots/` |
| 5 | Closes linked to clients by id; client picker on New Close | `src/lib/clientJobs.ts`, `src/components/ClientPicker.tsx` |
| 6 | Migrations for F5, F9, F10, F14 (not applied), tested on PGlite | `supabase/migrations/202610013*` to `202610016*`, `docs/engine/rls-audit.md` |
| 7 | npm audit: 1 non-breaking fix applied, majors listed | `docs/dependency-report.md` |
| 8 | Two experiments made runnable with exact commands and costs | `docs/next-experiments.md` |
| 9 | One source for chart templates | `src/lib/coaTemplates.ts` |
| 10 | Four unused names removed in core files | |

**Tested, and how**

- e2e (local build, demo mode, fake model, every non-localhost request
  blocked): demo entry, two same-name clients, client picker search and
  duplicate warning, chart, 8-row US-date CSV (08/15 read as 15 August),
  categorise, move a Stripe payout to AR, save the rule, approve all,
  journal-entry CSV balanced per entry and in total, report, second close with
  the 292-row file where the 5 Stripe rows take the rule and only 287 rows go
  to the model, second JE export balanced, closes counted on the right client.
- Migrations: every file in `supabase/migrations/` applied in order to PGlite;
  17 tests of the new policies as signed-in and anon users. Removing the four
  new migrations makes 12 fail. PGlite is not Supabase: auth, roles and
  storage are stand-ins.
- Experiments: all 11 documented commands run with `--fake`.

**Not tested**

- `/get-started` after the chart change (typecheck and build only).
- The client picker with Supabase on (only demo mode, where memory is the
  store).
- Whether the migrations apply to the live database: its state isn't visible
  from the repo (rls-audit.md, section 5).

**Blocked:** nothing. Limits I hit: no local Postgres (used PGlite instead);
token counts for the caching estimate are a character-count estimate, because
counting tokens is an API call.

**Needs your decision**

1. **Run the experiments?** About $1.11 for (a) and $1.32 for (b), each with
   a hard cap (`docs/next-experiments.md`). My expectation: (b) saves little.
2. **Apply migrations?** (Update 2026-10-01: you had already applied F1 and
   `transactions.approved_by` on 2026-09-30, so 8 remain; order in
   `docs/migrations-to-apply.md`.) From `eval-harness`: F7 trial state, F8
   subscriptions, F15 qbo_connections. From tonight: `jobs.client_id`, F9,
   F10, F14, F5.
   Read-only checks first: `supabase/checks/open_findings_check.sql`.
3. **F5 consent:** a user can still be added to a firm without accepting.
   Fixing it needs an invitation flow; do you want one?
4. **Two bugs found, not fixed** (outside the task list):
   - Select all + Approve re-labels rows the AI already auto-approved as
     approved by the reviewer, so the close report said "8 by reviewer" with
     4 of them AI approvals.
   - React warns "Cannot update a component while rendering a different
     component" from `TransactionTable` on recategorise (dev only).
5. **Major upgrades:** Next 14 to 15.5.24+ is the only fix that touches the
   core path (RSC denial-of-service advisories); `@anthropic-ai/sdk` 0.82 to
   current is small. Both are proposals in the dependency report.
6. **Strict wrong-auto-approval figure:** facts.md quotes only the lenient
   0.4% at 0.93; the strict figure is 20 of 274 (7.3%,
   `eval/results/threshold-sweep.md`). Add it to facts.md? A CTO may ask.
7. **The demo script targets `main`** (the live app: Sonnet 4.6 at 0.85, no
   client picker). Merging `eval-harness` and `overnight` would change what
   the call shows; the script says which version is on screen.

**One fix to the demo script you should know about:** its local backup
command was missing `DEMO_MODE=true`, without which `/api/categorize` answers
503 when Supabase is blank. Fixed.

## Decisions and notes, in order

- Baseline before any change: `npm test` 135 tests in 16 files, all passing
  (facts.md says 131 in 15; commit `8f357bcf` added the subscription lookup
  tests after facts.md was written).
- `.env.local` holds live Supabase and Anthropic keys. Every local run below
  (e2e, dev server) removes them from the environment so nothing reaches the
  live database or the API.
- Task 1 (`docs/technical-overview.md`): built from architecture.md, facts.md
  and docs/engine. Line numbers re-checked on this branch; two differ from
  architecture.md: `dbSaveJob` is `src/lib/db.ts:148` (doc says 147),
  `dbSaveClient` is `:245` (doc says 244); the approve decision is
  `src/lib/coaValidation.ts:84`. About 2,600 words with tables and code
  blocks, so it runs closer to 4 pages than 2. Choice: stated that the 0.93
  threshold was picked and evaluated on the same data (no held-out set),
  because that is the main honest limit a CTO will ask about.
- Task 3 (`docs/likely-questions.md`): 40 questions in 9 groups, each with a
  file:line or doc. Written by a sub-agent, spot-checked (no em dashes, no
  banned words). New weaknesses it found while reading code, not yet in
  architecture.md: corrections and rules are firm-wide, not per client
  (`src/lib/corrections.ts`, `src/lib/review/rules.ts`); rules are applied
  without checking the account is in that client's chart; `/api/categorize`
  has no row cap and its rate limit is per server instance; the PDF prompt
  has no "data, not instructions" label; no duplicate check or balance
  reconciliation at upload. It also noted facts.md gives only lenient
  wrong-auto-approval counts; the strict figure for Sonnet 5.5 at 0.93 is
  20 of 274 (7.3%) in `eval/results/threshold-sweep.md`. Not added to
  facts.md (your call). Line numbers are for this branch before tasks 5 to 10;
  later code tasks may shift some.
- Task 2 (`docs/demo-script.md`): written by a sub-agent against `main`'s code
  (the live app), spot-checked. Choices: the script uses a 60-row cut of
  `eval/data/synthetic_upload.csv`, because on `main` batches run one at a
  time and the measured Sonnet 4.6 median (1.15 s per row) puts 292 rows at
  about 336 s against the 120 s route limit (arithmetic, not a timed run).
  Demo risks it found on `main`: rules load and apply at the same time on the
  review page (fixed on `eval-harness`), the older vendor key may keep ids so a
  saved rule matches nothing, the Report button's `window.open` after `await`
  can be blocked as a pop-up, clients matched by name, 5 free closes per firm.
- Task 4 (e2e): `npm run e2e` (Playwright 1.63, Chromium) builds the app into
  `.next-e2e` and runs it on port 3100 in demo mode. Passes: 1 test, about
  9 s plus about 70 s for the build. Choices:
  - **Fake model.** `src/lib/ai/fakeCategorizer.ts` answers in Claude's reply
    shape by keyword. `categorize.ts` uses it only when
    `CLOSEBOOKS_FAKE_MODEL=1` and `VERCEL` is unset (Vercel sets it at build
    and run time), so a deployment can't use it; 4 unit tests cover the gate
    and the engine path. `/api/categorize` skips its API-key check in that mode.
  - **Nothing leaves the machine.** The config sets Supabase, Anthropic,
    Stripe, Resend and Intuit variables to '' (Next.js then ignores the
    `.env.local` values) and points `ANTHROPIC_BASE_URL` at a closed local
    port. In the browser every non-localhost request is aborted and the test
    fails if there were any; `/api/notify` (which forwards to Formspree) is
    answered by the test.
  - **The 8-row US-date CSV did not exist in the repo**, so I wrote
    `e2e/fixtures/us-dates-8.csv` (synthetic, MM/DD/YYYY, includes 08/15).
  - **Demo mode has no sign-up**, so "sign up/enter demo" is opening
    `/dashboard`. Data is in memory only, so the test moves by clicking links,
    never by reloading.
  - Rule check: the reviewer moves a Stripe payout from 4100 to 1100 and saves
    the rule. In the 292-row second close, the 5 Stripe payouts show 1100 /
    Edited and the categorise request carries 287 rows, so the rule ran
    before the model.
  - Both journal-entry CSVs are parsed and checked to the cent per entry and
    overall.
  - `next.config.mjs` takes `NEXT_DIST_DIR` (unset by default, so normal builds
    are unchanged). Next.js reformatted `tsconfig.json` and added
    `.next-e2e/types/**/*.ts` to `include`; committed as it wrote it so it
    stops rewriting.
  - Screenshots: `docs/screenshots/` (11 PNGs, about 1.3 MB) with a README
    saying the categories are the fake model's, not Claude's.
  - Found while doing this, not fixed: React warns "Cannot update a component
    while rendering a different component" from `TransactionTable` (dev mode
    only, on recategorise). After select-all + Approve, the report says
    "8 by reviewer", including the 4 rows the AI had already auto-approved,
    so bulk approve re-labels AI approvals as the reviewer's.
- Task 5 (closes linked to clients by id):
  - `CategorizationJob.client_id` (optional). `src/lib/clientJobs.ts` holds
    the rules: a job with an id matches only that client; a job without one
    (saved before tonight, or made by `/get-started`) matches by name,
    case-insensitive, as before; the review page links a legacy job to a
    client only when exactly one client has that name.
  - New Close step 1 is `src/components/ClientPicker.tsx`: search box (name,
    industry, email), a list showing industry, email and close count so
    same-name clients can be told apart, and "+ Create new client" with a
    warning when the name already exists. Choice: a duplicate name is allowed
    (two real businesses can share a name), with the warning. A client made
    here gets industry Other and no email; edit it on the Clients page.
  - "New close" from a client's page now hands over the client's id.
  - Migration written, not applied:
    `supabase/migrations/20261001200000_jobs_client_id.sql` (column, index,
    and a backfill that links a job only when exactly one client of that firm
    has its name). No foreign key, so a job still saves if its client row
    didn't. Until it's applied, `src/lib/jobPersistence.ts` retries the job
    upsert without `client_id`, and `dbGetJobs` now selects `*` so it works
    with or without the column.
  - Hidden features (advisory, radar, agent, predict and others) still group
    jobs by name; not touched.
  - Tests: 12 unit tests (`src/lib/__tests__/clientJobs.test.ts`), and the e2e
    now creates two clients with the same name, checks the picker's search and
    duplicate warning, and checks at the end that the chosen client has
    2 closes and its twin 0. `npm test` 151 passing, build passes, e2e passes.
  - Bug I made and fixed before commit: the picker read "no clients yet" before
    the list loaded and stuck on the create form; the e2e caught it.
- Task 6 (low audit findings): four migrations written, **none applied**:
  - F9 `20261001300000_brand_assets_firm_folder.sql`: insert only into
    `<firm_id>/...` for an owner/admin of that firm; SVG dropped from the
    bucket's types. Code: `/api/firm/logo` now finds the firm from the
    request's session (it used the browser client on the server, which
    returns null) and accepts PNG, JPEG, WebP only. Route still 404s.
  - F10 `20261001400000_member_check_caller_only.sql`: same signature, true
    only when `check_user = auth.uid()`. Choice: not revoking execute, because
    RLS policies call it as the querying role and would start erroring.
  - F14 `20261001500000_firms_owner_id_pinned.sql`: trigger refusing an
    `owner_id` change from anon/authenticated API sessions (a policy's WITH
    CHECK can't see the old value). Service role and SQL editor can still
    transfer.
  - F5 `20261001600000_firm_members_insert_limits.sql`: no second owner row,
    only the owner adds/promotes admins, `cb_firm_id()` prefers the owned firm
    then the oldest membership. Not fixed: adding a user without consent needs
    an invitation flow, which doesn't exist (your decision whether to build it).
  - **Tested on real Postgres SQL** via PGlite (added as a dev dependency):
    `supabase/__tests__/migrations.test.ts` applies all 31 migrations in order
    with stand-ins for Supabase's auth/roles/storage and checks the policies
    (17 tests, in `npm test`). Removing the four new files makes 12 fail. The
    test caught two bugs in my first drafts: F10 returned null instead of
    false for anon, and the F14 trigger errored on an empty JWT-claims
    setting. Both fixed before commit.
  - Read-only checks for each finding appended to
    `supabase/checks/open_findings_check.sql`.
  - `docs/engine/rls-audit.md` section 0 and `docs/technical-overview.md`
    updated.
  - Found: `next build` did not type-check test files (a type error in
    `clientJobs.test.ts` from task 5 passed the build). Fixed the error and
    added `npm run typecheck` (`tsc --noEmit`, whole repo); I run it from here on.
- Task 7 (dependencies, `docs/dependency-report.md`): `npm audit` 9 flagged
  packages before, 8 after. Applied only `npm audit fix` without `--force`
  (brace-expansion, lockfile only); tests, typecheck, build and e2e pass after
  it. Everything else needs a major version, listed as proposals. Only Next
  14.2.35 has findings on the core path (React Server Components DoS, possibly
  RSC cache poisoning); 14.2.35 is the last 14.x, so the fix is Next 15.5.24+.
  Choice: `@anthropic-ai/sdk` 0.82 to 0.91.1 looks like a minor bump but npm
  treats a 0.x minor as breaking (outside `^0.82.0`), and its advisory is in
  the memory-tool helper the app doesn't use, so I listed it as a proposal.
- Task 8 (`docs/next-experiments.md`): both experiments are runnable, not
  just described. Added `systemPrompt` and `cache` options to the engine (off
  by default; a test checks the default request is unchanged and the cached
  request carries the same text), prompt variants as find-and-replace edits
  (`eval/prompts/variants.ts`, variant `ar-liabilities`), and `--prompt`,
  `--months`, `--cache` on `eval/run.ts`. Reports, comparisons and
  `merge-cli.ts` label or refuse mixed runs. All 11 commands in the doc were
  run with `--fake`. Estimates: (a) about $1.11 (cap $1.50), (b) about $1.32
  (cap $1.60). Choices and findings:
  - (a) is measured on July to August after tuning only on June, but I say in
    the doc that the error types were found on all three months, so the split
    only protects the wording, not the choice of what to fix. It can move 28 of
    188 test rows, so "no clear difference" is a likely result.
  - (b): the eval sends batches one at a time, so it measures the warm-cache
    case. In the app, 4 batches start at once and none can read a cache still
    being written, so for a 97-row statement caching is about break-even
    (arithmetic in the doc). Output is about two thirds of the cost.
    Sonnet 5.5's minimum cacheable length isn't in the API reference I have;
    step 0 checks for $0.05.
  - Fixed on the way: the budget cap's worst-case estimate measured an array
    system prompt as 1 character and didn't price cache writes; and a
    month-filtered report was labelled "PARTIAL RUN".
- Task 9 (charts): unified, not renamed. `src/lib/coaTemplates.ts` now holds
  the Standard Small Business (34), E-commerce (46) and Professional Services
  (44) templates; New Close and `/get-started` both read it. Choice: onboarding
  also loses its own E-commerce (13 accounts) and Professional Services (14)
  charts (same names, different accounts as New Close), so a client set up in
  onboarding gets the same chart as one set up in New Close; its Restaurant
  chart stays (no clash). The demo's 29-account chart keeps its accounts
  (`DEMO_TRANSACTIONS` and the demo's sample statuses use its codes) and is
  renamed "demo chart" in its comment; the demo UI never showed the name.
  The eval reads the chart from the new file; `node eval/generate.ts`
  reproduces the dataset byte for byte. 3 tests in
  `src/lib/__tests__/coaTemplates.test.ts` (chart equals the eval CSV, unique
  codes, no other "Standard Small Business" chart in `src/`). Not covered by
  e2e: `/get-started` (typecheck and build only).
- Task 10 (lint, core path only): 112 warnings to 108. Removed four unused
  names: `useMemo` (`src/app/dashboard/clients/page.tsx`), `deleteJob` and
  `ClientCloseStatus` (`src/app/dashboard/page.tsx`), and the unused
  `highlightIds` prop destructure in `src/components/TransactionTable.tsx` (the
  review page still passes it; the table never read it). Left alone on
  purpose: the `react-hooks/exhaustive-deps` warning in
  `src/app/dashboard/clients/[clientId]/page.tsx:314` (adding `jobs` would
  change when the effect runs, so it is a behaviour change), and warnings in
  hidden features (bank-rec, copilot). Tests, typecheck, build, e2e pass.

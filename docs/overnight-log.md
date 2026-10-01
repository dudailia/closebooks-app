# Overnight log, 2026-09-30 to 2026-10-01

Branch: `overnight`, created from `eval-harness` at `8f357bcf`.

## Morning summary

(written at the end)

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

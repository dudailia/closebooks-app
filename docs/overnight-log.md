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

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

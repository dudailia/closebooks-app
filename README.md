# CloseBooks

A month-end close tool for bookkeepers. Upload a client's bank statement,
Claude suggests an account from the client's chart of accounts for each
transaction, a reviewer approves or corrects them, and the app exports a
ledger CSV, balanced journal entries and a close report.

## Status

- **A demo.** No paying customers, no real client data. Billing runs in
  Stripe test mode.
- Accuracy has only been measured on a **synthetic** dataset (one fictional
  business, 292 rows). See [docs/facts.md](docs/facts.md).
- Features outside the core path below are hidden in the demo build
  (`src/lib/features.ts`), not deleted.
- The demo deploy at https://closebooks-app.vercel.app runs `main`. The
  current work, including the switch to Sonnet 5.5 at a 0.93 threshold, is on
  branch `eval-harness` and is not merged.

## What it does (core path)

1. Sign up and sign in (Supabase Auth).
2. Create a client and pick or upload a chart of accounts.
3. Upload a bank statement: CSV is parsed in the browser; PDF text is
   extracted on the server and turned into rows by Claude.
4. Saved firm rules are applied first. The remaining rows go to Claude
   (`claude-sonnet-5-5`) in batches of 20. Rows with confidence at or above
   the default 0.93 threshold and no validation flag are auto-approved; the
   rest wait for review.
5. Review: approve, recategorise, split, and save "always categorise as"
   rules. Changes can be undone within the session (⌘Z).
6. Export a standard or QuickBooks-format CSV, a journal-entry CSV, or an
   HTML close report.

How each step works, and its known weaknesses: [docs/architecture.md](docs/architecture.md).

## Stack

Next.js 14 (App Router), React 18, TypeScript; Supabase (Postgres, Auth,
row-level security); Anthropic SDK; Stripe; Vercel. Most UI uses inline
styles; Tailwind is installed.

## Run it

```bash
npm install
cp .env.example .env.local   # at minimum set ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Without Supabase settings the app runs in demo mode: no sign-in, data kept
in memory only and lost on reload. `.env.example` lists every variable.
Database migrations are in `supabase/migrations/`.

## Tests and checks

```bash
npm test          # vitest: 131 tests, no API calls
npm run build     # type-checks and lints; the main correctness gate
npm run lint
```

There are no end-to-end browser tests.

## Evaluation

`eval/` holds the synthetic labelled dataset and a harness that runs the
real categorisation engine against it with a hard spending cap. Commands and
method: [eval/README.md](eval/README.md). A full run calls the Anthropic API
and costs money (about $0.34 for 292 rows on Sonnet 5.5); `--fake` tests the
pipeline with no API calls. Results go to `eval/results/`, which is not in
git.

## Docs

- [docs/architecture.md](docs/architecture.md): data flow, prompt, confidence, rules, journal entries, weaknesses.
- [docs/facts.md](docs/facts.md): every number we quote, with its source file.
- [docs/engine/rls-audit.md](docs/engine/rls-audit.md): row-level security review.
- [docs/engine/journal-entries.md](docs/engine/journal-entries.md): journal-entry rules.
- [SESSION_LOG.md](SESSION_LOG.md): current state and open issues.

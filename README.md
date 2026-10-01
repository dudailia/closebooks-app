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
- The demo deploy at https://closebooks-app.vercel.app runs `main`, which
  includes the `eval-harness` and `overnight` work (Sonnet 5.5 at 0.93,
  rules first, closes linked to clients by id).
- Database security fixes are written as migrations; which are applied, and
  in what order the rest go, is in
  [docs/migrations-to-apply.md](docs/migrations-to-apply.md). Some take
  effect only once applied (see [SESSION_LOG.md](SESSION_LOG.md)).

## What it does (core path)

1. Sign up and sign in (Supabase Auth).
2. Create a client and pick or upload a chart of accounts. Each close is
   linked to its client by id (`src/lib/clientJobs.ts`); closes saved before
   that change are still matched by name.
3. Upload a bank statement: CSV is parsed in the browser; PDF text is
   extracted on the server and turned into rows by Claude (still
   `claude-sonnet-4-6` for PDFs).
4. Saved firm rules are applied first: a matching row takes the rule's
   account, is approved (credited to the rule) and skips the model. The
   remaining rows go to Claude (`claude-sonnet-5-5`) in batches of 20, 4
   batches at a time. Rows with confidence at or above 0.93 and no
   validation flag are auto-approved; the rest wait for review. Model and
   threshold are set in `src/lib/ai/models.ts`.
5. Review: approve, recategorise, split, and save "always categorise as"
   rules. Changes can be undone within the session (⌘Z).
6. Export a standard or QuickBooks-format CSV, a journal-entry CSV, or an
   HTML close report.

How each step works, and its known weaknesses: [docs/architecture.md](docs/architecture.md).

**Statement size.** There is no row cap. The categorise request has 120 s
(`vercel.json`); one 292-row upload took about 40 s on a preview, so the
limit is roughly 900 rows. That is an extrapolation from one run, not a
measurement. PDFs are also limited by Vercel's 4.5 MB request body.

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
npm test           # vitest: 187 tests, no API calls; includes the migrations, run on in-memory Postgres
npm run typecheck  # tsc --noEmit
npm run build      # type-checks and lints; the main correctness gate
npm run lint
npm run e2e        # Playwright: the core path in a local production build
```

The e2e runs in demo mode with a fake model: no Supabase, no Anthropic API,
and every request leaving the machine is blocked
(`playwright.config.ts`, `e2e/core-path.spec.ts`).

## Evaluation

`eval/` holds the synthetic labelled dataset and a harness that runs the
real categorisation engine against it with a hard spending cap. Commands and
method: [eval/README.md](eval/README.md). A full run calls the Anthropic API
and costs money (about $0.34 for 292 rows on Sonnet 5.5); `--fake` tests the
pipeline with no API calls. Results go to `eval/results/`, which is gitignored;
the summaries the docs cite are committed, the per-prediction `raw.json` files are not.

## Docs

- [docs/architecture.md](docs/architecture.md): data flow, prompt, confidence, rules, journal entries, weaknesses.
- [docs/facts.md](docs/facts.md): every number we quote, with its source file.
- [docs/engine/rls-audit.md](docs/engine/rls-audit.md): row-level security review.
- [docs/migrations-to-apply.md](docs/migrations-to-apply.md): migrations not yet applied, their order, and checks.
- [docs/engine/journal-entries.md](docs/engine/journal-entries.md): journal-entry rules.
- [SESSION_LOG.md](SESSION_LOG.md): current state and open issues.

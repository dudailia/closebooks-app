# Categorisation eval: synthetic labelled test set

**This data is synthetic and fictional.** The business, owner, clients,
employees, reference numbers and account digits are all made up. The
merchants are real brand names, but used only as they would appear in any
bank feed. No row comes from a real bank statement.

The business is **Brightline Studio LLC**, a two-employee design and web
consultancy in Austin, TX, owned by "Jordan Reyes". The data covers one
checking account from 2026-06-01 to 2026-08-31.

## Files

| File | What it is |
|---|---|
| `data/vendors.csv` | The vendor table: each vendor with 2–3 example bank descriptions, its direction and its correct account. **This is the source of the labels.** |
| `generate.ts` | A deterministic script that turns `vendors.csv` into the files below. |
| `data/synthetic_transactions.csv` | The labelled test set: `id, date, description, amount, type, true_account_code, label_source`. |
| `data/hand_labels.csv` | The rows from ambiguous vendors, for you to label by hand. |
| `data/synthetic_upload.csv` | The same transactions in the app's upload format (`Date, Description, Amount`, where negative means money out). |
| `data/chart_of_accounts.csv` | The chart used, in the app's chart upload format (`Code, Name, Type`). |
| `run.ts` | Runs the real engine on the dataset and writes a report (see "Measuring the engine"). |
| `metrics.ts`, `report.ts`, `compare.ts`, `data.ts`, `budget.ts` (+ `*-cli.ts`) | Scoring (pure functions, unit-tested in `__tests__/`), report writing, and dataset loading. |
| `pricing.json` | Price per million tokens for each model, with the source URL and the date checked. |

## How the labels were produced

The labels never come from the model being tested. Nothing in `eval/` calls
the categoriser or the Anthropic API.

1. **Chart.** The chart is the app's "Standard Small Business" template, the
   34-account default on the New Close upload step. `generate.ts` reads it
   directly from `src/lib/coaTemplates.ts` and stops if the template changes
   shape. New Close and onboarding (`src/app/get-started/page.tsx`) both use
   that file, so there is one chart with this name (until 2026-10-01
   onboarding had its own 16-account chart under the same name).
2. **Vendor table.** `vendors.csv` was drafted with Claude's help, then
   **reviewed and corrected by hand** by the project owner. Each non-ambiguous
   vendor has exactly one correct account and a one-sentence `why`.
   `generate.ts` checks every code and name against the chart. Rows whose
   label comes from here have `label_source = vendor_table`.
3. **Ambiguous vendors** (Amazon, Costco, Venmo, PayPal, a restaurant, Zelle
   to a person, Apple.com/bill) have no account in the vendor table. The
   right answer depends on facts the description doesn't contain. Their rows
   have an empty `true_account_code` and `label_source = hand`, and **the
   project owner labels them one by one** in `data/hand_labels.csv`.
   Regenerating merges those labels back into `synthetic_transactions.csv`,
   so hand work is never lost. Rows still unlabelled stay blank, so a
   measurement script can report them separately.
4. **REVIEW labels.** Some payments can't be classified from the bank line
   at all: Venmo, PayPal, and Zelle to a person. These are labelled
   `REVIEW` instead of an account. A REVIEW row is correct if and only if
   the app did **not** auto-approve it. REVIEW rows are reported in their own
   section and left out of every account-accuracy number.

### Bookkeeping policy behind the labels

The labels encode one reasonable policy. Change `vendors.csv` if yours differs.

- **Revenue:** invoices are raised in the books, so client payments (ACH,
  wire, check) and Stripe payouts clear **1100 Accounts Receivable**. Only
  walk-in workshop sales, which have no invoice, go straight to **4100
  Service Revenue**.
- **Expenses** are booked when paid.
- **Payroll:** Gusto net pay goes to **5100 Payroll & Wages**. Gusto tax
  impounds clear **2300 Payroll Liabilities**. Gusto's platform fee goes to
  **6100**.
- **Owner:** money in from the owner goes to **3000 Owner's Equity**. Owner
  transfers out, and the owner's IRS estimated tax payments, go to **3100
  Owner's Draw**.
- **Not income or expense:** transfers to or from savings go to **1010**, ATM
  cash to **1020 Petty Cash**, credit-card payments to **2100**, the line of
  credit to **2400**, the SBA loan to **2500** (all treated as principal,
  because the chart has no interest-expense account), and sales-tax remittance
  to **2200**.
- **Equipment:** capitalisation threshold $2,500 (common de minimis policy).
  Apple Store purchases at or above it go to **1500 Equipment**, and
  `generate.ts` stops if an equipment amount falls below it.
- **Vendor refunds** go back to the original expense account.
- **Meals and entertainment** both go to **5800 Travel & Entertainment**,
  because this chart has one account for both.

### Acceptable alternates

Where the right account depends on bookkeeping policy, the vendor table's
optional `acceptable_codes` column (pipe-separated, e.g. `4100` or
`5500|6100`) lists other defensible answers. `true_account_code` stays the
primary answer. It is pre-filled for:

- client payments and Stripe payouts (4100);
- Mailchimp (6100);
- fuel (6300);
- coffee meetings (5500);
- IRS estimated tax (6200).

`hand_labels.csv` has the same column for hand-labelled rows. Reports show
**strict** accuracy (primary answer only) and **lenient** accuracy (primary
answer or an alternate).

## Measuring the engine

```bash
npx vite-node --config vitest.config.ts eval/run.ts --runs 3                  # full run (calls the API)
npx vite-node --config vitest.config.ts eval/run.ts --limit 20 --labelled-only # small smoke test
npx vite-node --config vitest.config.ts eval/run.ts --fake --limit 40          # no API calls, pipeline test
```

Options:

- `--model <id>`: defaults to the app's `CATEGORIZE_MODEL`.
- `--runs <n>`: defaults to 1. Stability across runs needs 2 or more.
- `--limit <n>`: evenly spaced rows across the dataset.
- `--labelled-only`: skip rows with no label yet.
- `--out <dir>`: defaults to `eval/results/<timestamp>/`.
- `--fake`: a stand-in model; no API calls.

The runner calls the real `categorizeTransactionsWithUsage()` in
`src/lib/categorize.ts` directly, not over HTTP. That is the same engine code
`/api/categorize` runs, including confidence adjustment, chart validation and
the app's auto-approve threshold. It passes no firm corrections. The API key
comes from the environment or `.env.local`.

Each run writes three files:

- `raw.json`: every prediction, API call, token count and timing;
- `summary.json`: the computed metrics;
- `report.md`: a plain-language report.

`eval/results/` is gitignored; commit a finished result with `git add -f`.
Rows with no label are sent to the engine, but they are left out of scoring
and counted. The report shows separately what the app did with them.
To compare models side by side, run
`npx vite-node --config vitest.config.ts eval/compare-cli.ts eval/results/<run1> eval/results/<run2> --out comparison.md`.
To pool separately saved runs of the same model (for example a second run done
on another day), run
`npx vite-node --config vitest.config.ts eval/merge-cli.ts eval/results/<run1> eval/results/<run2> --out eval/results/<pooled>`.
It refuses runs of different models, datasets, thresholds or row sets, and
writes a normal result directory that `compare-cli.ts` and `sweep-cli.ts` treat
like one `--runs n` invocation.
Two more tools work from saved runs:

- **Threshold sweep, no API calls.**
  `npx vite-node --config vitest.config.ts eval/sweep-cli.ts eval/results/<run> ... --out threshold-sweep.md`
  replays the app's auto-approve rule (no validation flag and confidence ≥ threshold) at 0.70–0.99 on the saved confidences. It checks that it reproduces the saved decisions at the app's 0.85, then reports auto-approve rate, wrong-among-auto-approved and review load.
- **Learning from corrections.**
  `npx vite-node --config vitest.config.ts eval/learn-cli.ts --base eval/results/<run>`
  treats June as reviewed. Each wrong June prediction becomes a rule through the app's own `saveRule()`. July–August rows are then matched with `applyRulesToJob()` before any AI call. Without `--run` it makes no API calls: it prints a baseline, "app today" and "rules first" projections, and the estimated cost of a live run. `--run --budget <usd>` does the live run for unmatched rows, and `--run --fake` tests the pipeline. The CLI removes Supabase settings from its environment so the app's rule code can't persist anything.

`report.ts` can re-render a saved run:
`npx vite-node --config vitest.config.ts eval/report-cli.ts eval/results/<ts>/raw.json`.

Cost comes from the token usage the API reports and the prices in
`pricing.json`. If a price is missing, the report says "cost not computed"
rather than estimating.

## How to regenerate

```bash
node eval/generate.ts      # Node 22.18+ runs TypeScript directly; no install step
```

Output is byte-identical on every run. The seed is fixed, and each vendor
draws from its own random stream, so editing one vendor doesn't change
another vendor's rows. Row ids are stable (`<date>_<vendor_key>_<n>`), which
is what keeps hand labels attached. If an edit removes a labelled row, the
script warns and names it. Frequencies and amounts live in the `SCHEDULES`
table in `generate.ts`. Description templates can use `{mmdd}` (the posting
date), `{ref}` (a random 10-character reference) and `{n4}` (4 random digits).

The upload files can be used in the app as they are. On New Close, pick the
"Standard Small Business" template, which matches `chart_of_accounts.csv`,
and upload `synthetic_upload.csv`.

## Known limits

- **One business, one chart, one bank account.** Results say nothing about
  other industries, other charts, or credit-card statements.
- **English, US-style descriptions only.**
- **The descriptions are clean imitations.** Real banks truncate,
  abbreviate and reorder merchant strings in bank-specific ways that aren't
  modelled here. Each vendor also reuses only 2–3 templates, so real data
  will vary more.
- **Frequencies and amounts are plausible guesses,** not taken from real firms.
- **SBA loan payments are labelled all principal (2500)** because the chart
  has no interest-expense account. In real books the interest portion would
  be split out to an interest-expense account.
- **Some labels are policy choices, not facts.** Examples are AR versus
  revenue for client payments, Mailchimp as marketing rather than software,
  and fuel and coffee as travel and entertainment. A categoriser that picks
  the other defensible answer will be scored wrong on these rows.
- **The ambiguous rows** measure how a categoriser handles missing
  information. Their labels reflect the project owner's judgement for this
  fictional business.

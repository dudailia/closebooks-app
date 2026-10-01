# Facts we may quote

Every number below was measured in this repo. Each has its source file and
the data it was measured on. If a number isn't here, don't quote it.

**About the data.** All accuracy, cost and latency numbers come from one
**synthetic** labelled dataset: 292 bank rows for a fictional business
(Brightline Studio LLC), one checking account, June to August 2026, the
app's 34-account "Standard Small Business" chart. 284 rows have an account
label and 8 are labelled REVIEW (payments whose account can't be known from
the bank line). Dataset: `eval/data/synthetic_transactions.csv`, sha256
`c8a4b728e0d0…`, described in `eval/README.md`. CloseBooks has no paying
customers and no real client data; nothing here was measured on real books.

**About the sources.** `eval/results/` is gitignored, but every summary file
named below (`report.md`, `summary.json`, `comparison.md`,
`threshold-sweep.md`, `strict-errors.md`, `learn-plan.md` and the two spend ledgers) is committed
with `git add -f`. The per-prediction `raw.json` files are not in git.

**Terms.** *Strict* accuracy accepts only the primary label. *Lenient* also
accepts the policy alternates listed in `eval/data/vendors.csv` (for
example, a client payment to 4100 revenue instead of 1100 AR). *Wrong among
auto-approved* is the share of rows the app would approve without a human
that have the wrong account. A *statement* is 97 rows (the dataset's monthly
average).

**Prompt version.** All runs below used the prompt before 2026-09-30's
change that labels transaction text as data (`src/lib/categorize.ts`). The
synthetic descriptions need no sanitising, so only that label differs; the
effect has not been measured.

## Accuracy per model

Source: `eval/results/comparison.md`, from each run's `summary.json`.
Threshold 0.85 (the app's value when these runs were made), batch size 20,
no firm corrections sent.

| Model | Runs | Strict | Lenient | Source |
|---|---:|---:|---:|---|
| Sonnet 4.6 | 2 | 480/568 (84.5%) | 539/568 (94.9%) | `eval/results/full-sonnet-4-6/summary.json` |
| Sonnet 5.5 | 2 (run 2 cut at 280 of 292 rows by the budget cap) | 482/556 (86.7%) | 528/556 (95.0%) | `eval/results/pooled-sonnet-5-5/summary.json` |
| Haiku 4.5 | **1 (single run)** | 214/284 (75.4%) | 246/284 (86.6%) | `eval/results/full-haiku-4-5/summary.json` |
| Opus 5.5 | 1, 100-row subset, cut at 40 rows | no usable predictions: all 8 calls failed on a reply-parsing bug since fixed | | `eval/results/subset100-opus-5-5/summary.json` |

Sonnet 5.5 per run: 246/284 strict, 270/284 lenient (run 1,
`eval/results/full-sonnet-5-5/summary.json`); 236/272 strict, 258/272
lenient (run 2, `eval/results/full-sonnet-5-5-run2/summary.json`).

## Wrong among auto-approved, at 0.85

Source: same `summary.json` files (`review.autoApprovedErrorRate`).
Quote strict and lenient together. The gap between them is policy alternates
(see "What the strict errors are", below).

| Model | Strict | Lenient |
|---|---:|---:|
| Sonnet 4.6 (2 runs) | 82/468 (17.5%) | 27/468 (5.8%) |
| Sonnet 5.5 (2 runs) | 64/418 (15.3%) | 22/418 (5.3%) |
| Haiku 4.5 (single run) | 60/230 (26.1%) | 30/230 (13.0%) |

## REVIEW rows

Source: `summary.json`, `reviewLabelled`. All REVIEW-labelled predictions
were sent to review, none auto-approved: Sonnet 4.6 16/16, Sonnet 5.5 16/16,
Haiku 4.5 8/8 (single run). There are only 8 REVIEW rows in the dataset, so
this is a small sample.

## Calibration

Expected calibration error over 10 confidence buckets (0 is perfect),
strict labels. Source: `summary.json`, `calibration.strict.ece`.

| Model | ECE strict | ECE lenient |
|---|---:|---:|
| Sonnet 4.6 (2 runs) | 0.121 | 0.055 |
| Sonnet 5.5 (2 runs) | 0.092 | 0.067 |
| Haiku 4.5 (single run) | 0.202 | 0.089 |

## Stability across runs

Source: `summary.json`, `stability`. Only models with 2 runs.

| Model | Rows compared | Different account between runs | Auto-approve decision changed | Mean confidence spread |
|---|---:|---:|---:|---:|
| Sonnet 4.6 | 292 | 4 (1.4%) | 6 (2.1%) | 0.007 |
| Sonnet 5.5 | 280 | 8 (2.9%) | 9 (3.2%) | 0.013 |

Two runs is the minimum to see variation; it doesn't bound it.

## Threshold sweep

Source: `eval/results/threshold-sweep.md`, produced by `eval/sweep-cli.ts`
from saved confidences (no new API calls). The app's decision depends only
on confidence, validation flags and threshold, so the recomputation is exact
for these predictions, but no run was made at these thresholds. Review load
includes REVIEW rows.

| Model | Threshold | Auto-approved | Wrong among auto-approved, lenient | Wrong among auto-approved, strict | Review rows per 97-row statement |
|---|---:|---:|---:|---:|---:|
| Sonnet 4.6 (2 runs) | 0.85 | 468 (82.4%) | 27 (5.8%) | 82 (17.5%) | 19.3 |
| Sonnet 4.6 | 0.91 | 334 (58.8%) | 18 (5.4%) | 56 (16.8%) | 41.5 |
| Sonnet 4.6 | 0.93 | 298 (52.5%) | 15 (5.0%) | 38 (12.8%) | 47.5 |
| Sonnet 5.5 (2 runs pooled) | 0.85 | 418 (75.2%) | 22 (5.3%) | 64 (15.3%) | 26.1 |
| Sonnet 5.5 | 0.91 | 291 (52.3%) | 4 (1.4%) | 27 (9.3%) | 47.7 |
| Sonnet 5.5 | **0.93 (app default now)** | 274 (49.3%) | 1 (0.4%) | 20 (7.3%) | 50.5 |
| Sonnet 5.5 | 0.94 | 242 (43.5%) | 0 (0.0%) | 4 (1.7%) | 56.0 |

Per run at 0.93, Sonnet 5.5: 137 auto-approved, 0 wrong lenient and 8 (5.8%)
strict (run 1); 137 auto-approved, 1 (0.7%) lenient and 12 (8.8%) strict
(run 2). Sonnet 4.6 first reaches at most 2% lenient wrong at 0.98 (4.4%
auto-approved, 0 wrong of 25 lenient and strict, 92.8 review rows per
statement). The 2% target that picked 0.93 was set on the lenient figure;
for Sonnet 5.5 the lowest threshold with at most 2% strict wrong is 0.94.

### What the strict errors are

Source: `eval/results/strict-errors.md`, produced by
`eval/strict-errors-cli.ts` from the same saved predictions (no API calls). A
*policy alternate* is an account `eval/data/vendors.csv` accepts for that
vendor; anything else is a real mistake. Strict wrong minus policy alternates
is the lenient count.

At 0.93, Sonnet 5.5 (2 runs pooled): 20 strict errors among 274 auto-approved
rows. **19 are policy alternates:** 18 client payments (9 ACH credits from two
clients, 4 incoming wires, 5 Stripe payouts in the `STRIPE DES:TRANSFER`
format) booked to 4100 Service Revenue instead of 1100 Accounts Receivable, and 1 Mailchimp charge booked to 6100 Subscriptions &
Software instead of 5500 Marketing. **1 is a real mistake:** a Gusto
payroll-tax payment booked to 5100 Payroll & Wages instead of 2300 Payroll
Liabilities.

At 0.85 the same runs have 64 strict errors: 42 policy alternates and 22 real
mistakes (14 Stripe payouts to 4000 Sales Revenue, 4 Gusto payroll tax to
5100, 2 Square workshop sales to 4000, 2 Gusto fees to 5100). Sonnet 4.6 at
0.93: 38 strict, 23 policy alternates, 15 real mistakes (9 payroll tax and 6
sales-tax remittances to 6200 Taxes & Licenses).

The app now uses Sonnet 5.5 at 0.93 (`src/lib/ai/models.ts`). That choice
rests on this sweep; it has not been re-run at 0.93 as a live eval.

### Confidence of the known errors

Source: `eval/results/strict-errors.md`, "Every strict error, any
confidence" (the confidence after the app's own adjustments). These are the
errors the prompt causes; a threshold can only catch the ones below it.

| Model | Correct account | Booked to | Rows | Confidence |
|---|---|---|---:|---|
| Sonnet 5.5 (2 runs) | 1100 Accounts Receivable | 4000 Sales Revenue (Stripe payouts) | 14 | 0.85 to 0.92 |
| Sonnet 5.5 (2 runs) | 2300 Payroll Liabilities | 5100 Payroll & Wages (Gusto tax) | 4 | 0.85 to 0.93 |
| Sonnet 5.5 (2 runs) | 2500 Long-Term Loan | 2400 Short-Term Loan (SBA loan) | 2 | 0.80 |
| Sonnet 4.6 (2 runs) | 2300 Payroll Liabilities | 6200 Taxes & Licenses | 9 | 0.95 to 0.97 |
| Sonnet 4.6 (2 runs) | 2200 Sales Tax Payable | 6200 Taxes & Licenses | 6 | 0.95 to 0.97 |
| Sonnet 4.6 (2 runs) | 2500 Long-Term Loan | 2400 Short-Term Loan | 6 | 0.82 to 0.90 |

## Rules from corrections

**Projection, not a live run.** Source: `eval/results/learn-plan.md`,
produced by `eval/learn-cli.ts` from saved predictions of **Sonnet 4.6 run
1** (not the current model). June (104 rows) treated as reviewed, every
wrong June row corrected and turned into a rule; July and August (188 rows)
matched with the app's rule code.

- Rules matched 5 of 188 July to August rows, all 5 correct; no wrong matches.
- Accuracy on those 188 rows: 94.5% lenient and 84.7% strict without rules;
  95.6% lenient and 86.3% strict with rules first.
- Wrong auto-approvals: 8 (5.3%) lenient and 26 (17.1%) strict without rules;
  6 (3.9%) lenient and 23 (15.1%) strict with rules. These use the saved
  run's 0.85 statuses, not 0.93.
- 16 July to August rows came from vendors with a June correction; the other 11 use a second bank-line format the rules didn't see.

## Latency

Batch wall-clock time divided by batch size (20 rows), so it depends on
network and API load when the run was made. Source: `summary.json`,
`latency.perTransactionMs`.

| Model | Median per transaction | p90 |
|---|---:|---:|
| Sonnet 4.6 (2 runs) | 1.15 s | 1.29 s |
| Sonnet 5.5 (2 runs) | 0.43 s | 0.46 s |
| Haiku 4.5 (single run) | 0.53 s | 0.64 s |

## Live preview run (one timed run)

**Not an eval result.** Measured by hand on the `overnight` preview deployment
(Supabase on, a new test account), 2026-10-01: one upload of the 292-row
synthetic file (`eval/data/synthetic_upload.csv`), Sonnet 5.5 at 0.93, 4
batches at once, no rules saved yet. Source: the owner's test notes,
recorded in `SESSION_LOG.md`.

- Categorisation took **about 40 s** (stopwatch, one run). It depends on
  network and API load at the time.
- **128 of 292 rows auto-approved (43.8%), 164 pending, 0 flagged.**

The eval's 49.3% auto-approved at 0.93 (threshold sweep) counts only
account-labelled rows over 2 saved runs made before the "data, not
instructions" prompt label; this is one live run over all 292 rows, so the
two are not the same measure.

## Cost

API-reported tokens times list prices in `eval/pricing.json` (checked
2026-09-29 against https://platform.claude.com/docs/en/about-claude/pricing;
no batch discount, no prompt caching). Source: `summary.json`, `cost`.

| Model | Per transaction | Per 97-row statement |
|---|---:|---:|
| Sonnet 4.6 | $0.00164 | $0.160 |
| Sonnet 5.5 | $0.00115 | $0.111 |
| Haiku 4.5 (single run) | $0.00052 | $0.050 |

This is the categorisation call only. PDF extraction (`/api/parse-pdf`) was
not measured.

## Total eval spend

| When | Amount | Source |
|---|---:|---|
| 2026-09-29, 20-row smoke test | $0.0333 | `eval/results/2026-09-29T15-54-43Z/summary.json` |
| 2026-09-29, capped runs (Sonnet 4.6 ×2, Haiku 4.5, Sonnet 5.5, Opus 5.5 subset) | $1.9102 | `eval/results/spend-ledger.json` |
| 2026-09-30, Sonnet 5.5 run 2, plus 4 calls from an interrupted run whose results weren't saved | $0.4136 | `eval/results/spend-ledger-2026-09-30.json` |
| **Total** | **$2.3571** | |

## Tests

131 tests in 15 files, all passing (`npm test`, vitest, run 2026-09-30 on
branch `eval-harness`). They cover the categorisation engine with a mocked
API client (`src/lib/__tests__/categorize.test.ts`), persistence fallbacks,
rules and vendor keys, journal entries, approval counts, concurrent
batching with a fake model, prompt sanitising, the API allowlist, and the eval
harness's scoring, reports and budget cap (`eval/__tests__/`).

On branch `overnight` (2026-10-01): 178 tests in 21 files, all passing
(`npm test`), adding client-by-id matching, chart templates, the fake model,
request building for the prompt and caching experiments, and 17 migration
tests that apply every file in `supabase/migrations/` to PGlite
(`supabase/__tests__/migrations.test.ts`). One end-to-end browser test
(`npm run e2e`, Playwright, demo mode, fake model) covers the core path; it
says nothing about accuracy.

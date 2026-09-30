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

**About the sources.** `eval/results/` is gitignored, so the result files
named below exist on the development machine and are not in git. Commit one
with `git add -f` before sending it to a reviewer.

**Terms.** *Strict* accuracy accepts only the primary label. *Lenient* also
accepts the policy alternates listed in `eval/data/vendors.csv` (for
example, a client payment to 4100 revenue instead of 1100 AR). *Wrong among
auto-approved* is the share of rows the app would approve without a human
that have the wrong account. A *statement* is 97 rows (the dataset's monthly
average).

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
for these predictions, but no run was made at these thresholds. Lenient
counts. Review load includes REVIEW rows.

| Model | Threshold | Auto-approved | Wrong among auto-approved | Review rows per 97-row statement |
|---|---:|---:|---:|---:|
| Sonnet 4.6 (2 runs) | 0.85 | 468 (82.4%) | 27 (5.8%) | 19.3 |
| Sonnet 4.6 | 0.91 | 334 (58.8%) | 18 (5.4%) | 41.5 |
| Sonnet 4.6 | 0.93 | 298 (52.5%) | 15 (5.0%) | 47.5 |
| Sonnet 5.5 (2 runs pooled) | 0.85 | 418 (75.2%) | 22 (5.3%) | 26.1 |
| Sonnet 5.5 | 0.91 | 291 (52.3%) | 4 (1.4%) | 47.7 |
| Sonnet 5.5 | **0.93 (app default now)** | 274 (49.3%) | 1 (0.4%) | 50.5 |

Per run at 0.93, Sonnet 5.5: 137 auto-approved, 0 wrong (run 1); 137
auto-approved, 1 wrong (run 2). Sonnet 4.6 first reaches at most 2% wrong at
0.98 (4.4% auto-approved, 92.8 review rows per statement).

The app now uses Sonnet 5.5 at 0.93 (`src/lib/ai/models.ts`). That choice
rests on this sweep; it has not been re-run at 0.93 as a live eval.

## Rules from corrections

**Projection, not a live run.** Source: `eval/results/learn-plan.md`,
produced by `eval/learn-cli.ts` from saved predictions of **Sonnet 4.6 run
1** (not the current model). June (104 rows) treated as reviewed, every
wrong June row corrected and turned into a rule; July and August (188 rows)
matched with the app's rule code.

- Rules matched 5 of 188 July to August rows, all 5 correct; no wrong matches.
- Lenient accuracy on those 188 rows: 94.5% without rules, 95.6% with rules first.
- Wrong auto-approvals (lenient): 8 (5.3%) without rules, 6 (3.9%) with.
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

116 tests in 12 files, all passing (`npm test`, vitest, run 2026-09-30 on
branch `eval-harness`). They cover the categorisation engine with a mocked
API client (`src/lib/__tests__/categorize.test.ts`), persistence fallbacks,
rules and vendor keys, journal entries, approval counts, and the eval
harness's scoring, reports and budget cap (`eval/__tests__/`). There are no
end-to-end browser tests.

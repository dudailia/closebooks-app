# Categorisation eval report

> **SMOKE TEST: 20 of 262 labelled rows. Not a result.**
> Numbers below describe only these rows and are too few to compare models or settings.

**Measured on:** 292-row synthetic dataset; this run sent 20 rows to the engine (20 scored, 0 excluded because they have no label yet). Brightline Studio LLC (fictional), Standard Small Business chart (34 accounts), model `claude-sonnet-4-6`, 1 run.

**Engine:** the real `categorizeTransactionsWithUsage` in `src/lib/categorize.ts`, called directly (the same code `/api/categorize` runs), batch size 20, auto-approve threshold 0.85, no firm corrections supplied. Commit `c4780d18`, dataset sha256 `929ace192266`, run 2026-09-29T15:54:43.069Z → 2026-09-29T15:55:07.569Z.

**How to read it:** *strict* counts a row correct only if the engine picked the primary label. *Lenient* also accepts the alternates listed where the right account is a bookkeeping policy choice (e.g. 1100 vs 4100 for client payments). *Auto-approved* means the app would set the row to approved without a human; everything else is *sent to review* (status pending or flagged).

## Headline

On 20 scored rows × 1 run = 20 scored predictions:

| Measure | Value |
|---|---|
| Accuracy, strict | 16 of 20 (80.0%) |
| Accuracy, lenient | 19 of 20 (95.0%) |
| Auto-approved | 16 of 20 (80.0%) |
| **Wrong among auto-approved** (strict / lenient) | **18.8% / 0.0%** (3 / 0 of 16) |
| Sent to review | 4 of 20 (20.0%) (4 pending, 0 flagged) |
| Account not in the chart | 0 of 20 (0.0%) |
| No prediction (batch failed or row skipped) | 0 of 20 (0.0%) |
| Cost per transaction | $0.00166 |
| Latency per batch (median) | 24.50 s |

## Auto-approved vs sent to review

On 20 scored rows × 1 run = 20 scored predictions. The app auto-approves a row when confidence ≥ 0.85 and chart validation raised no flag.

| Group | Predictions | Correct (strict) | Correct (lenient) |
|---|---:|---:|---:|
| Auto-approved | 16 | 13 of 16 (81.3%) | 16 of 16 (100.0%) |
| Sent to review | 4 | 3 of 4 (75.0%) | 3 of 4 (75.0%) |

An auto-approved mistake reaches the books unless someone checks the approved list; a mistake sent to review costs reviewer time but is likely caught.

## Accuracy by account

On 20 scored rows × 1 run = 20 scored predictions, grouped by the true account (each row counts once per run). *Predicted as* counts how often the engine chose that account; *precision* is how often that choice was right.

| Account | Predictions | Strict | Lenient | Predicted as | Precision |
|---|---:|---:|---:|---:|---:|
| 1100 Accounts Receivable | 3 | 0 of 3 (0.0%) | 3 of 3 (100.0%) | 0 | — |
| 4100 Service Revenue | 0 | — | — | 3 | 0.0% |
| 5100 Payroll & Wages | 1 | 1 of 1 (100.0%) | 1 of 1 (100.0%) | 1 | 100.0% |
| 5200 Rent & Lease | 1 | 1 of 1 (100.0%) | 1 of 1 (100.0%) | 1 | 100.0% |
| 5400 Office Supplies | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 3 | 66.7% |
| 5500 Marketing & Advertising | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 2 | 100.0% |
| 5700 Professional Fees | 1 | 1 of 1 (100.0%) | 1 of 1 (100.0%) | 1 | 100.0% |
| 5800 Travel & Entertainment | 8 | 8 of 8 (100.0%) | 8 of 8 (100.0%) | 8 | 100.0% |
| 6100 Subscriptions & Software | 1 | 1 of 1 (100.0%) | 1 of 1 (100.0%) | 1 | 100.0% |
| 6300 Miscellaneous Expense | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |

## Most common mistakes

On 20 scored rows × 1 run = 20 scored predictions. Strict mistakes, most frequent first; ✓ marks a prediction that is an accepted alternate.

| True | Predicted | Count | Alternate? | Example description |
|---|---|---:|:---:|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 3 | ✓ | `STRIPE TRANSFER ST-KD332G29MX` |
| 6300 Miscellaneous Expense | 5400 Office Supplies | 1 |  | `ACE HARDWARE #07891 AUSTIN TX` |

## Calibration

On 20 scored rows × 1 run = 20 scored predictions. Does the confidence number mean what it says? In a well-calibrated engine, rows given 0.9 are right about 90% of the time.

| Confidence | Predictions | Mean confidence | Actual accuracy (strict) | Actual accuracy (lenient) |
|---|---:|---:|---:|---:|
| 0.6–0.7 | 1 | 0.60 | 100.0% | 100.0% |
| 0.7–0.8 | 1 | 0.75 | 0.0% | 0.0% |
| 0.8–0.9 | 5 | 0.85 | 80.0% | 100.0% |
| 0.9–1.0 | 13 | 0.95 | 84.6% | 100.0% |

Expected calibration error: **0.138** strict, **0.127** lenient (0 = perfect; the average gap between confidence and accuracy, weighted by rows).

## Stability across runs

Not measured: this was 1 run. Use `--runs 3` or more to see how often the same row gets a different answer.

## Latency

On 1 batch of up to 20 rows (all rows sent, labelled or not). Wall-clock, including retries.

| | Median | p90 |
|---|---:|---:|
| Per batch | 24.50 s | 24.50 s |
| Per transaction (batch time ÷ batch size) | 1.22 s | 1.22 s |
| Per API call | 24.50 s | 24.50 s |

## Cost and tokens

From the token usage the API reported for every call in this run (1 call, 0 failed; failed calls are billed too) and prices in `eval/pricing.json` (https://platform.claude.com/docs/en/about-claude/pricing, checked 2026-09-29).

| | Value |
|---|---:|
| Input tokens | 2,710 |
| Output tokens | 1,677 |
| Cache read / write tokens | 0 / 0 |
| Total cost of this run | $0.0333 |
| Cost per transaction | $0.00166 |
| Cost per statement (97 transactions, the dataset's monthly average) | $0.1614 |

## Rows not scored

None: every row sent had a label.

## Limits

- **Synthetic data.** One fictional business, one bank account, three months, US-English descriptions drawn from 2–3 templates per vendor. Real bank feeds are messier; expect real accuracy to differ, likely downward.
- **Labels are one bookkeeper's policy.** Where two answers are defensible only the listed alternates are accepted, so strict accuracy understates a model that picks the other reasonable answer.
- **Not every account is exercised.** Accounts with few rows have wide uncertainty; a handful of rows can swing their accuracy by tens of points.
- **No firm corrections.** The app feeds a firm's past corrections into the prompt; this run supplies none, like a brand-new firm.
- **The model sees the chart names only.** The dataset's `why` notes and policy are never shown to it.
- **Latency** depends on network and API load at run time; compare runs taken close together.
- **Cost** uses list prices on the date checked, without batch, caching or negotiated discounts.
- **This run covers 20 of 262 labelled rows.** It checks that the harness works; it says little about the engine.

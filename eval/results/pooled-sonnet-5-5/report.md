# Categorisation eval report

> **CUT BY BUDGET CAP: run 2 of 2 stopped after 280 of 292 rows.** The rest were never sent. Numbers below cover only the finished part.

**Measured on:** 292-row synthetic dataset; this run planned 292 rows per run and finished 1 full run plus 280 rows of run 2 before the budget cap (284 with an account label, 8 labelled REVIEW, 0 excluded because they have no label yet). Brightline Studio LLC (fictional), Standard Small Business chart (34 accounts), model `claude-sonnet-5-5`, 2 runs (run 2 cut short by the budget cap).

**Engine:** the real `categorizeTransactionsWithUsage` in `src/lib/categorize.ts`, called directly (the same code `/api/categorize` runs), batch size 20, auto-approve threshold 0.85, no firm corrections supplied. Commit `0935f359 + 125e1a9e`, dataset sha256 `c8a4b728e0d0`, run 2026-09-29T20:21:42.312Z → 2026-09-30T12:38:05.313Z. Pooled from separately saved runs: 2026-09-29T20:21:42.312Z (1 run, 0935f359); 2026-09-30T12:27:39.889Z (1 run, 125e1a9e).

**How to read it:** *strict* counts a row correct only if the engine picked the primary label. *Lenient* also accepts the alternates listed where the right account is a bookkeeping policy choice (e.g. 1100 vs 4100 for client payments). *Auto-approved* means the app would set the row to approved without a human; everything else is *sent to review* (status pending or flagged).

## Headline

On 556 scored predictions (284 rows with an account label, 2 runs (run 2 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"):

| Measure | Value |
|---|---|
| Accuracy, strict | 482 of 556 (86.7%) |
| Accuracy, lenient | 528 of 556 (95.0%) |
| Auto-approved | 418 of 556 (75.2%) |
| **Wrong among auto-approved** (strict / lenient) | **15.3% / 5.3%** (64 / 22 of 418) |
| Sent to review | 138 of 556 (24.8%) (138 pending, 0 flagged) |
| Account not in the chart | 0 of 556 (0.0%) |
| REVIEW rows sent to review (correct = not auto-approved) | 16 of 16 (100.0%) |
| No prediction (batch failed or row skipped) | 0 of 556 (0.0%) |
| Cost per transaction | $0.00115 |
| Latency per batch (median) | 8.56 s |

## Unknowable from the bank line: sent to review 16 of 16

On 16 predictions for the 8 rows labelled REVIEW (2 runs (run 2 cut short by the budget cap)). These are payments whose right account can't be known from the bank description (Venmo, PayPal, Zelle to a person). The only correct outcome is that the app does **not** auto-approve them; the account it suggests doesn't matter. They are excluded from every account-accuracy number in this report.

- Sent to review (correct): 16 of 16 (100.0%)
- Auto-approved (wrong): 0 of 16 (0.0%)

## Auto-approved vs sent to review

On 556 scored predictions (284 rows with an account label, 2 runs (run 2 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). The app auto-approves a row when confidence ≥ 0.85 and chart validation raised no flag.

| Group | Predictions | Correct (strict) | Correct (lenient) |
|---|---:|---:|---:|
| Auto-approved | 418 | 354 of 418 (84.7%) | 396 of 418 (94.7%) |
| Sent to review | 138 | 128 of 138 (92.8%) | 132 of 138 (95.7%) |

An auto-approved mistake reaches the books unless someone checks the approved list; a mistake sent to review costs reviewer time but is likely caught.

## Accuracy by account

On 556 scored predictions (284 rows with an account label, 2 runs (run 2 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"), grouped by the true account (each row counts once per run). *Predicted as* counts how often the engine chose that account; *precision* is how often that choice was right.

| Account | Predictions | Strict | Lenient | Predicted as | Precision |
|---|---:|---:|---:|---:|---:|
| 1010 Savings Account | 8 | 8 of 8 (100.0%) | 8 of 8 (100.0%) | 8 | 100.0% |
| 1020 Petty Cash | 4 | 0 of 4 (0.0%) | 0 of 4 (0.0%) | 0 | — |
| 1100 Accounts Receivable | 54 | 0 of 54 (0.0%) | 40 of 54 (74.1%) | 0 | — |
| 1500 Equipment | 4 | 4 of 4 (100.0%) | 4 of 4 (100.0%) | 4 | 100.0% |
| 2100 Credit Card Payable | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 6 | 100.0% |
| 2200 Sales Tax Payable | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 6 | 100.0% |
| 2300 Payroll Liabilities | 11 | 7 of 11 (63.6%) | 7 of 11 (63.6%) | 7 | 100.0% |
| 2400 Short-Term Loan | 5 | 5 of 5 (100.0%) | 5 of 5 (100.0%) | 7 | 71.4% |
| 2500 Long-Term Loan | 5 | 3 of 5 (60.0%) | 3 of 5 (60.0%) | 3 | 100.0% |
| 3000 Owner's Equity | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 2 | 100.0% |
| 3100 Owner's Draw | 13 | 12 of 13 (92.3%) | 13 of 13 (100.0%) | 16 | 75.0% |
| 4000 Sales Revenue | 0 | — | — | 16 | 0.0% |
| 4100 Service Revenue | 4 | 2 of 4 (50.0%) | 2 of 4 (50.0%) | 42 | 4.8% |
| 4200 Other Income | 5 | 5 of 5 (100.0%) | 5 of 5 (100.0%) | 5 | 100.0% |
| 5100 Payroll & Wages | 11 | 11 of 11 (100.0%) | 11 of 11 (100.0%) | 17 | 64.7% |
| 5200 Rent & Lease | 12 | 12 of 12 (100.0%) | 12 of 12 (100.0%) | 12 | 100.0% |
| 5300 Utilities | 18 | 18 of 18 (100.0%) | 18 of 18 (100.0%) | 18 | 100.0% |
| 5400 Office Supplies | 75 | 75 of 75 (100.0%) | 75 of 75 (100.0%) | 79 | 94.9% |
| 5500 Marketing & Advertising | 52 | 51 of 52 (98.1%) | 52 of 52 (100.0%) | 51 | 100.0% |
| 5600 Insurance | 18 | 18 of 18 (100.0%) | 18 of 18 (100.0%) | 18 | 100.0% |
| 5700 Professional Fees | 24 | 24 of 24 (100.0%) | 24 of 24 (100.0%) | 24 | 100.0% |
| 5800 Travel & Entertainment | 134 | 134 of 134 (100.0%) | 134 of 134 (100.0%) | 134 | 100.0% |
| 6000 Bank Fees & Charges | 9 | 9 of 9 (100.0%) | 9 of 9 (100.0%) | 9 | 100.0% |
| 6100 Subscriptions & Software | 68 | 66 of 68 (97.1%) | 66 of 68 (97.1%) | 67 | 98.5% |
| 6200 Taxes & Licenses | 4 | 4 of 4 (100.0%) | 4 of 4 (100.0%) | 5 | 80.0% |
| 6300 Miscellaneous Expense | 4 | 0 of 4 (0.0%) | 4 of 4 (100.0%) | 0 | — |

## Most common mistakes

On 556 scored predictions (284 rows with an account label, 2 runs (run 2 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). Strict mistakes, most frequent first; ✓ marks a prediction that is an accepted alternate.

| True | Predicted | Count | Alternate? | Example description |
|---|---|---:|:---:|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 40 | ✓ | `MOBILE DEPOSIT CHECK #8294` |
| 1100 Accounts Receivable | 4000 Sales Revenue | 14 |  | `STRIPE TRANSFER ST-CKA0BCSQP1` |
| 1020 Petty Cash | 3100 Owner's Draw | 4 |  | `ATM WITHDRAWAL 06/12 1100 CONGRESS AVE AUSTIN TX` |
| 2300 Payroll Liabilities | 5100 Payroll & Wages | 4 |  | `GUSTO DES:TAX 07/15 ID:GPKCX0DF2J INDN:BRIGHTLINE STUDIO LLC` |
| 6300 Miscellaneous Expense | 5400 Office Supplies | 4 | ✓ | `ACE HARDWARE #07891 AUSTIN TX` |
| 2500 Long-Term Loan | 2400 Short-Term Loan | 2 |  | `SBA EIDL LOAN PAYMENT 40D1M47D7L` |
| 4100 Service Revenue | 4000 Sales Revenue | 2 |  | `SQUARE INC DES:SQ06/15 ID:T366DTBCWFKC WORKSHOP` |
| 6100 Subscriptions & Software | 5100 Payroll & Wages | 2 |  | `GUSTO DES:FEE 07/01 ID:X2VMZ48QA7` |
| 3100 Owner's Draw | 6200 Taxes & Licenses | 1 | ✓ | `IRS DES:USATAXPYMT ID:E2BCDTP7UA INDN:JORDAN REYES` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | ✓ | `INTUIT *MAILCHIMP ATLANTA GA` |

## Calibration

On 556 scored predictions (284 rows with an account label, 2 runs (run 2 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). Does the confidence number mean what it says? In a well-calibrated engine, rows given 0.9 are right about 90% of the time.

| Confidence | Predictions | Mean confidence | Actual accuracy (strict) | Actual accuracy (lenient) |
|---|---:|---:|---:|---:|
| 0.6–0.7 | 28 | 0.63 | 85.7% | 85.7% |
| 0.7–0.8 | 70 | 0.73 | 94.3% | 100.0% |
| 0.8–0.9 | 132 | 0.85 | 80.3% | 87.9% |
| 0.9–1.0 | 326 | 0.95 | 87.7% | 97.5% |

Expected calibration error: **0.092** strict, **0.067** lenient (0 = perfect; the average gap between confidence and accuracy, weighted by rows).

## Stability across runs

On 280 rows seen in all 2 runs (all rows sent, labelled or not):

- Got a different account in at least one run: 8 of 280 (2.9%)
- Auto-approve decision changed between runs: 9 of 280 (3.2%)
- Average confidence spread (max − min) per row: 0.013

## Latency

On 29 batches of up to 20 rows (all rows sent, labelled or not). Wall-clock, including retries.

| | Median | p90 |
|---|---:|---:|
| Per batch | 8.56 s | 9.14 s |
| Per transaction (batch time ÷ batch size) | 430 ms | 457 ms |
| Per API call | 8.56 s | 9.14 s |

## Cost and tokens

From the token usage the API reported for every call in this run (29 calls, 0 failed; failed calls are billed too) and prices in `eval/pricing.json` (https://platform.claude.com/docs/en/about-claude/pricing, checked 2026-09-29).

| | Value |
|---|---:|
| Input tokens | 110,853 |
| Output tokens | 43,482 |
| Cache read / write tokens | 0 / 0 |
| Total cost of this run | $0.6565 |
| Cost per transaction | $0.00115 |
| Cost per statement (97 transactions, the dataset's monthly average) | $0.1113 |

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

# Categorisation eval report

**Measured on:** 292-row synthetic dataset; this run sent 292 rows to the engine (284 with an account label, 8 labelled REVIEW, 0 excluded because they have no label yet). Brightline Studio LLC (fictional), Standard Small Business chart (34 accounts), model `claude-sonnet-4-6`, 2 runs.

**Engine:** the real `categorizeTransactionsWithUsage` in `src/lib/categorize.ts`, called directly (the same code `/api/categorize` runs), batch size 20, auto-approve threshold 0.85, no firm corrections supplied. Commit `0935f359`, dataset sha256 `c8a4b728e0d0`, run 2026-09-29T20:07:02.796Z → 2026-09-29T20:18:25.906Z.

**How to read it:** *strict* counts a row correct only if the engine picked the primary label. *Lenient* also accepts the alternates listed where the right account is a bookkeeping policy choice (e.g. 1100 vs 4100 for client payments). *Auto-approved* means the app would set the row to approved without a human; everything else is *sent to review* (status pending or flagged).

## Headline

On 568 scored predictions (284 rows with an account label, 2 runs) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"):

| Measure | Value |
|---|---|
| Accuracy, strict | 480 of 568 (84.5%) |
| Accuracy, lenient | 539 of 568 (94.9%) |
| Auto-approved | 468 of 568 (82.4%) |
| **Wrong among auto-approved** (strict / lenient) | **17.5% / 5.8%** (82 / 27 of 468) |
| Sent to review | 100 of 568 (17.6%) (100 pending, 0 flagged) |
| Account not in the chart | 0 of 568 (0.0%) |
| REVIEW rows sent to review (correct = not auto-approved) | 16 of 16 (100.0%) |
| No prediction (batch failed or row skipped) | 0 of 568 (0.0%) |
| Cost per transaction | $0.00164 |
| Latency per batch (median) | 22.38 s |

## Unknowable from the bank line: sent to review 16 of 16

On 16 predictions for the 8 rows labelled REVIEW (2 runs). These are payments whose right account can't be known from the bank description (Venmo, PayPal, Zelle to a person). The only correct outcome is that the app does **not** auto-approve them; the account it suggests doesn't matter. They are excluded from every account-accuracy number in this report.

- Sent to review (correct): 16 of 16 (100.0%)
- Auto-approved (wrong): 0 of 16 (0.0%)

## Auto-approved vs sent to review

On 568 scored predictions (284 rows with an account label, 2 runs) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). The app auto-approves a row when confidence ≥ 0.85 and chart validation raised no flag.

| Group | Predictions | Correct (strict) | Correct (lenient) |
|---|---:|---:|---:|
| Auto-approved | 468 | 386 of 468 (82.5%) | 441 of 468 (94.2%) |
| Sent to review | 100 | 94 of 100 (94.0%) | 98 of 100 (98.0%) |

An auto-approved mistake reaches the books unless someone checks the approved list; a mistake sent to review costs reviewer time but is likely caught.

## Accuracy by account

On 568 scored predictions (284 rows with an account label, 2 runs) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"), grouped by the true account (each row counts once per run). *Predicted as* counts how often the engine chose that account; *precision* is how often that choice was right.

| Account | Predictions | Strict | Lenient | Predicted as | Precision |
|---|---:|---:|---:|---:|---:|
| 1010 Savings Account | 8 | 8 of 8 (100.0%) | 8 of 8 (100.0%) | 8 | 100.0% |
| 1020 Petty Cash | 4 | 3 of 4 (75.0%) | 3 of 4 (75.0%) | 3 | 100.0% |
| 1100 Accounts Receivable | 54 | 0 of 54 (0.0%) | 52 of 54 (96.3%) | 0 | — |
| 1500 Equipment | 4 | 4 of 4 (100.0%) | 4 of 4 (100.0%) | 4 | 100.0% |
| 2100 Credit Card Payable | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 6 | 100.0% |
| 2200 Sales Tax Payable | 6 | 0 of 6 (0.0%) | 0 of 6 (0.0%) | 0 | — |
| 2300 Payroll Liabilities | 12 | 3 of 12 (25.0%) | 3 of 12 (25.0%) | 3 | 100.0% |
| 2400 Short-Term Loan | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 12 | 50.0% |
| 2500 Long-Term Loan | 6 | 0 of 6 (0.0%) | 0 of 6 (0.0%) | 0 | — |
| 3000 Owner's Equity | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 2 | 100.0% |
| 3100 Owner's Draw | 14 | 12 of 14 (85.7%) | 14 of 14 (100.0%) | 12 | 100.0% |
| 4000 Sales Revenue | 0 | — | — | 2 | 0.0% |
| 4100 Service Revenue | 4 | 4 of 4 (100.0%) | 4 of 4 (100.0%) | 56 | 7.1% |
| 4200 Other Income | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 6 | 100.0% |
| 5100 Payroll & Wages | 12 | 12 of 12 (100.0%) | 12 of 12 (100.0%) | 12 | 100.0% |
| 5200 Rent & Lease | 12 | 12 of 12 (100.0%) | 12 of 12 (100.0%) | 12 | 100.0% |
| 5300 Utilities | 18 | 17 of 18 (94.4%) | 17 of 18 (94.4%) | 17 | 100.0% |
| 5400 Office Supplies | 76 | 76 of 76 (100.0%) | 76 of 76 (100.0%) | 81 | 93.8% |
| 5500 Marketing & Advertising | 52 | 51 of 52 (98.1%) | 52 of 52 (100.0%) | 51 | 100.0% |
| 5600 Insurance | 18 | 18 of 18 (100.0%) | 18 of 18 (100.0%) | 18 | 100.0% |
| 5700 Professional Fees | 24 | 24 of 24 (100.0%) | 24 of 24 (100.0%) | 26 | 92.3% |
| 5800 Travel & Entertainment | 138 | 138 of 138 (100.0%) | 138 of 138 (100.0%) | 138 | 100.0% |
| 6000 Bank Fees & Charges | 10 | 10 of 10 (100.0%) | 10 of 10 (100.0%) | 12 | 83.3% |
| 6100 Subscriptions & Software | 68 | 64 of 68 (94.1%) | 64 of 68 (94.1%) | 66 | 97.0% |
| 6200 Taxes & Licenses | 4 | 4 of 4 (100.0%) | 4 of 4 (100.0%) | 21 | 19.0% |
| 6300 Miscellaneous Expense | 4 | 0 of 4 (0.0%) | 4 of 4 (100.0%) | 0 | — |

## Most common mistakes

On 568 scored predictions (284 rows with an account label, 2 runs) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). Strict mistakes, most frequent first; ✓ marks a prediction that is an accepted alternate.

| True | Predicted | Count | Alternate? | Example description |
|---|---|---:|:---:|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 52 | ✓ | `STRIPE TRANSFER ST-CKA0BCSQP1` |
| 2300 Payroll Liabilities | 6200 Taxes & Licenses | 9 |  | `GUSTO DES:TAX 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC` |
| 2200 Sales Tax Payable | 6200 Taxes & Licenses | 6 |  | `TX COMPTROLLER DES:SALES TAX ID:4WL4C50FFN` |
| 2500 Long-Term Loan | 2400 Short-Term Loan | 6 |  | `SBA EIDL LOAN PAYMENT 40D1M47D7L` |
| 6300 Miscellaneous Expense | 5400 Office Supplies | 4 | ✓ | `ACE HARDWARE #07891 AUSTIN TX` |
| 1100 Accounts Receivable | 4000 Sales Revenue | 2 |  | `STRIPE TRANSFER ST-BPQBDJJ8SM` |
| 3100 Owner's Draw | 6200 Taxes & Licenses | 2 | ✓ | `IRS DES:USATAXPYMT ID:E2BCDTP7UA INDN:JORDAN REYES` |
| 6100 Subscriptions & Software | 5700 Professional Fees | 2 |  | `GUSTO DES:FEE 07/01 ID:X2VMZ48QA7` |
| 6100 Subscriptions & Software | 6000 Bank Fees & Charges | 2 |  | `GUSTO.COM MONTHLY FEE` |
| 1020 Petty Cash | 5400 Office Supplies | 1 |  | `ATM WITHDRAWAL 08/06 1100 CONGRESS AVE AUSTIN TX` |
| 5300 Utilities | 6100 Subscriptions & Software | 1 |  | `CHARTER COMM* SPECTRUM 855-707-7328` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | ✓ | `INTUIT *MAILCHIMP ATLANTA GA` |

## Calibration

On 568 scored predictions (284 rows with an account label, 2 runs) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). Does the confidence number mean what it says? In a well-calibrated engine, rows given 0.9 are right about 90% of the time.

| Confidence | Predictions | Mean confidence | Actual accuracy (strict) | Actual accuracy (lenient) |
|---|---:|---:|---:|---:|
| 0.6–0.7 | 5 | 0.61 | 80.0% | 80.0% |
| 0.7–0.8 | 25 | 0.75 | 92.0% | 100.0% |
| 0.8–0.9 | 163 | 0.85 | 91.4% | 96.9% |
| 0.9–1.0 | 375 | 0.95 | 81.1% | 93.9% |

Expected calibration error: **0.121** strict, **0.055** lenient (0 = perfect; the average gap between confidence and accuracy, weighted by rows).

## Stability across runs

On 292 rows seen in all 2 runs (all rows sent, labelled or not):

- Got a different account in at least one run: 4 of 292 (1.4%)
- Auto-approve decision changed between runs: 6 of 292 (2.1%)
- Average confidence spread (max − min) per row: 0.007

## Latency

On 30 batches of up to 20 rows (all rows sent, labelled or not). Wall-clock, including retries.

| | Median | p90 |
|---|---:|---:|
| Per batch | 22.38 s | 25.40 s |
| Per transaction (batch time ÷ batch size) | 1.15 s | 1.29 s |
| Per API call | 22.38 s | 25.40 s |

## Cost and tokens

From the token usage the API reported for every call in this run (30 calls, 0 failed; failed calls are billed too) and prices in `eval/pricing.json` (https://platform.claude.com/docs/en/about-claude/pricing, checked 2026-09-29).

| | Value |
|---|---:|
| Input tokens | 81,108 |
| Output tokens | 47,798 |
| Cache read / write tokens | 0 / 0 |
| Total cost of this run | $0.9603 |
| Spend ledger (all capped runs) before → after this run | $0.0000 → $0.9603 of $2.00 cap |
| Cost per transaction | $0.00164 |
| Cost per statement (97 transactions, the dataset's monthly average) | $0.1595 |

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

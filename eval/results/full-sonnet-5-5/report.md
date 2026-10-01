# Categorisation eval report

**Measured on:** 292-row synthetic dataset; this run sent 292 rows to the engine (284 with an account label, 8 labelled REVIEW, 0 excluded because they have no label yet). Brightline Studio LLC (fictional), Standard Small Business chart (34 accounts), model `claude-sonnet-5-5`, 1 run.

**Engine:** the real `categorizeTransactionsWithUsage` in `src/lib/categorize.ts`, called directly (the same code `/api/categorize` runs), batch size 20, auto-approve threshold 0.85, no firm corrections supplied. Commit `0935f359`, dataset sha256 `c8a4b728e0d0`, run 2026-09-29T20:21:42.312Z → 2026-09-29T20:23:47.191Z.

**How to read it:** *strict* counts a row correct only if the engine picked the primary label. *Lenient* also accepts the alternates listed where the right account is a bookkeeping policy choice (e.g. 1100 vs 4100 for client payments). *Auto-approved* means the app would set the row to approved without a human; everything else is *sent to review* (status pending or flagged).

## Headline

On 284 scored predictions (284 rows with an account label, 1 run) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"):

| Measure | Value |
|---|---|
| Accuracy, strict | 246 of 284 (86.6%) |
| Accuracy, lenient | 270 of 284 (95.1%) |
| Auto-approved | 215 of 284 (75.7%) |
| **Wrong among auto-approved** (strict / lenient) | **15.3% / 5.1%** (33 / 11 of 215) |
| Sent to review | 69 of 284 (24.3%) (69 pending, 0 flagged) |
| Account not in the chart | 0 of 284 (0.0%) |
| REVIEW rows sent to review (correct = not auto-approved) | 8 of 8 (100.0%) |
| No prediction (batch failed or row skipped) | 0 of 284 (0.0%) |
| Cost per transaction | $0.00115 |
| Latency per batch (median) | 8.38 s |

## Unknowable from the bank line: sent to review 8 of 8

On 8 predictions for the 8 rows labelled REVIEW (1 run). These are payments whose right account can't be known from the bank description (Venmo, PayPal, Zelle to a person). The only correct outcome is that the app does **not** auto-approve them; the account it suggests doesn't matter. They are excluded from every account-accuracy number in this report.

- Sent to review (correct): 8 of 8 (100.0%)
- Auto-approved (wrong): 0 of 8 (0.0%)

## Auto-approved vs sent to review

On 284 scored predictions (284 rows with an account label, 1 run) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). The app auto-approves a row when confidence ≥ 0.85 and chart validation raised no flag.

| Group | Predictions | Correct (strict) | Correct (lenient) |
|---|---:|---:|---:|
| Auto-approved | 215 | 182 of 215 (84.7%) | 204 of 215 (94.9%) |
| Sent to review | 69 | 64 of 69 (92.8%) | 66 of 69 (95.7%) |

An auto-approved mistake reaches the books unless someone checks the approved list; a mistake sent to review costs reviewer time but is likely caught.

## Accuracy by account

On 284 scored predictions (284 rows with an account label, 1 run) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"), grouped by the true account (each row counts once per run). *Predicted as* counts how often the engine chose that account; *precision* is how often that choice was right.

| Account | Predictions | Strict | Lenient | Predicted as | Precision |
|---|---:|---:|---:|---:|---:|
| 1010 Savings Account | 4 | 4 of 4 (100.0%) | 4 of 4 (100.0%) | 4 | 100.0% |
| 1020 Petty Cash | 2 | 0 of 2 (0.0%) | 0 of 2 (0.0%) | 0 | — |
| 1100 Accounts Receivable | 27 | 0 of 27 (0.0%) | 20 of 27 (74.1%) | 0 | — |
| 1500 Equipment | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 2 | 100.0% |
| 2100 Credit Card Payable | 3 | 3 of 3 (100.0%) | 3 of 3 (100.0%) | 3 | 100.0% |
| 2200 Sales Tax Payable | 3 | 3 of 3 (100.0%) | 3 of 3 (100.0%) | 3 | 100.0% |
| 2300 Payroll Liabilities | 6 | 4 of 6 (66.7%) | 4 of 6 (66.7%) | 4 | 100.0% |
| 2400 Short-Term Loan | 3 | 3 of 3 (100.0%) | 3 of 3 (100.0%) | 4 | 75.0% |
| 2500 Long-Term Loan | 3 | 2 of 3 (66.7%) | 2 of 3 (66.7%) | 2 | 100.0% |
| 3000 Owner's Equity | 1 | 1 of 1 (100.0%) | 1 of 1 (100.0%) | 1 | 100.0% |
| 3100 Owner's Draw | 7 | 6 of 7 (85.7%) | 7 of 7 (100.0%) | 8 | 75.0% |
| 4000 Sales Revenue | 0 | — | — | 8 | 0.0% |
| 4100 Service Revenue | 2 | 1 of 2 (50.0%) | 1 of 2 (50.0%) | 21 | 4.8% |
| 4200 Other Income | 3 | 3 of 3 (100.0%) | 3 of 3 (100.0%) | 3 | 100.0% |
| 5100 Payroll & Wages | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 9 | 66.7% |
| 5200 Rent & Lease | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 6 | 100.0% |
| 5300 Utilities | 9 | 9 of 9 (100.0%) | 9 of 9 (100.0%) | 9 | 100.0% |
| 5400 Office Supplies | 38 | 38 of 38 (100.0%) | 38 of 38 (100.0%) | 40 | 95.0% |
| 5500 Marketing & Advertising | 26 | 25 of 26 (96.2%) | 26 of 26 (100.0%) | 25 | 100.0% |
| 5600 Insurance | 9 | 9 of 9 (100.0%) | 9 of 9 (100.0%) | 9 | 100.0% |
| 5700 Professional Fees | 12 | 12 of 12 (100.0%) | 12 of 12 (100.0%) | 12 | 100.0% |
| 5800 Travel & Entertainment | 69 | 69 of 69 (100.0%) | 69 of 69 (100.0%) | 69 | 100.0% |
| 6000 Bank Fees & Charges | 5 | 5 of 5 (100.0%) | 5 of 5 (100.0%) | 5 | 100.0% |
| 6100 Subscriptions & Software | 34 | 33 of 34 (97.1%) | 33 of 34 (97.1%) | 34 | 97.1% |
| 6200 Taxes & Licenses | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 3 | 66.7% |
| 6300 Miscellaneous Expense | 2 | 0 of 2 (0.0%) | 2 of 2 (100.0%) | 0 | — |

## Most common mistakes

On 284 scored predictions (284 rows with an account label, 1 run) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). Strict mistakes, most frequent first; ✓ marks a prediction that is an accepted alternate.

| True | Predicted | Count | Alternate? | Example description |
|---|---|---:|:---:|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 20 | ✓ | `MOBILE DEPOSIT CHECK #8294` |
| 1100 Accounts Receivable | 4000 Sales Revenue | 7 |  | `STRIPE TRANSFER ST-CKA0BCSQP1` |
| 1020 Petty Cash | 3100 Owner's Draw | 2 |  | `ATM WITHDRAWAL 06/12 1100 CONGRESS AVE AUSTIN TX` |
| 2300 Payroll Liabilities | 5100 Payroll & Wages | 2 |  | `GUSTO DES:TAX 07/15 ID:GPKCX0DF2J INDN:BRIGHTLINE STUDIO LLC` |
| 6300 Miscellaneous Expense | 5400 Office Supplies | 2 | ✓ | `ACE HARDWARE #07891 AUSTIN TX` |
| 2500 Long-Term Loan | 2400 Short-Term Loan | 1 |  | `SBA EIDL LOAN PAYMENT 40D1M47D7L` |
| 3100 Owner's Draw | 6200 Taxes & Licenses | 1 | ✓ | `IRS DES:USATAXPYMT ID:E2BCDTP7UA INDN:JORDAN REYES` |
| 4100 Service Revenue | 4000 Sales Revenue | 1 |  | `SQUARE INC DES:SQ06/15 ID:T366DTBCWFKC WORKSHOP` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | ✓ | `INTUIT *MAILCHIMP ATLANTA GA` |
| 6100 Subscriptions & Software | 5100 Payroll & Wages | 1 |  | `GUSTO DES:FEE 07/01 ID:X2VMZ48QA7` |

## Calibration

On 284 scored predictions (284 rows with an account label, 1 run) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). Does the confidence number mean what it says? In a well-calibrated engine, rows given 0.9 are right about 90% of the time.

| Confidence | Predictions | Mean confidence | Actual accuracy (strict) | Actual accuracy (lenient) |
|---|---:|---:|---:|---:|
| 0.6–0.7 | 13 | 0.63 | 84.6% | 84.6% |
| 0.7–0.8 | 37 | 0.73 | 94.6% | 100.0% |
| 0.8–0.9 | 66 | 0.85 | 80.3% | 87.9% |
| 0.9–1.0 | 168 | 0.95 | 87.5% | 97.6% |

Expected calibration error: **0.093** strict, **0.068** lenient (0 = perfect; the average gap between confidence and accuracy, weighted by rows).

## Stability across runs

Not measured: this was 1 run. Use `--runs 3` or more to see how often the same row gets a different answer.

## Latency

On 15 batches of up to 20 rows (all rows sent, labelled or not). Wall-clock, including retries.

| | Median | p90 |
|---|---:|---:|
| Per batch | 8.38 s | 9.00 s |
| Per transaction (batch time ÷ batch size) | 424 ms | 453 ms |
| Per API call | 8.38 s | 9.00 s |

## Cost and tokens

From the token usage the API reported for every call in this run (15 calls, 0 failed; failed calls are billed too) and prices in `eval/pricing.json` (https://platform.claude.com/docs/en/about-claude/pricing, checked 2026-09-29).

| | Value |
|---|---:|
| Input tokens | 57,126 |
| Output tokens | 22,105 |
| Cache read / write tokens | 0 / 0 |
| Total cost of this run | $0.3353 |
| Spend ledger (all capped runs) before → after this run | $1.1119 → $1.4472 of $2.00 cap |
| Cost per transaction | $0.00115 |
| Cost per statement (97 transactions, the dataset's monthly average) | $0.1114 |

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

# Categorisation eval report

> **CUT BY BUDGET CAP: run 1 of 1 stopped after 280 of 292 rows.** The rest were never sent. Numbers below cover only the finished part.

**Measured on:** 292-row synthetic dataset; this run planned 292 rows per run and finished 0 full runs plus 280 rows of run 1 before the budget cap (272 with an account label, 8 labelled REVIEW, 0 excluded because they have no label yet). Brightline Studio LLC (fictional), Standard Small Business chart (34 accounts), model `claude-sonnet-5-5`, 1 run (run 1 cut short by the budget cap).

**Engine:** the real `categorizeTransactionsWithUsage` in `src/lib/categorize.ts`, called directly (the same code `/api/categorize` runs), batch size 20, auto-approve threshold 0.85, no firm corrections supplied. Commit `125e1a9e`, dataset sha256 `c8a4b728e0d0`, run 2026-09-30T12:27:39.889Z → 2026-09-30T12:38:05.313Z.

**How to read it:** *strict* counts a row correct only if the engine picked the primary label. *Lenient* also accepts the alternates listed where the right account is a bookkeeping policy choice (e.g. 1100 vs 4100 for client payments). *Auto-approved* means the app would set the row to approved without a human; everything else is *sent to review* (status pending or flagged).

## Headline

On 272 scored predictions (272 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"):

| Measure | Value |
|---|---|
| Accuracy, strict | 236 of 272 (86.8%) |
| Accuracy, lenient | 258 of 272 (94.9%) |
| Auto-approved | 203 of 272 (74.6%) |
| **Wrong among auto-approved** (strict / lenient) | **15.3% / 5.4%** (31 / 11 of 203) |
| Sent to review | 69 of 272 (25.4%) (69 pending, 0 flagged) |
| Account not in the chart | 0 of 272 (0.0%) |
| REVIEW rows sent to review (correct = not auto-approved) | 8 of 8 (100.0%) |
| No prediction (batch failed or row skipped) | 0 of 272 (0.0%) |
| Cost per transaction | $0.00115 |
| Latency per batch (median) | 8.63 s |

## Unknowable from the bank line: sent to review 8 of 8

On 8 predictions for the 8 rows labelled REVIEW (1 run (run 1 cut short by the budget cap)). These are payments whose right account can't be known from the bank description (Venmo, PayPal, Zelle to a person). The only correct outcome is that the app does **not** auto-approve them; the account it suggests doesn't matter. They are excluded from every account-accuracy number in this report.

- Sent to review (correct): 8 of 8 (100.0%)
- Auto-approved (wrong): 0 of 8 (0.0%)

## Auto-approved vs sent to review

On 272 scored predictions (272 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). The app auto-approves a row when confidence ≥ 0.85 and chart validation raised no flag.

| Group | Predictions | Correct (strict) | Correct (lenient) |
|---|---:|---:|---:|
| Auto-approved | 203 | 172 of 203 (84.7%) | 192 of 203 (94.6%) |
| Sent to review | 69 | 64 of 69 (92.8%) | 66 of 69 (95.7%) |

An auto-approved mistake reaches the books unless someone checks the approved list; a mistake sent to review costs reviewer time but is likely caught.

## Accuracy by account

On 272 scored predictions (272 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"), grouped by the true account (each row counts once per run). *Predicted as* counts how often the engine chose that account; *precision* is how often that choice was right.

| Account | Predictions | Strict | Lenient | Predicted as | Precision |
|---|---:|---:|---:|---:|---:|
| 1010 Savings Account | 4 | 4 of 4 (100.0%) | 4 of 4 (100.0%) | 4 | 100.0% |
| 1020 Petty Cash | 2 | 0 of 2 (0.0%) | 0 of 2 (0.0%) | 0 | — |
| 1100 Accounts Receivable | 27 | 0 of 27 (0.0%) | 20 of 27 (74.1%) | 0 | — |
| 1500 Equipment | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 2 | 100.0% |
| 2100 Credit Card Payable | 3 | 3 of 3 (100.0%) | 3 of 3 (100.0%) | 3 | 100.0% |
| 2200 Sales Tax Payable | 3 | 3 of 3 (100.0%) | 3 of 3 (100.0%) | 3 | 100.0% |
| 2300 Payroll Liabilities | 5 | 3 of 5 (60.0%) | 3 of 5 (60.0%) | 3 | 100.0% |
| 2400 Short-Term Loan | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 3 | 66.7% |
| 2500 Long-Term Loan | 2 | 1 of 2 (50.0%) | 1 of 2 (50.0%) | 1 | 100.0% |
| 3000 Owner's Equity | 1 | 1 of 1 (100.0%) | 1 of 1 (100.0%) | 1 | 100.0% |
| 3100 Owner's Draw | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 8 | 75.0% |
| 4000 Sales Revenue | 0 | — | — | 8 | 0.0% |
| 4100 Service Revenue | 2 | 1 of 2 (50.0%) | 1 of 2 (50.0%) | 21 | 4.8% |
| 4200 Other Income | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 2 | 100.0% |
| 5100 Payroll & Wages | 5 | 5 of 5 (100.0%) | 5 of 5 (100.0%) | 8 | 62.5% |
| 5200 Rent & Lease | 6 | 6 of 6 (100.0%) | 6 of 6 (100.0%) | 6 | 100.0% |
| 5300 Utilities | 9 | 9 of 9 (100.0%) | 9 of 9 (100.0%) | 9 | 100.0% |
| 5400 Office Supplies | 37 | 37 of 37 (100.0%) | 37 of 37 (100.0%) | 39 | 94.9% |
| 5500 Marketing & Advertising | 26 | 26 of 26 (100.0%) | 26 of 26 (100.0%) | 26 | 100.0% |
| 5600 Insurance | 9 | 9 of 9 (100.0%) | 9 of 9 (100.0%) | 9 | 100.0% |
| 5700 Professional Fees | 12 | 12 of 12 (100.0%) | 12 of 12 (100.0%) | 12 | 100.0% |
| 5800 Travel & Entertainment | 65 | 65 of 65 (100.0%) | 65 of 65 (100.0%) | 65 | 100.0% |
| 6000 Bank Fees & Charges | 4 | 4 of 4 (100.0%) | 4 of 4 (100.0%) | 4 | 100.0% |
| 6100 Subscriptions & Software | 34 | 33 of 34 (97.1%) | 33 of 34 (97.1%) | 33 | 100.0% |
| 6200 Taxes & Licenses | 2 | 2 of 2 (100.0%) | 2 of 2 (100.0%) | 2 | 100.0% |
| 6300 Miscellaneous Expense | 2 | 0 of 2 (0.0%) | 2 of 2 (100.0%) | 0 | — |

## Most common mistakes

On 272 scored predictions (272 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). Strict mistakes, most frequent first; ✓ marks a prediction that is an accepted alternate.

| True | Predicted | Count | Alternate? | Example description |
|---|---|---:|:---:|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 20 | ✓ | `MOBILE DEPOSIT CHECK #8294` |
| 1100 Accounts Receivable | 4000 Sales Revenue | 7 |  | `STRIPE TRANSFER ST-CKA0BCSQP1` |
| 1020 Petty Cash | 3100 Owner's Draw | 2 |  | `ATM WITHDRAWAL 06/12 1100 CONGRESS AVE AUSTIN TX` |
| 2300 Payroll Liabilities | 5100 Payroll & Wages | 2 |  | `GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC` |
| 6300 Miscellaneous Expense | 5400 Office Supplies | 2 | ✓ | `ACE HARDWARE #07891 AUSTIN TX` |
| 2500 Long-Term Loan | 2400 Short-Term Loan | 1 |  | `SBA EIDL LOAN PAYMENT 40D1M47D7L` |
| 4100 Service Revenue | 4000 Sales Revenue | 1 |  | `SQ *BRIGHTLINE WORKSHOP 07/20` |
| 6100 Subscriptions & Software | 5100 Payroll & Wages | 1 |  | `GUSTO DES:FEE 07/01 ID:X2VMZ48QA7` |

## Calibration

On 272 scored predictions (272 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 8 REVIEW rows are excluded here; see "Unknowable from the bank line"). Does the confidence number mean what it says? In a well-calibrated engine, rows given 0.9 are right about 90% of the time.

| Confidence | Predictions | Mean confidence | Actual accuracy (strict) | Actual accuracy (lenient) |
|---|---:|---:|---:|---:|
| 0.6–0.7 | 15 | 0.64 | 86.7% | 86.7% |
| 0.7–0.8 | 33 | 0.73 | 93.9% | 100.0% |
| 0.8–0.9 | 66 | 0.85 | 80.3% | 87.9% |
| 0.9–1.0 | 158 | 0.95 | 88.0% | 97.5% |

Expected calibration error: **0.091** strict, **0.067** lenient (0 = perfect; the average gap between confidence and accuracy, weighted by rows).

## Stability across runs

Not measured: this was 1 run (run 1 cut short by the budget cap). Use `--runs 3` or more to see how often the same row gets a different answer.

## Latency

On 14 batches of up to 20 rows (all rows sent, labelled or not). Wall-clock, including retries.

| | Median | p90 |
|---|---:|---:|
| Per batch | 8.63 s | 9.39 s |
| Per transaction (batch time ÷ batch size) | 432 ms | 469 ms |
| Per API call | 8.63 s | 9.39 s |

## Cost and tokens

From the token usage the API reported for every call in this run (14 calls, 0 failed; failed calls are billed too) and prices in `eval/pricing.json` (https://platform.claude.com/docs/en/about-claude/pricing, checked 2026-09-29).

| | Value |
|---|---:|
| Input tokens | 53,727 |
| Output tokens | 21,377 |
| Cache read / write tokens | 0 / 0 |
| Total cost of this run | $0.3212 |
| Spend ledger (all capped runs) before → after this run | $0.0924 → $0.4136 of $0.45 cap |
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
- **This run covers 272 of 284 labelled rows.** It checks that the harness works; it says little about the engine.

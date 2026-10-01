# Categorisation eval report

> **39 of 39 scored predictions got no answer from the engine** (the batch failed). 8 of 8 API calls failed; most common error (8×): `Unexpected Claude content type: thinking`. Those rows count as wrong and as sent to review; they say nothing about the model's accounting.

> **CUT BY BUDGET CAP: run 1 of 1 stopped after 40 of 100 rows.** The rest were never sent. Numbers below cover only the finished part.

> **SMOKE TEST: 39 of 284 labelled rows. Not a result.**
> Numbers below describe only these rows and are too few to compare models or settings.

**Measured on:** 292-row synthetic dataset; this run planned 100 rows per run and finished 0 full runs plus 40 rows of run 1 before the budget cap (39 with an account label, 3 labelled REVIEW, 0 excluded because they have no label yet). Brightline Studio LLC (fictional), Standard Small Business chart (34 accounts), model `claude-opus-5-5`, 1 run (run 1 cut short by the budget cap).

**Engine:** the real `categorizeTransactionsWithUsage` in `src/lib/categorize.ts`, called directly (the same code `/api/categorize` runs), batch size 20, auto-approve threshold 0.85, no firm corrections supplied. Commit `0935f359`, dataset sha256 `c8a4b728e0d0`, run 2026-09-29T20:24:09.869Z → 2026-09-29T20:26:48.196Z.

**How to read it:** *strict* counts a row correct only if the engine picked the primary label. *Lenient* also accepts the alternates listed where the right account is a bookkeeping policy choice (e.g. 1100 vs 4100 for client payments). *Auto-approved* means the app would set the row to approved without a human; everything else is *sent to review* (status pending or flagged).

## Headline

On 39 scored predictions (39 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 3 REVIEW rows are excluded here; see "Unknowable from the bank line"):

| Measure | Value |
|---|---|
| Accuracy, strict | 0 of 39 (0.0%) |
| Accuracy, lenient | 0 of 39 (0.0%) |
| Auto-approved | 0 of 39 (0.0%) |
| **Wrong among auto-approved** (strict / lenient) | **— / —** (0 / 0 of 0) |
| Sent to review | 39 of 39 (100.0%) (0 pending, 39 flagged) |
| Account not in the chart | 0 of 39 (0.0%) |
| REVIEW rows sent to review (correct = not auto-approved) | 1 of 1 (100.0%) |
| No prediction (batch failed or row skipped) | 39 of 39 (100.0%) |
| Cost per transaction | $0.0116 |
| Latency per batch (median) | 55.78 s |

## Unknowable from the bank line: sent to review 1 of 1

On 1 predictions for the 3 rows labelled REVIEW (1 run (run 1 cut short by the budget cap)). These are payments whose right account can't be known from the bank description (Venmo, PayPal, Zelle to a person). The only correct outcome is that the app does **not** auto-approve them; the account it suggests doesn't matter. They are excluded from every account-accuracy number in this report.

- Sent to review (correct): 1 of 1 (100.0%)
- Auto-approved (wrong): 0 of 1 (0.0%)

## Auto-approved vs sent to review

On 39 scored predictions (39 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 3 REVIEW rows are excluded here; see "Unknowable from the bank line"). The app auto-approves a row when confidence ≥ 0.85 and chart validation raised no flag.

| Group | Predictions | Correct (strict) | Correct (lenient) |
|---|---:|---:|---:|
| Auto-approved | 0 | 0 of 0 (—) | 0 of 0 (—) |
| Sent to review | 39 | 0 of 39 (0.0%) | 0 of 39 (0.0%) |

An auto-approved mistake reaches the books unless someone checks the approved list; a mistake sent to review costs reviewer time but is likely caught.

## Accuracy by account

On 39 scored predictions (39 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 3 REVIEW rows are excluded here; see "Unknowable from the bank line"), grouped by the true account (each row counts once per run). *Predicted as* counts how often the engine chose that account; *precision* is how often that choice was right.

| Account | Predictions | Strict | Lenient | Predicted as | Precision |
|---|---:|---:|---:|---:|---:|
| 1010 Savings Account | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |
| 1100 Accounts Receivable | 2 | 0 of 2 (0.0%) | 0 of 2 (0.0%) | 0 | — |
| 2100 Credit Card Payable | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |
| 2300 Payroll Liabilities | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |
| 3100 Owner's Draw | 2 | 0 of 2 (0.0%) | 0 of 2 (0.0%) | 0 | — |
| 5100 Payroll & Wages | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |
| 5200 Rent & Lease | 2 | 0 of 2 (0.0%) | 0 of 2 (0.0%) | 0 | — |
| 5300 Utilities | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |
| 5400 Office Supplies | 4 | 0 of 4 (0.0%) | 0 of 4 (0.0%) | 0 | — |
| 5500 Marketing & Advertising | 2 | 0 of 2 (0.0%) | 0 of 2 (0.0%) | 0 | — |
| 5600 Insurance | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |
| 5700 Professional Fees | 2 | 0 of 2 (0.0%) | 0 of 2 (0.0%) | 0 | — |
| 5800 Travel & Entertainment | 10 | 0 of 10 (0.0%) | 0 of 10 (0.0%) | 0 | — |
| 6000 Bank Fees & Charges | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |
| 6100 Subscriptions & Software | 5 | 0 of 5 (0.0%) | 0 of 5 (0.0%) | 0 | — |
| 6200 Taxes & Licenses | 1 | 0 of 1 (0.0%) | 0 of 1 (0.0%) | 0 | — |
| 6300 Miscellaneous Expense | 2 | 0 of 2 (0.0%) | 0 of 2 (0.0%) | 0 | — |

## Most common mistakes

On 39 scored predictions (39 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 3 REVIEW rows are excluded here; see "Unknowable from the bank line"). Strict mistakes, most frequent first; ✓ marks a prediction that is an accepted alternate.

| True | Predicted | Count | Alternate? | Example description |
|---|---|---:|:---:|---|
| 5800 Travel & Entertainment | (no prediction) | 10 |  | `UBER* TRIP 8005928996 CA` |
| 6100 Subscriptions & Software | (no prediction) | 5 |  | `GUSTO.COM MONTHLY FEE` |
| 5400 Office Supplies | (no prediction) | 4 |  | `USPS.COM CLICKNSHIP 800-344-7779 DC` |
| 1100 Accounts Receivable | (no prediction) | 2 |  | `MOBILE DEPOSIT CHECK #8294` |
| 3100 Owner's Draw | (no prediction) | 2 |  | `ONLINE TRANSFER TO REYES J PERSONAL CHK ...4417 REF #CVC9MJ8U52` |
| 5200 Rent & Lease | (no prediction) | 2 |  | `WEWORK MEMBERSHIPS 646-491-9060 NY` |
| 5500 Marketing & Advertising | (no prediction) | 2 |  | `GOOGLE ADS 6554 MOUNTAIN VIEW CA` |
| 5700 Professional Fees | (no prediction) | 2 |  | `UPWORK ESCROW INC 650-3162277 CA` |
| 6300 Miscellaneous Expense | (no prediction) | 2 |  | `ACE HARDWARE #07891 AUSTIN TX` |
| 1010 Savings Account | (no prediction) | 1 |  | `ONLINE TRANSFER TO SAV ...8830 REF #9BTBTU7HU0` |
| 2100 Credit Card Payable | (no prediction) | 1 |  | `PAYMENT TO CHASE CARD ENDING IN 3301` |
| 2300 Payroll Liabilities | (no prediction) | 1 |  | `GUSTO DES:TAX 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC` |
| 5100 Payroll & Wages | (no prediction) | 1 |  | `GUSTO DES:NET 06/30 ID:KCXULHKHZQ INDN:BRIGHTLINE STUDIO LLC` |
| 5300 Utilities | (no prediction) | 1 |  | `SPECTRUM BUSINESS 855-707-7328 TX` |
| 5600 Insurance | (no prediction) | 1 |  | `HISCOX INSURANCE DES:PREMIUM ID:CCK972XABY` |

## Calibration

On 39 scored predictions (39 rows with an account label, 1 run (run 1 cut short by the budget cap)) (the 3 REVIEW rows are excluded here; see "Unknowable from the bank line"). Does the confidence number mean what it says? In a well-calibrated engine, rows given 0.9 are right about 90% of the time.

| Confidence | Predictions | Mean confidence | Actual accuracy (strict) | Actual accuracy (lenient) |
|---|---:|---:|---:|---:|

Expected calibration error: **—** strict, **—** lenient (0 = perfect; the average gap between confidence and accuracy, weighted by rows).

## Stability across runs

Not measured: this was 1 run (run 1 cut short by the budget cap). Use `--runs 3` or more to see how often the same row gets a different answer.

## Latency

On 2 batches of up to 20 rows (all rows sent, labelled or not). Wall-clock, including retries.

| | Median | p90 |
|---|---:|---:|
| Per batch | 55.78 s | 64.70 s |
| Per transaction (batch time ÷ batch size) | 2.79 s | 3.24 s |
| Per API call | 18.16 s | 23.11 s |

## Cost and tokens

From the token usage the API reported for every call in this run (8 calls, 8 failed; failed calls are billed too) and prices in `eval/pricing.json` (https://platform.claude.com/docs/en/about-claude/pricing, checked 2026-09-29).

| | Value |
|---|---:|
| Input tokens | 30,527 |
| Output tokens | 17,044 |
| Cache read / write tokens | 0 / 0 |
| Total cost of this run | $0.4630 |
| Spend ledger (all capped runs) before → after this run | $1.4472 → $1.9102 of $2.00 cap |
| Cost per transaction | $0.0116 |
| Cost per statement (97 transactions, the dataset's monthly average) | $1.1227 |

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
- **This run covers 39 of 284 labelled rows.** It checks that the harness works; it says little about the engine.

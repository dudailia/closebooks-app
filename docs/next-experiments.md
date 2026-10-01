# Next experiments (prepared, not run)

Two measured experiments, ready to run. Nothing here has been run against the
API. Every command below was run with `--fake` on 2026-10-01 (branch
`overnight`) to check the pipeline; the real runs need your go-ahead because
they spend money.

All data is synthetic: `eval/data/synthetic_transactions.csv`, 292 rows for
the fictional Brightline Studio LLC, June to August 2026 (see
[facts.md](./facts.md)).

## What was added so these can run

- `src/lib/categorize.ts`: `CategorizeOptions.systemPrompt` (replace the
  system prompt) and `CategorizeOptions.cache` (mark the system prompt and the
  chart as cacheable). Both are off by default; the app never sets them.
  `buildCategorizeRequest()` builds the request; without options it is the
  request the app already sends (`src/lib/__tests__/categorizeRequest.test.ts`
  checks this, and that the cached request carries the same text).
- `eval/prompts/variants.ts`: prompt variants as named find-and-replace edits
  on the app's prompt. A run fails if an edit's text is no longer in the
  prompt.
- `eval/run.ts`: `--prompt <variant>`, `--months 2026-07,2026-08` (time
  split), `--cache`. Reports and comparisons label these runs; `merge-cli.ts`
  refuses to pool runs with different prompts or cache settings.

## Basis for the cost estimates

Measured on Sonnet 5.5 (`eval/results/full-sonnet-5-5/summary.json`): $0.00115
per row; a 20-row call averages 3,808 input and 1,474 output tokens (57,126 and
22,105 over 15 calls). At $2 / $10 per million tokens (`eval/pricing.json`),
output is about two thirds of the cost of a call. Estimates below are rows
times $0.00115 unless stated. The `--budget` cap is a hard stop on the ledger
total, checked before every call against a worst case, so a run stops cleanly
before it can pass the cap.

Rows per split: June 104; July and August 188.

---

## (a) Deposits to Accounts Receivable; liability payments to the balance sheet

**Why.** The prompt sends deposits and client payments to revenue
(`src/lib/categorize.ts:39, 60`) and payroll tax to "Payroll Tax Expense"
(line 37). On the synthetic data, Stripe payouts land on 4000 instead of 1100,
Gusto payroll-tax impounds on 5100 instead of 2300, and the SBA loan on 2400
instead of 2500 (architecture.md, section 8). One payroll-tax row at 0.93 was
auto-approved (facts.md, threshold sweep, run 2).

**The change** (`ar-liabilities` in `eval/prompts/variants.ts`), five edits:

1. Deposits, client payments and processor payouts (Stripe, Square, PayPal)
   go to Accounts Receivable when the chart has one; revenue only if it
   doesn't.
2. Payroll tax, FICA/FUTA, 941/940 and payroll-provider tax impounds go to
   Payroll Liabilities when the chart has one.
3. Sales-tax remittances go to Sales Tax Payable.
4. Loan payments go to the loan account: line of credit to the short-term
   loan, SBA or term loan to the long-term loan.
5. "Credits/deposits are almost always revenue" becomes "usually customer
   payments (AR) or revenue", with the liability exceptions for debits.

**Rows it can move.** In July to August, 28 of 188 rows have one of the target
accounts as their label: 17 to 1100, 2 to 2200, 4 to 2300, 3 to 2400, 2 to
2500. In June, 14 of 104. That is a small sample: with 2 runs, a difference of
2 or 3 rows is within run-to-run noise (Sonnet 5.5 changed account on 8 of 280
rows between runs, facts.md).

**The time split.** Edit the prompt only after looking at June results. Freeze
it (commit), then measure on July and August, once. July to August is the
headline.

**Limit of the split, stated plainly:** the five error types above were found
by reading results over all three months, so July to August is not a clean
held-out set for *which* errors to fix. The split only stops the *wording* of
the fix being tuned on the test rows. A clean test needs rows nobody has
looked at: real statements, or a new synthetic month generated with a
different seed and not inspected before the run.

### Commands

```bash
# 0. Pipeline check, no API calls
npx vite-node --config vitest.config.ts eval/run.ts --fake --prompt ar-liabilities --months 2026-06

# 1. Development, June only. Baseline and variant, 1 run each.
npx vite-node --config vitest.config.ts eval/run.ts --months 2026-06 \
  --budget 1.50 --ledger eval/results/spend-ledger-exp-a.json --out eval/results/expA-dev-june-baseline
npx vite-node --config vitest.config.ts eval/run.ts --prompt ar-liabilities --months 2026-06 \
  --budget 1.50 --ledger eval/results/spend-ledger-exp-a.json --out eval/results/expA-dev-june-variant
#    Read both report.md files. Edit eval/prompts/variants.ts only from these.
#    Each further June iteration: rerun the variant command (new --out).
#    When done: commit the variant. No more edits after this point.

# 2. Test, July and August, 2 runs each.
npx vite-node --config vitest.config.ts eval/run.ts --months 2026-07,2026-08 --runs 2 \
  --budget 1.50 --ledger eval/results/spend-ledger-exp-a.json --out eval/results/expA-test-baseline
npx vite-node --config vitest.config.ts eval/run.ts --prompt ar-liabilities --months 2026-07,2026-08 --runs 2 \
  --budget 1.50 --ledger eval/results/spend-ledger-exp-a.json --out eval/results/expA-test-variant

# 3. Compare and re-sweep the threshold (no API calls)
npx vite-node --config vitest.config.ts eval/compare-cli.ts eval/results/expA-test-baseline eval/results/expA-test-variant \
  --ledger eval/results/spend-ledger-exp-a.json --out eval/results/expA-comparison.md
npx vite-node --config vitest.config.ts eval/sweep-cli.ts eval/results/expA-test-baseline eval/results/expA-test-variant \
  --out eval/results/expA-threshold-sweep.md
```

The baseline is re-run instead of reusing the saved Sonnet 5.5 runs, because
those predate the "data, not instructions" prompt label (facts.md, "Prompt
version"); re-running keeps the prompt change the only difference.

### Estimated cost

| Step | Rows sent | Estimate |
|---|---:|---:|
| 1. June baseline, 1 run | 104 | $0.12 |
| 1. June variant, 1 run | 104 | $0.12 |
| 2. July to August baseline, 2 runs | 376 | $0.43 |
| 2. July to August variant, 2 runs | 376 | $0.44 (the variant prompt is about 250 tokens longer: +$0.01) |
| **Total** | | **about $1.11**; cap $1.50 |

Each extra June iteration: about $0.12.

### What to look at, decided before running

- Strict accuracy on the 28 target rows (the lenient score already accepts
  4100 for client payments, so strict is what should move).
- Strict and lenient accuracy on the other 160 rows: regressions, especially
  real revenue credits moved to AR, and expenses moved to liabilities.
- Wrong among auto-approved at 0.93, and the re-swept threshold. The change can
  move confidences, so 0.93 may no longer be the right value.
- Adopt only if target rows improve by more than run-to-run variation and the
  other rows and wrong auto-approvals do not get worse. With these sample
  sizes, a "no clear difference" result is likely and is a valid outcome.

---

## (b) Prompt caching on and off

**Why.** Every call sends the same system prompt and chart. Caching them could
cut input cost.

**What `--cache` does.** Two cache breakpoints (5-minute TTL): one on the
system prompt, one after the chart and corrections. Only the 20 rows after
them change from call to call. The text sent is the same as without caching.

### What I expect, and why it may be small

- **Prefix size:** about 1,400 tokens (system prompt 4,412 characters, chart
  1,145 characters, divided by 4). This is an estimate; counting tokens exactly
  is an API call, so I didn't.
- **Minimum cacheable length:** the API reference lists 1,024 tokens for
  Claude Sonnet 5 and does not list Sonnet 5.5. If Sonnet 5.5's minimum is
  above about 1,400, nothing caches and `cache_creation_input_tokens` stays 0
  with no error. Step 0 below checks this for about $0.05 before anything
  larger.
- **Per call:** a read saves about 1,400 × ($2.00 − $0.20) / 1M = $0.0025;
  the first write costs about 1,400 × ($2.50 − $2.00) / 1M = $0.0007 extra.
- **In the eval** (`run.ts` sends batches one at a time, 15 calls for 292
  rows): about 14 reads and 1 write, so about $0.034 less per run, roughly 10%
  of $0.336.
- **In the app** (4 batches at once, `CATEGORIZE_CONCURRENCY`): a cache entry
  can be read only after the first reply has started, so the first 4 calls all
  write. A 97-row statement is 5 calls: 4 writes and 1 read, about break-even.
  A 292-row upload is 15 calls: 4 writes and 11 reads, about $0.025 less (7%).
  Running the first batch alone and then the rest in parallel would turn 3 of
  those writes into reads; that is a small app change, not made.
- Output is about two thirds of the cost, so caching can't cut the bill by
  much. A larger lever would be shorter output (the per-row `reasoning`
  sentence). Not prepared here.

### Commands

```bash
# 0. Does it cache at all? 40 rows, 2 calls. Check "cacheReadTokens" in summary.json (cost.tokens).
#    If it is 0, stop: the prefix is below Sonnet 5.5's minimum.
npx vite-node --config vitest.config.ts eval/run.ts --cache --limit 40 \
  --budget 1.60 --ledger eval/results/spend-ledger-exp-b.json --out eval/results/expB-smoke-cache

# 1. Cache off and on, full 292 rows, 2 runs each.
npx vite-node --config vitest.config.ts eval/run.ts --runs 2 \
  --budget 1.60 --ledger eval/results/spend-ledger-exp-b.json --out eval/results/expB-cache-off
npx vite-node --config vitest.config.ts eval/run.ts --cache --runs 2 \
  --budget 1.60 --ledger eval/results/spend-ledger-exp-b.json --out eval/results/expB-cache-on

# 2. Compare (no API calls)
npx vite-node --config vitest.config.ts eval/compare-cli.ts eval/results/expB-cache-off eval/results/expB-cache-on \
  --ledger eval/results/spend-ledger-exp-b.json --out eval/results/expB-comparison.md
```

### Estimated cost

| Step | Rows sent | Estimate |
|---|---:|---:|
| 0. Smoke test, cache on | 40 | $0.05 |
| 1. Cache off, 2 runs | 584 | $0.67 |
| 1. Cache on, 2 runs | 584 | about $0.60 (if it caches; $0.67 if not) |
| **Total** | | **about $1.32**; cap $1.60 |

To save $0.67, step 1's cache-off runs could be replaced by the saved Sonnet
5.5 runs, at the cost of the prompt-label difference noted in (a).

### What to look at

- Cost per 100 rows, and cache read and write tokens (`summary.json`,
  `cost.tokens`).
- Median latency per row: cached prefixes may shorten time to first token.
- Accuracy should not change beyond run-to-run variation; the request text is
  the same, only split into two blocks. A larger difference would need
  explaining before adopting.
- Then decide whether the app should send `cache_control`, and whether to warm
  the cache with the first batch.

---

## Both experiments

About $2.43 together, under caps of $1.50 and $1.60 on separate ledgers. For
comparison, all eval spend so far is $2.3571 (facts.md).

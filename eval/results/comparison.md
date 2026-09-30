# Model comparison

**Measured on:** the 292-row synthetic dataset (Brightline Studio LLC, fictional; Standard Small Business chart (34 accounts)), 292 / 100 rows sent per run, same engine code and prompt (`src/lib/categorize.ts`, auto-approve threshold 0.85, batch size 20, no firm corrections). Dataset sha256 `c8a4b728e0d0`. Each row below is one model; every figure is pooled over that model's runs (rows × runs predictions). Account accuracy excludes the REVIEW rows, which are scored only on whether they were sent to review.

| Model | Runs | Accuracy strict | Accuracy lenient | Wrong among auto-approved (strict / lenient) | REVIEW rows sent to review | Sent to review (of which flagged) | ECE (strict) | Median latency / transaction | Cost / 100 transactions |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `claude-sonnet-4-6` | 2 | 480/568 (84.5%) | 539/568 (94.9%) | 82/468 (17.5%) / 27/468 (5.8%) | 16/16 (100.0%) | 17.6% (0.0%) | 0.121 | 1.15 s | $0.164 |
| `claude-sonnet-5-5` (cut by budget cap) | 2 | 482/556 (86.7%) | 528/556 (95.0%) | 64/418 (15.3%) / 22/418 (5.3%) | 16/16 (100.0%) | 24.8% (0.0%) | 0.092 | 0.43 s | $0.115 |
| `claude-haiku-4-5` | 1 | 214/284 (75.4%) | 246/284 (86.6%) | 60/230 (26.1%) / 30/230 (13.0%) | 8/8 (100.0%) | 19.0% (0.0%) | 0.202 | 0.53 s | $0.052 |
| `claude-opus-5-5` (100-row subset, cut by budget cap) | 1 | **no usable predictions** (39/39 batch failures) | — | — | — | — | — | 2.79 s | $1.157 |

**Columns.** *Strict* accepts only the primary label; *lenient* also accepts the listed policy alternates. *Wrong among auto-approved* is the share of rows the app would approve without a human that have the wrong account. *REVIEW rows sent to review* is correct handling of payments whose account can't be known from the bank line. *Sent to review* is the share of account-labelled predictions left pending or flagged; *flagged* is the subset with status flagged (account not in the chart, or batch failure). *ECE* is expected calibration error over 10 confidence buckets (0 = perfect). Latency is batch wall-clock ÷ batch size, so it depends on network and API load at run time. Cost uses the API-reported tokens and eval/pricing.json list prices (https://platform.claude.com/docs/en/about-claude/pricing, checked 2026-09-29).

**Failed calls.** `claude-opus-5-5`: 8 of 8 API calls failed; most common error (8×): `Unexpected Claude content type: thinking`. Failed calls are billed and included in its cost.

**Runs compared:** `claude-sonnet-4-6` 2026-09-29T20:07:02.796Z; `claude-sonnet-5-5` pooled from 2026-09-29T20:21:42.312Z (1 run, 0935f359) + 2026-09-30T12:27:39.889Z (1 run, 125e1a9e); `claude-haiku-4-5` 2026-09-29T20:18:51.943Z; `claude-opus-5-5` 2026-09-29T20:24:09.869Z.

**Total actual cost of these runs:** $2.2314 (sum of each run's API-reported tokens × list price).

**Limits:** one synthetic business and chart; a single run per model (except where Runs > 1) can't show run-to-run variation; labels encode one bookkeeping policy; the prompt was written for the app's current model and was not tuned for the others.

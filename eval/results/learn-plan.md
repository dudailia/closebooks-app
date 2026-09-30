# Learning from corrections: June review → rules for July–August

> **PROJECTION FROM SAVED PREDICTIONS. No API calls were made.** Rule-matched rows take the rule's account; every other row keeps the AI answer saved in the earlier run. A live run would batch the unmatched rows differently, so its AI answers could differ a little.

**Measured on:** the 292-row synthetic dataset (Brightline Studio LLC, fictional; Standard Small Business chart (34 accounts)); saved run 1 of `eval/results/full-sonnet-4-6` (model `claude-sonnet-4-6`, 2026-09-29T20:07:02.796Z). Reviewed month 2026-06 (104 rows); test months 2026-07 and 2026-08 (188 rows).

**Assumption:** the reviewer corrects every June row the model got wrong (lenient) and accepts the app's "Always categorize … as …?" prompt each time. Rules are created and matched by the app's own code (`saveRule`, `applyRulesToJob` in `src/lib/review/rules.ts`; `vendorKey` in `src/lib/review/vendor.ts`), with direction.

## Before vs after on July–August (188 rows)

Accuracy and wrong auto-approvals are over rows with an account label; REVIEW rows count toward review load and are wrong only if auto-approved. Rule-applied rows count as approved (the app marks them *edited*).

| | Before: no rules | After: rules first (projection) |
|---|---:|---:|
| Accuracy, lenient | 94.5% | 95.6% |
| Accuracy, strict | 84.7% | 86.3% |
| Auto-approved | 152 | 152 |
| Wrong auto-approvals (lenient) | 8 (5.3%) | 6 (3.9%) |
| REVIEW rows auto-approved | 0 | 0 |
| Review load (rows a human checks) · per 97-row statement | 36 · 18.6 | 36 · 18.6 |
| Rows sent to the AI | 188 | 183 |
| API calls (batches of 20) | 10 | 10 |
| Estimated API cost | $0.3110 | $0.3042 |

**Rules caught 5 of 188 rows** (5 right lenient, 5 strict), saving 0 API calls and about $0.0068 for these two months. 16 July–August rows are from vendors that had a June correction.

**Wrong rule matches: none.**

## June corrections → rules (5 corrections, 4 rules)

| June row | Model said | Correct | Rule (vendor key, direction) |
|---|---|---|---|
| `GUSTO DES:TAX 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC` | 6200 | 2300 | `gusto des:tax` |
| `TX COMPTROLLER DES:SALES TAX ID:4WL4C50FFN` | 6200 | 2200 | `tx comptroller des:sales tax` |
| `STRIPE TRANSFER ST-BPQBDJJ8SM` | 4000 | 1100 | `stripe transfer st` |
| `SBA EIDL LOAN PAYMENT 40D1M47D7L` | 2400 | 2500 | `sba eidl loan payment` |
| `GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC` | 6200 | 2300 | `gusto des:tax` |

## Cost basis

- fitted on 30 successful calls: ~1836 input tokens per call + ~44.5 per row, ~81.8 output tokens per row, `claude-sonnet-4-6` list prices from eval/pricing.json. Retries on failed replies would add to this.
- A live "after" run would cost about $0.3042 (10 calls for the 183 unmatched rows).

## Limits

- Best case for rules: every June correction becomes a rule. In the app the reviewer must accept each prompt.
- Rules learn the bank format they saw: a vendor that appears in two formats needs a correction in each.
- One reviewed month, one synthetic business; real vendors vary their bank lines in more ways.

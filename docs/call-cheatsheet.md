# Call cheatsheet

One page to glance at. All data is **synthetic** (one fictional business,
Brightline Studio LLC; 292 bank rows, June to August 2026; one checking
account; the 34-account Standard Small Business chart; 284 rows labelled, 8
REVIEW). No customers, no real books. Every figure is in
[facts.md](./facts.md) with its source file. Model: Sonnet 5.5; threshold:
0.93; "2 runs" means two saved eval runs pooled (run 2 cut at 280 rows).

## 12 numbers

| # | Number | Measured on |
|---:|---|---|
| 1 | Accuracy **86.7% strict, 95.0% lenient** (482 and 528 of 556) | Sonnet 5.5, 2 runs (accuracy does not depend on the threshold) |
| 2 | Wrong among auto-approved at 0.93: **0.4% lenient (1 of 274), 7.3% strict (20 of 274)** | Sonnet 5.5, 2 runs, threshold sweep on saved predictions |
| 3 | Of those 20 strict errors: **19 policy alternates** (18 client payments to revenue instead of AR, 1 Mailchimp to Software), **1 real mistake** (Gusto payroll tax to 5100) | Same, `eval/results/strict-errors.md` |
| 4 | Auto-approved at 0.93: **49.3%** (274 of 556 labelled predictions) | Sonnet 5.5, 2 runs, sweep |
| 5 | Live: **128 of 292 auto-approved (43.8%)**, 164 pending, 0 flagged | One live run on the preview, 2026-10-01 |
| 6 | Live: **292 rows in about 40 s** | One stopwatch run on the preview, 2026-10-01 |
| 7 | Review load at 0.93: **50.5 of 97 rows per statement** (19.3 under the old setting) | Sonnet 5.5, 2 runs, sweep |
| 8 | Old setting (Sonnet 4.6 at 0.85): **5.8% lenient, 17.5% strict** wrong among auto-approved | Sonnet 4.6, 2 runs |
| 9 | At most 2% **strict** wrong needs **0.94**: 4 of 242 (1.7%), 56.0 of 97 rows reviewed | Sonnet 5.5, 2 runs, sweep |
| 10 | Cost **$0.111 per 97-row statement** ($0.00115 per row); Sonnet 4.6 $0.160 | API-reported tokens × list price, no caching, categorisation only |
| 11 | Calibration error (ECE) **0.092 strict, 0.067 lenient** (Sonnet 4.6: 0.121, 0.055) | 2 runs each, 10 buckets |
| 12 | Rules: caught **5 of 188** July to August rows, all right; accuracy **94.5% to 95.6% lenient, 84.7% to 86.3% strict** | Projection from Sonnet 4.6 run 1, not a live run |

Also handy: 8 of 280 rows (2.9%) changed account between the two Sonnet 5.5
runs; total API spend on evals $2.3571.

## 3 biggest weaknesses

1. **The prompt's accounting policy:** it says deposits are revenue and payroll tax an expense, which is wrong for a business that invoices or runs payroll through a provider; 18 of the 20 strict errors at 0.93 come from it.
2. **The evidence:** one synthetic business, one chart, two runs, and the 0.93 threshold was chosen and measured on the same 292 rows, with no held-out set.
3. **Database security is closed only where a migration exists:** all 8 security and client-id migrations were applied on 2026-10-01 (F7 right after the deploy), but F5's consent gap, F13, F16 and the rest of F15 have no fix yet, and the anon key reaches Supabase directly, which the app's middleware can't block.

## 10 hard questions, one sentence each

1. **Isn't 0.93 overfitted?** Yes: it was picked and measured on the same rows, so 0.4% and 7.3% are in-sample, and a June-tune, July-August-test experiment is ready to run for about $1.11 (Q22).
2. **Isn't "lenient" flattering?** It is for client payments, which is why I quote strict next to it: 7.3% against 0.4% at 0.93 (Q17).
3. **What do you send to Anthropic?** Per row date, description, amount and direction, plus the chart and 10 recent corrections, all escaped and labelled as data, never the client name (Q6).
4. **Data retention?** I don't know yet beyond the default API terms; I haven't arranged zero data retention and would before any real data (Q7).
5. **Prompt injection?** Reduced, not removed: text is one line, escaped, capped and labelled as data, and any account the model picks must exist in the chart (Q12).
6. **Errors the threshold can't catch?** Confident, consistent ones like payroll tax to wages, which only a prompt fix or a saved rule stops (Q25).
7. **Corrections vs rules?** A correction is a hint in the next prompt and can still land below 0.93; a saved rule approves matching rows before the model runs (Q14).
8. **How are tenants separated?** Row-level security on `firm_id`, audited from the SQL in the repo, not from the live database (Q30).
9. **Largest statement?** One run did 292 rows in 40 s; the 120 s limit is roughly 900 rows by extrapolation, unmeasured beyond that (Q37).
10. **Does the balance check mean the books are right?** No, it catches my own arithmetic bugs; a missed or duplicated bank row would need a statement balance reconciliation, which I haven't built (Q40).

Q numbers refer to [likely-questions.md](./likely-questions.md).

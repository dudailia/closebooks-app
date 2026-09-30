# SESSION_LOG — CloseBooks handoff

**Last updated:** 2026-09-29. Working copy: `~/code/closebooks-app-fresh` (the `~/Desktop` copy is retired).
Durable architecture lives in `CLAUDE.md`; this file is where things stand now.

## Branches

| Branch | State |
|---|---|
| `main` | Deployed by Vercel on push. HEAD `ce76fb20` (merge of PR #44 `je-fix`, 2026-09-28), after PR #43 `demo-hide`. |
| `eval-harness` | **Not merged.** Eval harness + app fixes listed below. Pushed; no PR. |
| `je-fix`, `demo-hide` | Merged into `main`. |
| ~40 other remote branches (`cursor/*`, `feature/*`, `dependabot/*`, `demo-prep*`, `chore/next-16-upgrade`) | Old; not reviewed this session. |

## On `main` (merged)

- **Journal entries** (`src/lib/autopilot/journalEntries.ts`): one balanced entry per approved transaction against the approved chart account and the bank account; direction from `type`; exceptions and "check: possible refund" lists; JE CSV export; Journal entries section in the close report. Spec: `docs/engine/journal-entries.md`.
- **Splits and `categorizationSource` persisted** to Supabase via migration `supabase/migrations/20260926000000_transaction_splits_source.sql`, with a fallback that saves without those columns if the migration isn't applied. **Whether the migration was run in the Supabase SQL editor is not confirmed.**
- **Approve keeps the reviewer's chosen account** (was overwritten by the AI suggestion). CSV exports have no footer lines.
- `next.config.mjs` has `ignoreBuildErrors: false` and `ignoreDuringBuilds: false`: the build type-checks and lints. Test runner: vitest (`npm test`).

## On `eval-harness` (not merged)

**Eval (`eval/`, see `eval/README.md`):** a 292-row synthetic labelled dataset (fictional Brightline Studio, 34-account Standard Small Business chart; 284 account labels, 8 REVIEW); `run.ts` runs the real engine with a hard budget cap; `metrics.ts`/`report.ts`/`compare.ts` score and report; `sweep-cli.ts` (threshold sweep) and `learn-cli.ts` (June corrections → rules) work from saved runs without API calls. Results live in `eval/results/` (gitignored).

**App changes also on this branch:**
- `categorize.ts`: reads the reply's text blocks and ignores thinking blocks (Opus 5.5 replies were rejected); an unreadable reply is retried at most once (network errors up to 3). New `categorizeTransactionsWithUsage()` reports tokens/latency; `categorizeTransactions()` output unchanged.
- Rules: `vendorKey()` (`src/lib/review/vendor.ts`) strips month-to-month noise (dates, IDs, card digits, phones, state codes) and keeps type words (`DES:NET` vs `DES:TAX`); matching is exact on the key; rules store direction. **Rules now run first at upload** (matched rows skip the AI, source = firm rule), are loaded before they're applied (`ensureRulesLoaded`), and rule-applied rows on the review page are saved immediately.

## Results so far (synthetic data; see `eval/results/`)

- **Sonnet 4.6 (app's model), 2 runs × 292 rows:** accuracy 84.5% strict / 94.9% lenient; auto-approves 82%; 5.8% of auto-approved rows wrong (lenient); all 16 REVIEW predictions sent to review; ~$0.16 per 97-row statement.
- **Comparison (1 run each):** Sonnet 5.5 86.6% / 95.1%, 5.1% wrong auto-approved, ~30% cheaper; Haiku 4.5 75.4% / 86.6%, 13.0% wrong auto-approved. Opus 5.5 produced no usable predictions (thinking-block bug, since fixed on this branch).
- **Threshold sweep:** keeping wrong auto-approvals ≤2% needs 0.98 on Sonnet 4.6 (review ~93 of 97 rows/statement) but 0.91 on Sonnet 5.5 (~49 of 97). Threshold left at 0.85.
- **Rules (projection from saved predictions):** with the new vendor keys, June corrections caught 5 of 188 July–August rows (all right, no wrong matches): every row in a bank format June had corrected. Lenient accuracy 94.5% → 95.6%, wrong auto-approvals 8 → 6. The other 11 same-vendor rows use a second bank format.
- Total API spend on evals this session: $1.94 (smoke test $0.03 + capped runs $1.91).

## Open issues

- The categorisation prompt sends deposits to revenue; client payments land on 4100 instead of 1100 AR. Consistent high-confidence errors: Gusto payroll tax → 6200 (should be 2300), sales-tax remittance → 6200 (2200), SBA loan → 2400 (2500). Sonnet 4.6's confidence on these is 0.95–0.97, so the threshold can't catch them.
- QuickBooks push (`api/integrations/quickbooks/push`) posts every transaction to one default expense account, ignoring the approved account. Hidden in the demo build.
- `eval-harness` app changes need review and a PR before `main`.
- Carried from the previous log, **not re-verified**: Stripe go-live config (live keys, live webhook secret, Billing Portal); duplicate test `trialing` rows.

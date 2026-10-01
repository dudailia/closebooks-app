# SESSION_LOG — CloseBooks handoff

**Last updated:** 2026-09-30 (evening). Working copy: `~/code/closebooks-app-fresh` (the `~/Desktop` copy is retired).
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
- **Splits and `categorizationSource` persisted** to Supabase via migration `supabase/migrations/20260926000000_transaction_splits_source.sql`, **applied in the Supabase SQL editor on 2026-09-26; both columns confirmed via `information_schema`.** (A fallback still saves without those columns if they're ever missing.)
- **Approve keeps the reviewer's chosen account** (was overwritten by the AI suggestion). CSV exports have no footer lines.
- `next.config.mjs` has `ignoreBuildErrors: false` and `ignoreDuringBuilds: false`: the build type-checks and lints. Test runner: vitest (`npm test`).

## On `overnight` (not merged; branched from `eval-harness` 2026-09-30)

Overnight session: docs for a CTO call, e2e test, client-by-id, migrations for
F5/F9/F10/F14 (not applied), dependency report, prepared experiments, one chart
source. **Read `docs/overnight-log.md` first**: its morning summary lists
what's done, tested, blocked and needs a decision.

## On `eval-harness` (not merged)

**Eval (`eval/`, see `eval/README.md`):** a 292-row synthetic labelled dataset (fictional Brightline Studio, 34-account Standard Small Business chart; 284 account labels, 8 REVIEW); `run.ts` runs the real engine with a hard budget cap; `metrics.ts`/`report.ts`/`compare.ts` score and report; `sweep-cli.ts` (threshold sweep) and `learn-cli.ts` (June corrections → rules) work from saved runs without API calls. Results live in `eval/results/` (gitignored).

**App changes also on this branch:**
- **2026-09-30 reliability/security:** categorisation runs 4 batches at a time (`CATEGORIZE_CONCURRENCY`, same prompts and results, input order kept; a 292-row upload projects to ~35 s vs ~128 s). Prompt text fields go through `sanitizePromptField` (one line, escaped, descriptions ≤200 chars) and are labelled as data, not instructions; the saved eval runs predate that label. `/api/notify` (called after upload) forwards the client name to Formspree without auth.
- **Categorisation model → `claude-sonnet-5-5`, auto-approve threshold 0.85 → 0.93 (decision 2026-09-30).** Evidence: `eval/results/comparison.md` + `eval/results/threshold-sweep.md` (synthetic data, 292 rows; Sonnet 5.5 pooled over 2 runs): at 0.93 wrong auto-approvals 0.4% (1 of 274) vs 5.8% for Sonnet 4.6 at 0.85; review load ~51 of 97 rows/statement vs ~19. Both values live in `src/lib/ai/models.ts` (`CATEGORIZE_MODEL`, `AUTO_APPROVE_THRESHOLD`, `AUTO_APPROVE_PERCENT`); read by `categorize.ts` (upload auto-approve, also `/api/demo/categorize`), `coaValidation.ts` default, `TransactionTable.tsx` ("approve high-confidence" + counts), `TransactionRow.tsx` (confidence pill), `/api/report` (auto-approved count), `demoData.ts` (sample statuses + summary), landing text (StatBand, HowItWorks, trustClaims, `/ref/[slug]`), and the eval harness via `categorize.ts` re-exports. Not changed: `/api/parse-pdf` (still Sonnet 4.6; unmeasured) and hidden features (copilot, autopilot, analytics, agent) that keep their own 0.85/0.90 values.
- `categorize.ts`: reads the reply's text blocks and ignores thinking blocks (Opus 5.5 replies were rejected); an unreadable reply is retried at most once (network errors up to 3). New `categorizeTransactionsWithUsage()` reports tokens/latency; `categorizeTransactions()` output unchanged.
- Rules: `vendorKey()` (`src/lib/review/vendor.ts`) strips month-to-month noise (dates, IDs, card digits, phones, state codes) and keeps type words (`DES:NET` vs `DES:TAX`); matching is exact on the key; rules store direction. **Rules now run first at upload** (matched rows skip the AI, source = firm rule), are loaded before they're applied (`ensureRulesLoaded`), and rule-applied rows on the review page are saved immediately.

## Results so far (synthetic data; see `eval/results/`)

- **Sonnet 4.6 (app's model), 2 runs × 292 rows:** accuracy 84.5% strict / 94.9% lenient; auto-approves 82%; 5.8% of auto-approved rows wrong (lenient); all 16 REVIEW predictions sent to review; ~$0.16 per 97-row statement.
- **Sonnet 5.5, 2 runs (pooled with `eval/merge-cli.ts`; run 2 on 2026-09-30 was cut by the $0.45 cap after 280 of 292 rows, last 12-row batch not sent):** 86.7% strict / 95.0% lenient; 5.3% of auto-approved rows wrong (lenient) at 0.85; ECE 0.092 vs 0.121; ~$0.115 vs $0.164 per 100 rows; 2.9% of rows changed account between runs (Sonnet 4.6: 1.4%). Haiku 4.5 (1 run) 75.4% / 86.6%, 13.0% wrong auto-approved. Opus 5.5 produced no usable predictions (thinking-block bug, since fixed on this branch).
- **Threshold sweep (Sonnet 5.5 pooled):** ≤2% wrong auto-approvals at 0.91 (4 of 291 wrong, review ~48 of 97 rows/statement), but run 2 alone needed 0.93. At 0.93: 1 of 274 wrong (0.4%), review ~51 of 97. Sonnet 4.6 needs 0.98 (~93 of 97). Today (4.6 at 0.85) reviews ~19 of 97. Remaining high-confidence Sonnet 5.5 errors are Stripe payouts → 4000 (should be 1100) and Gusto payroll tax → 5100 (2300). **Decision applied 2026-09-30 (on `eval-harness`, not `main`): categorisation now uses Sonnet 5.5 with auto-approve at 0.93** — see below.
- **Rules (projection from saved predictions):** with the new vendor keys, June corrections caught 5 of 188 July–August rows (all right, no wrong matches): every row in a bank format June had corrected. Lenient accuracy 94.5% → 95.6%, wrong auto-approvals 8 → 6. The other 11 same-vendor rows use a second bank format.
- API spend on evals: $1.94 on 2026-09-29 (smoke test $0.03 + capped runs $1.91); $0.41 on 2026-09-30 (ledger `eval/results/spend-ledger-2026-09-30.json`, cap $0.45): $0.32 for Sonnet 5.5 run 2, plus $0.09 for 4 calls from an interrupted invocation whose predictions were not saved.

## Open issues

- **Security (`docs/engine/rls-audit.md`, section 0 has the status):** hidden features' API routes now 404 (middleware allowlist, 13 routes served) and `/portal/*` 404s. **Two migrations written, not applied:** `20260930100000_portal_docs_service_role_only.sql` (portal-docs bucket open to the anon key) and `20260930200000_firm_usage_server_owned.sql` (members could reset their trial). Until applied, both holes are open to direct Supabase calls with the anon key; the middleware can't block those. Check the bucket with `supabase/checks/portal_docs_check.sql`. Also written, not applied: `20261001000000_subscriptions_by_firm.sql` (F8; the code already looks subscriptions up by firm and checkout needs a signed-in firm) and `20261001100000_lock_tables_outside_migrations.sql` (F15, `qbo_connections`). Read-only checks: `supabase/checks/open_findings_check.sql`. Still open: F5, F9, F10, F13, F14, F16, rest of F15.

- **Migration not applied:** `supabase/migrations/20260930000000_transaction_approved_by.sql` adds `transactions.approved_by` (who approved a row: ai / rule / reviewer; used by the close report's approval breakdown). Until it's applied, saves drop only that column (`src/lib/transactionPersistence.ts`) and reloaded rows fall back to `categorizationSource`, showing "not recorded" where it can't tell.

- The categorisation prompt sends deposits to revenue; client payments land on 4100 instead of 1100 AR. Consistent high-confidence errors: Gusto payroll tax → 6200 (should be 2300), sales-tax remittance → 6200 (2200), SBA loan → 2400 (2500). Sonnet 4.6's confidence on these is 0.95–0.97, so the threshold can't catch them.
- QuickBooks push (`api/integrations/quickbooks/push`) posts every transaction to one default expense account, ignoring the approved account. Hidden in the demo build.
- `eval-harness` app changes need review and a PR before `main`.
- Carried from the previous log, **not re-verified**: Stripe go-live config (live keys, live webhook secret, Billing Portal); duplicate test `trialing` rows.

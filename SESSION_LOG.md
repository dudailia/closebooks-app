# SESSION_LOG — CloseBooks handoff

**Last updated:** 2026-10-01, after `overnight` was merged into `main` (production deployed from `041a6ef`) and every migration in `docs/migrations-to-apply.md` was applied. Working copy: `~/code/closebooks-app-fresh` (the `~/Desktop` copy is retired).
Durable architecture lives in `CLAUDE.md`; this file is where things stand now.

## Branches

| Branch | State |
|---|---|
| `main` | Deployed by Vercel on push; production deployed from `041a6ef` (merge of `overnight`, 2026-10-01). Holds everything from `eval-harness` and `overnight` on top of `ce76fb20` (PR #44 `je-fix`, 2026-09-28). |
| `eval-harness`, `overnight` | Merged into `main` (`overnight` was branched from `eval-harness` on 2026-09-30 and contains it). |
| `je-fix`, `demo-hide` | Merged earlier (PRs #44, #43). |
| ~40 other remote branches (`cursor/*`, `feature/*`, `dependabot/*`, `demo-prep*`, `chore/next-16-upgrade`) | Old; not reviewed. |

History of the overnight session (CTO-call docs, e2e, client-by-id, migrations, dependency report, prepared experiments): `docs/overnight-log.md`.

## What the live app does (`main`)

- **Model and threshold:** categorisation uses `claude-sonnet-5-5`; a suggestion is auto-approved at confidence ≥ 0.93 with no chart-validation flag. Both live in `src/lib/ai/models.ts` (`CATEGORIZE_MODEL`, `AUTO_APPROVE_THRESHOLD`, `AUTO_APPROVE_PERCENT`) and are read by `categorize.ts` (upload and `/api/demo/categorize`), `coaValidation.ts`, `TransactionTable.tsx`, `TransactionRow.tsx`, `/api/report`, `demoData.ts`, the landing text and the eval harness. Decided 2026-09-30 from the synthetic eval (results below). **Not changed:** `/api/parse-pdf` is still Sonnet 4.6 (unmeasured), and the hidden features (copilot, autopilot, analytics, agent) keep their own 0.85/0.90 values.
- **Concurrency:** batches of 20 (`BATCH_SIZE`), 4 in flight at a time (`CATEGORIZE_CONCURRENCY`, `src/lib/categorize.ts`); same prompts and results, input order kept. One 292-row upload took about 40 s on the preview (2026-10-01, one stopwatch run), against ~128 s projected one batch at a time.
- **Statement size:** no row cap in the code. `/api/categorize` has 120 s (`vercel.json`), and the upload page sends every row the rules don't match in one request. At 292 rows in 40 s that is **roughly 900 rows**, an extrapolation from one run; rate limits under load are unmeasured. PDFs also hit Vercel's 4.5 MB request body (sent as base64 JSON; the browser allows 20 MB).
- **Rules first:** at upload, firm rules are loaded (`ensureRulesLoaded`) and applied before the model (`applyRulesBeforeAI`, `src/lib/review/rules.ts`). A matched row is **`approved`**, `approvedBy: 'rule'`, source `firm_rule`, confidence ≥ 0.99, and is not sent to the model. On the review page, saving a rule applies it the same way and saves those rows immediately. Rows saved before 2026-10-01 may show `edited` for a rule match, which also counts as approved. Rule keys come from `vendorKey()` (`src/lib/review/vendor.ts`: strips dates, IDs, card digits, phones and state codes, keeps type words like `DES:NET` vs `DES:TAX`); matching is exact on the key and rules store direction. `/get-started` (first close of a new account) doesn't apply rules; a new account has none.
- **Save-rule prompt:** every account change goes through `handleRecategorize` (`TransactionTable.tsx`), and the prompt and action toasts render on `document.body`. On the preview of 2026-10-01 the prompt never showed, because the page-enter animation left a `transform` on the page container that moved `position: fixed` children below the fold. Animations now end with `backwards` fill, and the e2e checks the prompt is inside the viewport.
- **Clients by id:** new closes store `client_id` and are matched to their client only by id (`src/lib/clientJobs.ts`), so two clients with the same name never share closes and a rename keeps them. `20261001200000_jobs_client_id.sql` (applied 2026-10-01, backfill re-run after the deploy) gave older jobs an id where exactly one client of the firm has the job's name. Closes still without an id (`/get-started`, and older ones whose name matches no client or several) match by name, and only when exactly one client has that name. If the column were ever missing, the save drops the id and retries without it (`src/lib/jobPersistence.ts`).
- **Prompt hygiene:** text fields go through `sanitizePromptField` (one line, escaped, descriptions ≤ 200 chars) and are labelled as data, not instructions. The saved eval runs predate the label.
- **Replies:** `categorize.ts` reads text blocks and ignores thinking blocks; an unreadable reply is retried once, and network errors up to 3 times. `categorizeTransactionsWithUsage()` reports tokens and latency.
- **From before (`je-fix`, `demo-hide`):** balanced journal entries per approved transaction (`src/lib/autopilot/journalEntries.ts`, spec `docs/engine/journal-entries.md`), JE CSV, and a journal section in the close report; splits and `categorizationSource` persisted; approve keeps the reviewer's account.
- **Hidden features:** their API routes 404 (middleware allowlist in `src/lib/features.ts`, 13 routes served) and `/portal/*` 404s.
- **Gate:** `npm test` (vitest, 187 tests, no API calls; includes migrations on PGlite), `npm run typecheck`, `npm run build` (type-checks and lints), `npm run e2e` (Playwright core path in demo mode with the fake model; outside requests blocked).

## Migrations

Applied by the owner in the Supabase SQL editor (not re-checkable from the repo, which has no access to the live database):

- `20260926000000_transaction_splits_source.sql`, 2026-09-26; columns confirmed via `information_schema`.
- `20260930000000_transaction_approved_by.sql`, 2026-09-30: `transactions.approved_by` (ai / rule / reviewer), used by the close report's approval breakdown. Older rows fall back to `categorizationSource` ("not recorded" where it can't tell).
- `20260930100000_portal_docs_service_role_only.sql` (F1), 2026-09-30: drops the policy that opened the portal-docs bucket to the anon key. `supabase/checks/portal_docs_check.sql` confirms it; whether anything was read before the fix can only be seen in Supabase's storage logs.

Applied on **2026-10-01**, all eight in the order in **`docs/migrations-to-apply.md`** (owner, Supabase SQL editor; reported by the owner, not re-checked from the repo):

- Before the deploy: `20261001100000_lock_tables_outside_migrations.sql` (F15, RLS on `qbo_connections`), `20261001000000_subscriptions_by_firm.sql` (F8), `20261001400000_member_check_caller_only.sql` (F10), `20261001500000_firms_owner_id_pinned.sql` (F14), `20261001600000_firm_members_insert_limits.sql` (F5), `20261001300000_brand_assets_firm_folder.sql` (F9), `20261001200000_jobs_client_id.sql`.
- After the deploy: `20260930200000_firm_usage_server_owned.sql` (F7: trial dates and plan are server-owned; closes are counted through `cb_record_close_used()`), and a second run of the `jobs_client_id` backfill (`update ... set client_id`) to link jobs created in between.

**Live test after the deploy (owner, 2026-10-01):** new signup, 14-day trial, an 8-row close (6 auto-approved, 2 pending), and the client shows 1 close.

Every migration from 2026-09-26 on is applied. `supabase/checks/open_findings_check.sql` (read-only) confirms each finding's live state; its results are not recorded in the repo.

`supabase/__tests__/migrations.test.ts` applies every migration in order to PGlite, then those from 2026-09-26 on a second time (the SQL editor doesn't record what ran). That shows the SQL runs; it says nothing about the live database.

## Results so far (synthetic data; see `eval/results/` and `docs/facts.md`)

**Eval (`eval/`, see `eval/README.md`):** a 292-row synthetic labelled dataset (fictional Brightline Studio, 34-account Standard Small Business chart; 284 account labels, 8 REVIEW). `run.ts` runs the real engine with a hard budget cap. `metrics.ts`, `report.ts` and `compare.ts` score and report. `sweep-cli.ts` (threshold sweep) and `learn-cli.ts` (June corrections → rules) work from saved runs without API calls. Results are gitignored; the cited summaries are committed.

- **Sonnet 4.6 (the old model), 2 runs × 292 rows:** 84.5% strict / 94.9% lenient; auto-approves 82%; 5.8% of auto-approved rows wrong (lenient) at 0.85; all 16 REVIEW predictions sent to review; ~$0.16 per 97-row statement.
- **Sonnet 5.5, 2 runs pooled (`eval/merge-cli.ts`; run 2 cut by the $0.45 cap after 280 of 292 rows):** 86.7% strict / 95.0% lenient; 5.3% wrong auto-approved (lenient) at 0.85; ECE 0.092 vs 0.121; ~$0.115 vs $0.164 per 100 rows; 2.9% of rows changed account between runs (Sonnet 4.6: 1.4%). Haiku 4.5 (1 run) 75.4% / 86.6%, 13.0% wrong auto-approved. Opus 5.5 produced no usable predictions (thinking-block bug, since fixed).
- **Threshold sweep (Sonnet 5.5 pooled):** at 0.93, 1 of 274 auto-approved rows wrong (0.4% lenient), review ~51 of 97 rows per statement (vs ~19 for Sonnet 4.6 at 0.85). ≤ 2% wrong at 0.91 pooled, but run 2 alone needed 0.93. The threshold was chosen and measured on the same 292 rows, with no held-out set. Remaining high-confidence Sonnet 5.5 errors: Stripe payouts → 4000 (should be 1100), Gusto payroll tax → 5100 (2300).
- **Live preview, 2026-10-01 (one run, 292 rows):** about 40 s; 128 auto-approved (43.8%), 164 pending, 0 flagged.
- **Rules (projection from saved predictions):** June corrections caught 5 of 188 July–August rows, all right: every row in a bank format June had corrected. Lenient accuracy 94.5% → 95.6%, wrong auto-approvals 8 → 6. The other 11 same-vendor rows use a second bank format.
- API spend on evals: $1.94 on 2026-09-29, $0.41 on 2026-09-30 (ledger `eval/results/spend-ledger-2026-09-30.json`). The 2026-10-01 preview upload used the app's key and is not in the ledger.

## Open issues

- **Security (`docs/engine/rls-audit.md`, section 0):** F1, F7, F8, F9, F10, F14, F15 (`qbo_connections`) and most of F5 are fixed by the applied migrations (above). Not covered by any migration: F5's consent gap (needs an invitation flow), F13, F16, and the rest of F15 (`inbox-attachments` bucket, `portal_tokens` drift). `/api/notify` (called after upload) forwards the client name to Formspree without auth.
- **Categorisation errors the threshold can't catch:** deposits go to revenue, so client payments land on 4100 instead of 1100 AR, plus the Stripe and Gusto errors above. A correction is sent to the model as a hint at the next upload, but with no saved rule the row can still come back below 0.93 and stay pending (seen on the preview with a Stripe row).
- **Long uploads run in one request**, with no queue and no resume; a failed request saves nothing (`upload/page.tsx`). Size limit above.
- **PDF path** still on Sonnet 4.6, without the thinking-block handling; unmeasured.
- QuickBooks push (`api/integrations/quickbooks/push`) posts every transaction to one default expense account, ignoring the approved account. Hidden in the demo build.
- Carried from earlier logs, **not re-verified:** Stripe go-live config (live keys, live webhook secret, Billing Portal); duplicate test `trialing` rows.

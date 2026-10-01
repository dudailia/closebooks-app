# RLS and service-role audit

Date: 2026-09-30. Branch: `eval-harness`. Read-only review; no policy or code was changed.

## 0. Status after fixes (2026-09-30)

Changes on `eval-harness`, commits `9a27a7ad` to `72f2b51f`:

- **Hidden features are off at the back end.** `src/middleware.ts` now runs on
  `/api/*` and returns 404 for every API route not in `VISIBLE_API_ROUTES`
  (`src/lib/features.ts`): 13 routes served, 87 blocked. `/portal/*` pages
  return 404 (`PORTAL_ENABLED = false`). `src/lib/__tests__/features.test.ts`
  walks `src/app/api` and checks that exactly the allowlist is served.
- **F1 migration applied; F7 written, not applied.**
  `supabase/migrations/20260930100000_portal_docs_service_role_only.sql` (F1)
  was applied by the owner in the Supabase SQL editor on 2026-09-30 (recorded 2026-10-01; not re-checked from the repo, which has no access to the live database). So was
  `20260930000000_transaction_approved_by.sql` (not a security finding).
  `supabase/migrations/20260930200000_firm_usage_server_owned.sql` (F7) is not
  applied. The app code works with each applied or not.
- **Applied as of 2026-10-01:** only those two (plus
  `20260926000000_transaction_splits_source.sql` on 2026-09-26). No other
  migration listed in this document is applied; the order to apply them is in
  [../migrations-to-apply.md](../migrations-to-apply.md).

**Migration tests (branch `overnight`).** `supabase/__tests__/migrations.test.ts`
(part of `npm test`) applies every file in `supabase/migrations/` in order to
PGlite (Postgres in WebAssembly, in memory) with small stand-ins for Supabase's
`auth.uid()`, roles and `storage` schema, then checks the F5, F9, F10 and F14
policies as a signed-in user and as anon: 17 tests. With the four new
migrations removed, 12 of them fail. This shows the SQL runs and the policies
decide as intended on Postgres; it does not show what the live database has.

**Important limit.** The middleware only blocks this app's routes. Anyone
with the public anon key can still call Supabase's REST and Storage APIs
directly, where only RLS applies. Findings that live in the database stay
open until their migration is applied.

| Finding | Status |
|---|---|
| F1 `portal-docs` bucket open to anon | **Fixed in the database:** the migration was applied on 2026-09-30 (reported by the owner; not re-checked from the repo). `supabase/checks/portal_docs_check.sql` query 2 should list no `portal-docs` policy, and query 1 shows how many objects the bucket holds. Whether anything was read while it was open can only be seen in Supabase's storage logs. |
| F2 portal routes update by id | Mitigated: every portal route returns 404. The route code is unchanged; fix it before re-enabling the portal. |
| F3 `/api/portal/ingest`, `/api/inbox/webhook` | Mitigated: both return 404. Fix before re-enabling (auth on ingest, make the webhook token required, remove the `supabase.rpc` payload write). |
| F4 inbox slugs not unique | Mitigated for now (inbox routes 404). The missing unique index remains. |
| F5 `firm_members` insert, `cb_firm_id()` | **Partly fixed; migration written, not applied** (branch `overnight`): `supabase/migrations/20261001600000_firm_members_insert_limits.sql`. Nobody can add a second `owner` row; only the owner can add or promote an admin; admins can add senior_accountant, staff or readonly. `cb_firm_id()` now returns the firm the caller owns, then their oldest membership. **Still open:** a user can be added to a firm without consenting (there is no invitation flow; no app code inserts `firm_members`). |
| F6 Plaid webhook signature | Mitigated: Plaid routes 404 (the Vercel cron at `/api/integrations/plaid/sync/cron` now gets 404 too). |
| F7 members can rewrite trial state | **Open in the database until the migration is applied.** The browser no longer writes `trial_started_at` or `plan_status` (`src/lib/freeTrial.ts`, `src/lib/db.ts`); after the migration, only `cb_ensure_firm_usage` and `cb_record_close_used` can change the row from a signed-in session. |
| F8 subscription keyed on email | **Code fixed; migration written, not applied.** Every lookup is by the caller's firm (`src/lib/subscriptionLookup.ts`); checkout requires a signed-in firm and ignores any email in the body; the pricing page sends visitors to sign up. `supabase/migrations/20261001000000_subscriptions_by_firm.sql` removes the email match from the select policy. Until applied, a signed-in user can still read a subscription row whose `customer_email` matches theirs through the REST API (no access or billing portal, since the app no longer uses the email match). |
| F9 `brand-assets` upload to any path | **Code fixed; migration written, not applied** (branch `overnight`): `20261001300000_brand_assets_firm_folder.sql` allows inserts only into `<firm_id>/...` for a firm where the caller is owner or admin, and drops `image/svg+xml` from the bucket's types. `/api/firm/logo` (still 404 in the demo) now finds the firm from the request's session instead of the browser client and accepts PNG, JPEG and WebP only. SVGs already stored are not deleted; `supabase/checks/open_findings_check.sql` lists them. |
| F10 `cb_is_member_of_firm` callable over RPC | **Migration written, not applied** (branch `overnight`): `20261001400000_member_check_caller_only.sql` keeps the signature but returns true only when `check_user` is the caller. Every caller in the repo passes `auth.uid()`, so policies are unchanged. Execute is not revoked, because policies call the function as the querying role. |
| F11, F12 portal pages | Mitigated: `/portal/*` returns 404. |
| F13 membership-only policies | Open at the database level; the affected routes (inbox, consolidation, Plaid, bank rec) return 404. |
| F14 admins can change `owner_id` | **Migration written, not applied** (branch `overnight`): `20261001500000_firms_owner_id_pinned.sql` adds a trigger that refuses an `owner_id` change from an anon or authenticated API session. The service role and direct database sessions can still transfer ownership. No app code changes `owner_id`. |
| F15 schema drift | Partly fixed: `supabase/migrations/20261001100000_lock_tables_outside_migrations.sql` enables RLS on `qbo_connections` and revokes anon/authenticated access (not applied). The live state is unknown; `supabase/checks/open_findings_check.sql` shows it. The `inbox-attachments` bucket and `portal_tokens` drift remain. |
| F16 user id as firm id | Open (fails closed for bank rec; portal and Plaid routes 404). |

## 1. What was reviewed and how

Files read:

- `supabase/migrations/*.sql` (18 files, `20260413000000_core_firms_clients_jobs.sql` through `20260930000000_transaction_approved_by.sql`)
- `supabase/CLOSEBOOKS_PASTE_ALL_IN_SUPABASE.sql`, `supabase/FIX_FIRM_MEMBERS_ORDER.sql`, `supabase/RUN_FIRST_CREATE_FIRMS_ONLY.sql` (hand-run copies of the migrations, plus a `subscriptions` stub)
- The commented schema in `.env.example` (lines 100 to 216)
- Every `.from('<table>')` and `.storage.from('<bucket>')` call under `src/`, the payload-table helper `src/lib/supabaseJsonTable.ts`, and every file that reads `SUPABASE_SERVICE_ROLE_KEY` or imports a service-role helper (`src/lib/supabase/serviceClient.ts`, `src/lib/portal/storage.ts`, `src/lib/portal/auth.ts`, `src/lib/plaid/storage.ts`, `src/lib/qboClient.ts`, `src/lib/routeSubscription.ts`, `src/lib/middlewareSubscription.ts`, and the API routes listed in section 4).

Method: policies were worked out from the SQL files in migration order (later `drop policy` / `create policy` statements replace earlier ones). Code was read to see which key each query uses and what it filters on. **The live Supabase database was not inspected.** Anything applied by hand in the Supabase dashboard (policies, buckets, grants, auth settings) is not visible here, so the live state may differ from what this document describes, in either direction.

CloseBooks has no paying customers and no real client data at the time of writing. Severity below describes what the code and SQL would allow, not a known incident.

Most of the affected features (portal, inbox, Plaid, bank rec) are hidden in the demo build by `src/lib/features.ts`, but that hides dashboard pages and UI only. Their API routes are still deployed and reachable, and the database policies apply regardless, so the findings stand.

Postgres rules used when reading the policies:

- A `for update` or `for all` policy with `using` but no `with check` reuses the `using` expression as the check. So those are not "insert without check" holes.
- A policy with no `to <role>` clause applies to every role, including `anon`.
- The service-role key bypasses RLS entirely.

## 2. Table inventory

Key to helpers (all `security definer`, `set search_path = public`, defined in `20260416000000_firm_members_rls_audit.sql`):

- `member(f)` = `cb_user_has_firm_access(f)`: the caller has a `firm_members` row for firm `f` (lines 52 to 60, via `cb_is_member_of_firm` lines 29 to 40).
- `write(f)` = `cb_can_write_firm(f)`: role is staff or higher (lines 89 to 97).
- `approve(f)` = `cb_can_approve(f)`: senior_accountant or higher (lines 109 to 117).
- `billing(f)` = `cb_can_manage_billing(f)`: owner or admin (lines 99 to 107).
- `cb_firm_id()`: first `firm_members.firm_id` for `auth.uid()`, `limit 1`, no `order by` (lines 119 to 127). Originally it read `firms.owner_id` (`20260414000000_business_data_rls.sql:6-14`); the 0416 version replaces it.

Migration short names: `0413` = `20260413000000_core_firms_clients_jobs.sql`, `0414` = `20260414000000_business_data_rls.sql`, `0415` = `20260415000001_subscriptions_stripe_production.sql`, `0416` = `20260416000000_firm_members_rls_audit.sql`, `0418` = `20260418000000_bank_rec.sql`, `0419` = `20260419000000_client_portal.sql`, `0419p` = `20260419100000_plaid.sql`, `0419j` = `20260419200000_journal_entries.sql`, `0421` = `20260421000000_inbox.sql`, `0421c` = `20260421100000_consolidation.sql`, `0422` = `20260422000000_fix_rls_security.sql`, `0423` = `20260423000000_category_rules.sql`, `0423a` = `20260423100000_ai_conversations.sql`, `0423b` = `20260423200000_brand_assets_bucket.sql`.

### 2a. Core and membership tables

| Table | Defined in | RLS | Policies (plain words) | Code example | Verdict |
|---|---|---|---|---|---|
| `firms` | 0413:4 | yes (0416:391) | select if member or owner; insert if `owner_id = auth.uid()`; update if member and owner/admin; no delete policy (0416:392-398) | `src/lib/db.ts:36` | OK (admin can change `owner_id`, see F14) |
| `firm_members` | 0416:7 | yes (0416:129) | select if caller is member of that firm; insert if (self row and caller owns the firm) or caller is owner/admin of the firm, any `user_id`, any role; update/delete if owner/admin (0416:138-154) | `src/app/api/settings/audit-log/route.ts:26` | risky policy (F5) |
| `clients` | 0413:12 | yes | select if member; all writes if member and staff+ (0416:407-410) | `src/lib/hydrateFirmData.ts:59` | OK |
| `jobs` | 0413:25 | yes | select if member; writes if member and staff+ (0416:419-422) | `src/app/portal/[token]/page.tsx:45` | OK |
| `transactions` | 0413:40 | yes | select/write if the parent job's firm passes member (+ staff+ for writes), with check on insert/update (0416:431-444) | `src/app/api/consolidation/detect/route.ts:105` | OK |
| `subscriptions` | not created in migrations (only `alter` in 0415:3-10); created in `CLOSEBOOKS_PASTE_ALL_IN_SUPABASE.sql:108` and `.env.example:151` | yes (0415:15) | select if firm member, or if `customer_email` equals the JWT email; no insert/update/delete policies, so only the service role writes (0416:453-459) | `src/app/api/subscription/route.ts:119` | not defined in migrations; email-keyed (F8) |
| `audit_log` | 0416:462 | yes | select if member and owner/admin; insert if member and `user_id = auth.uid()`; restrictive deny for anon (0416:482-490, 0422:111-116) | `src/app/api/settings/audit-log/route.ts:39` | OK |
| `user_sessions` | 0416:493 | yes | select/insert/update/delete where `user_id = auth.uid()`; restrictive deny for anon (0416:510-513, 0422:103-108) | `src/app/api/auth/sessions/route.ts:34` | OK |
| `firm_usage` | 0414:143 | yes | select if member; writes if member and staff+ (0416:223-226) | `src/app/api/subscription/route.ts:132` | risky for billing (F7) |
| `qbo_connections` | not in migrations; only commented SQL in `.env.example:166-181` | not found in repo (the `.env.example` comment enables it with no policies) | none in repo | `src/app/api/integrations/quickbooks/status/route.ts:47` (service role only) | not defined in repo |

### 2b. Firm-scoped business tables from 0414 (policies rewritten in 0416)

All of these have `firm_id uuid not null references firms(id)`, RLS enabled in 0414, and the 0414 policies were dropped and replaced in 0416:158-381. Pattern for every row below: **select if member(firm_id); insert/update/delete if member(firm_id) and the listed role check, with the same expression as `with check`**.

| Table | Created (0414 line) | Write role | 0416 policy lines | Code example | Verdict |
|---|---|---|---|---|---|
| `deadlines` | 18 | staff+ | 182-189 | `src/lib/calendarStore.ts:36` | OK |
| `firm_messages` | 51 | staff+ | 192-195 | `src/lib/clientMessages.ts:37` | OK |
| `compliance_tasks` | 76 | staff+ (delete: senior+) | 198-204 | `src/lib/complianceTasks.ts:31` | OK |
| `invoices` | 100 | owner/admin | 207-210 | `src/lib/billingStorage.ts:29` (helper) | OK |
| `rate_cards` | 115 | owner/admin | 212-215 | `src/lib/billingStorage.ts:19` | OK |
| `engagement_letters` | 126 | owner/admin | 217-220 | `src/lib/billingStorage.ts:37` (helper) | OK |
| `notifications` | 159 | staff+ | 229-232 | `src/lib/notifications.ts:38` | OK |
| `notification_read_state` | 174 | staff+ | 234-237 | `src/lib/notifications.ts:47` | OK |
| `document_requests` | 187 | staff+ | 240-243 | `src/lib/documentRequests.ts:43` (helper) | OK |
| `pipeline_entries` | 204 | staff+ | 245-248 | `src/lib/engagementPipeline.ts:26` (helper) | OK |
| `vault_documents` | 220 | staff+ | 250-253 | `src/lib/vaultStorage.ts:18` (helper) | OK |
| `vault_document_requests` | 235 | staff+ | 255-258 | `src/app/api/inbox/webhook/route.ts:86` | OK (see F3 for the webhook) |
| `activity_events` | 252 | staff+ | 261-264 | `src/lib/activity.ts:36` | OK |
| `audit_events` | 268 | staff+ | 266-269 | `src/lib/auditTrail.ts:31` | OK |
| `firm_settings` | 285 | owner/admin | 272-275 | `src/lib/firmSettings.ts:37` | OK (inbox slug issue, F4) |
| `regulatory_alert_statuses` | 298 | staff+ | 277-280 | `src/lib/firmDataHydration.ts:180` | OK |
| `corrections` | 317 | senior+ | 282-285 | `src/lib/corrections.ts:24` | OK |
| `advisory_memos` | 331 | staff+ | 287-290 | `src/lib/advisoryStorage.ts:16` (helper) | OK |
| `copilot_config` | 346 | owner/admin | 292-295 | `src/lib/copilotStorage.ts:18` | OK |
| `copilot_runs` | 357 | staff+ | 297-300 | `src/lib/firmDataHydration.ts:203` | OK |
| `integration_connections` | 373 | owner/admin; restrictive anon deny (0422:95-100) | 302-305 | `src/lib/integrations.ts:15` | OK |
| `benchmark_contributions` | 386 | staff+ | 307-310 | `src/lib/benchmarkNetwork.ts:198` | OK |
| `network_preferences` | 400 | staff+ | 312-315 | `src/lib/benchmarkNetwork.ts:196` | OK |
| `portal_client_tokens` | 413 | staff+; restrictive anon deny (0422:71-76) | 317-320 | `src/lib/firmDataHydration.ts:270` | OK |
| `tax_return_drafts` | 426 | staff+ | 322-325 | `src/lib/taxDraftsStore.ts:33` (helper) | OK |
| `audit_defense_audits` | 440 | senior+ | 327-330 | `src/lib/auditDefenseStore.ts:33` (helper) | OK |
| `team_members` | 454 | owner/admin | 333-336 | `src/lib/teamStore.ts:33` | OK |
| `referral_stats` | 468 | owner/admin | 338-341 | `src/lib/referralStore.ts:12` | OK |
| `autopilot_preferences` | 479 | staff+ | 343-346 | `src/lib/firmDataHydration.ts:232` | OK |
| `agent_preferences` | 490 | staff+ | 348-351 | `src/lib/agentPrefsStore.ts:11` | OK |
| `developer_settings` | 501 | owner/admin; restrictive anon deny (0422:79-84) | 353-356 | `src/lib/developerStore.ts:8` | OK |
| `insights_cache` | 513 | staff+ | 358-361 | `src/lib/insightsCache.ts:15` | OK |
| `client_close_statuses` | 524 | senior+ | 363-366 | no `.from` call found in `src/` | OK (unused) |
| `time_sessions` | 539 | staff+ | 368-371 | `src/lib/timeTracking.ts:29` (helper) | OK |
| `firm_ui_preferences` | 553 | staff+ | 373-376 | `src/lib/firmDataHydration.ts:260` | OK |
| `portal_inbound_uploads` | 564 | staff+ | 378-381 | `src/app/api/portal/ingest/route.ts:53` (service role) | policy OK; route is not (F3) |

Note on the payload helper (`src/lib/supabaseJsonTable.ts:27-30`): it upserts with `onConflict: 'id'`, and `id` is a global text primary key. If two firms ever used the same id, the second firm's upsert would hit the first firm's row and fail the update policy (an error, not a cross-firm overwrite). How ids are generated was not audited.

### 2c. Later feature tables

| Table | Defined in | RLS | Policies (plain words) | Code example | Verdict |
|---|---|---|---|---|---|
| `category_rules` | 0423:2 | yes | all where `firm_id = cb_firm_id()` (0423:15-16) | `src/lib/review/rules.ts:66` | OK, but depends on `cb_firm_id()` (F5) |
| `ai_conversations` | 0423a:1 | yes | all where `firm_id = cb_firm_id()` (0423a:14-15) | `src/lib/ai/conversationStore.ts:32` | OK, but depends on `cb_firm_id()` (F5) |
| `journal_entries` | 0419j:1 | yes | all where firm's `owner_id = auth.uid()`, with check (0419j:16-22) | `src/lib/copilot/actions.ts:27` | OK (owner only; invited members excluded) |
| `inbox_emails` | 0421:2 | yes | all if member, with check; any role incl. readonly can write (0421:23-25) | `src/app/api/inbox/emails/[id]/route.ts:32` | OK (weak role check, F13) |
| `inbox_attachments` | 0421:28 | yes | all if member, with check (0421:46-48) | `src/lib/inbox/inboxStore.ts:122` | OK (F13) |
| `entity_groups` | 0421c:1 | yes | all if member, with check (0421c:15-17) | `src/app/api/consolidation/detect/route.ts:40` | OK (F13) |
| `entity_group_members` | 0421c:19 | yes | all if the parent group's firm passes member (0421c:31-33); `client_id` is not checked to belong to the same firm | `src/app/api/consolidation/detect/route.ts:52` | OK (dangling cross-firm client ids possible, no data read through RLS) |
| `intercompany_transactions` | 0421c:35 | yes | same as above via `group_id` (0421c:52-54) | `src/app/api/consolidation/intercompany/route.ts:57` | OK |
| `bank_statements` | 0418:3 (`firm_id text`, no FK) | yes | originally `firm_id = auth.uid()::text` (0418:66-67); replaced by `cb_is_member_of_firm(firm_id::uuid, auth.uid())` with check (0422:44-51) | `src/lib/bank-rec/storage.ts:9` | policy OK; code writes the user id as `firm_id`, so RLS denies it (F16) |
| `bank_statement_lines` | 0418:15 | yes | all where parent statement is visible (0418:69-72) | `src/lib/bank-rec/storage.ts:33` | OK |
| `reconciliations` | 0418:28 | yes | replaced by `cb_is_member_of_firm(firm_id::uuid, ...)` (0422:53-60) | `src/lib/bank-rec/storage.ts:88` | policy OK; F16 |
| `reconciliation_items` | 0418:43 | yes | all where parent reconciliation is visible (0418:77-80) | `src/lib/bank-rec/storage.ts:146` | OK |
| `plaid_connections` | 0419p:2 (`firm_id text`) | yes | member of `firm_id::uuid`, with check (0422:24-31); restrictive anon deny (0422:87-92) | `src/lib/plaid/storage.ts:33` (service role only) | policy OK; code keys on user id (F16) |
| `plaid_transactions` | 0419p:20 | yes | member of `firm_id::uuid`, with check (0422:34-41) | `src/lib/plaid/storage.ts:175` (service role only) | policy OK; F16 |
| `portal_tokens` | 0419:10 (`firm_id text`); a different, conflicting shape in `.env.example:184-202` | yes (0419:91) | all where `firm_id = auth.uid()::text` (0419:98-99) | `src/lib/portal/auth.ts:21` (service role) | policy is self-scoped; real protection is in the routes (F2); schema drift (F15) |
| `portal_documents` | 0419:28 | yes | all where `firm_id = auth.uid()::text` (0419:101-102) | `src/lib/portal/storage.ts:35` (service role) | same as above |
| `portal_messages` | 0419:48 | yes | all where `firm_id = auth.uid()::text` (0419:104-105) | `src/lib/portal/storage.ts:106` (service role) | same as above |
| `portal_action_items` | 0419:64 | yes | all where `firm_id = auth.uid()::text` (0419:107-108) | `src/app/api/portal/actions/route.ts:48` (service role) | same as above |
| `portal_access_log` | 0419:79 | yes | all where the token's `firm_id = auth.uid()::text` (0419:110-113) | `src/lib/portal/auth.ts:35` (service role) | OK |

`0422:8-19` also turns RLS on for any `public` table that lacked it when that migration ran. A table with RLS on and no policies is deny-all for `anon` and `authenticated`.

### 2d. Storage buckets

| Bucket | Defined in | Public | Policies on `storage.objects` | Code | Verdict |
|---|---|---|---|---|---|
| `portal-docs` | 0419:4-7 | no | `portal_docs_service_role`: `for all using (bucket_id = 'portal-docs')`, **no `to` role**, so it applies to `anon` and `authenticated` (0419:116-117) | `src/app/api/portal/documents/route.ts:82`, `src/app/api/portal/actions/route.ts:102`, `src/lib/portal/storage.ts:82` | risky policy, critical (F1) |
| `brand-assets` | 0423b:1-4 | yes | insert for any `authenticated` user where `bucket_id = 'brand-assets'` (any path); select for everyone (0423b:6-13); no update/delete policy | `src/app/api/firm/logo/route.ts:27-32` | risky policy, low (F9) |
| `inbox-attachments` | not in repo; the comment at 0421:54-56 says to create it in the dashboard | unknown | unknown | `src/lib/inbox/attachmentProcessor.ts:88-89` (service role) | not defined in repo |

## 3. Findings, ranked by severity

### Critical

**F1. The `portal-docs` bucket is readable and writable by anyone holding the anon key.**
`supabase/migrations/20260419000000_client_portal.sql:116-117` creates `create policy "portal_docs_service_role" on storage.objects for all using (bucket_id = 'portal-docs')`. The name says "service role", but there is no `to service_role` clause, and the service role does not need a policy anyway. As written it grants select, insert, update and delete on every object in the bucket to every role, including `anon`. The anon key is public by design (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, sent to every browser). So anyone could list the bucket and download every client upload across all firms (paths are `<firmId>/<clientId>/...`, `src/app/api/portal/documents/route.ts:79`), overwrite files, or delete them. No later migration drops or narrows this policy. The bucket being private (`public = false`) does not help, because the RLS policy is what private buckets check.

### High

**F2. Portal routes use the service role and update rows by id without checking who owns them.**
The helpers in `src/lib/portal/storage.ts` filter only by `id` when updating: `updateDocumentStatus` (line 76), `completeActionItem` (192), `uncompleteActionItem` (198), `revokeToken` (268). The routes pass ids straight from the request:

- `DELETE /api/portal/tokens` (`src/app/api/portal/tokens/route.ts:44-53`): any signed-in user can expire any firm's portal token by id.
- `PATCH /api/portal/actions` firm path (`src/app/api/portal/actions/route.ts:133-145`): any signed-in user can complete or reopen any firm's action item.
- `PATCH /api/portal/actions` token path (`:81-127`): a portal token holder can complete or reopen any action item in any firm (the id is not checked against `session.firmId` / `session.clientId`), and read its title (`:113`).
- `POST /api/portal/documents` token path with `docId` (`src/app/api/portal/documents/route.ts:88-89`): a portal token holder can mark any firm's document as uploaded and point its `storage_path` at their own file.
- `PATCH /api/portal/documents` (`:138-147`): any signed-in user can change any document's status.

The ids are `gen_random_uuid()` values (0419:11, 29, 65), so an attacker has to learn an id first. That limits exploitation but is not an authorization check.

**F3. Two unauthenticated routes write into any firm's data with the service role.**

- `POST /api/portal/ingest` (`src/app/api/portal/ingest/route.ts:15-62`) has no auth at all. It takes `firmSlug` from the body, resolves it to a firm by exact UUID (`:36`), by case-insensitive name (`:41`), or by `ilike '%<slug>%'` (`:45`), then inserts the body `payload` into `portal_inbound_uploads` for that firm (`:53-56`). A slug of `%` matches any firm. The 404/200 difference also tells the caller whether a firm name exists.
- `POST /api/inbox/webhook` (`src/app/api/inbox/webhook/route.ts:28-33`) only checks the Postmark token when `POSTMARK_WEBHOOK_TOKEN` is set (`if (expected && token !== expected)`). If the env var is missing, anyone can post an email with attachments into any firm's inbox by slug, which also triggers an AI extraction call per attachment (`:132`). Separately, `:149-152` updates `vault_document_requests.payload` with `supabase.rpc` (a function value, not data); whatever that serializes to replaces the stored payload.

### Medium

**F4. Inbox slugs are not unique, so one firm could receive another firm's inbound email.**
The slug lives in `firm_settings.payload->>'inboxSlug'`, which owners/admins write. The index at `supabase/migrations/20260421000000_inbox.sql:51-52` is not unique. `getFirmIdBySlug` (`src/lib/inbox/inboxStore.ts:47-64`) uses `.maybeSingle()`, which errors when two rows match, then falls back to scanning every `firm_settings` row and taking the first match in whatever order Postgres returns. A firm that sets its slug to a victim firm's slug could get the victim's inbound email and attachments routed to it. Whether the settings UI prevents duplicate slugs was not checked; the database does not.

**F5. Owners/admins can add any user to their firm, and `cb_firm_id()` picks an arbitrary firm.**
`firm_members_insert` (`20260416000000_firm_members_rls_audit.sql:141-148`) lets an owner/admin insert a row for any `user_id`, with any role including `owner`, with no consent from that user. `cb_firm_id()` (`:119-127`) returns `firm_id ... limit 1` with no `order by`. For a user who belongs to two firms, which one it returns is not defined. `category_rules` (`20260423000000_category_rules.sql:15-16`) and `ai_conversations` (`20260423100000_ai_conversations.sql:14-15`) are scoped by `cb_firm_id()`, while the client writes rows with the firm id it looked up by `firms.owner_id` (`src/lib/supabase/firmScope.ts:14-18`). If an outside admin adds a user to their firm and `cb_firm_id()` starts returning that firm, the user's own rule and conversation reads return nothing and their writes fail. The files do not show a path where this leaks the victim's rows to the attacker, because writes fail the `with check` rather than landing in the other firm. `cb_firm_id()` cannot be spoofed directly: it only reads `auth.uid()`, which comes from the signed JWT.

**F6. The Plaid webhook signature check is incomplete.**
`src/app/api/integrations/plaid/webhooks/route.ts:13-23` skips verification entirely when the `plaid-verification` header is absent, and when present it only fetches the key for the `kid`; it never verifies the JWT signature or the body hash. Anyone who knows an `item_id` could set that connection's status to `error`/`login_required` (`:59-64`) or trigger a sync (`:48-57`). Item ids come from Plaid and are not exposed by the app's status route, which limits this.

**F7. Firm members can rewrite their own trial state.**
`firm_usage_all` (`20260416000000_firm_members_rls_audit.sql:223-226`) lets any staff+ member update `firm_usage` for their firm, including `trial_started_at` and `plan_status`. The server-side access gate reads `trial_started_at` from this table (`src/lib/routeSubscription.ts:98-106`, `src/lib/middlewareSubscription.ts:39-43`). A user could reset their own trial with the anon key. This is a billing bypass within one firm, not cross-firm access.

**F8. Subscription access is keyed on email.**
The `subscriptions` select policy matches `customer_email` against the JWT email (`20260416000000_firm_members_rls_audit.sql:453-459`), and the server gates look up the subscription by `user.email` with the service role (`src/lib/routeSubscription.ts:84-94`, `src/lib/middlewareSubscription.ts:45-53`). Checkout accepts an email from the request body when the caller is not signed in (`src/app/api/stripe/checkout/route.ts:57-58`). Whether a person can obtain a session for an email they do not control depends on the Supabase auth settings (email confirmation, secure email change), which live in the dashboard and were not visible.

### Low

**F9. `brand-assets` accepts uploads from any signed-in user to any path.** `20260423200000_brand_assets_bucket.sql:7-9` checks only the bucket id, not a firm prefix, and the bucket is public and allows `image/svg+xml` (`:3`). Any user can place files under another firm's folder name (no overwrite, since there is no update policy). The logo route builds the path from `getFirmIdForUser()` (`src/app/api/firm/logo/route.ts:11,25`), but that helper uses the browser client (`src/lib/supabase/firmScope.ts:5,10`), so on the server it likely returns null; this was not tested.

**F10. Security definer helpers take arbitrary arguments and are callable over RPC.** `cb_is_member_of_firm(check_firm, check_user)` (`20260416000000_firm_members_rls_audit.sql:29-40`) answers "is user X a member of firm Y" for any caller, bypassing RLS on `firm_members`. No `revoke execute` appears in the repo, so the Postgres default (execute granted to `public`) applies. It needs both UUIDs, so it is an information leak only. The other helpers only use `auth.uid()` and are fine. The two trigger functions (`20260424000000_firm_owner_auto_member_trigger.sql:6-18`, `20260925000000_auto_create_firm_on_signup.sql:14-51`) only act on the row being inserted and cannot be called directly.

**F11. The portal reports page lists jobs for the whole firm, not the client.** `src/app/portal/[token]/reports/page.tsx:30-37` filters `jobs` by `firm_id = session.firmId` and `status = 'complete'`, with no client filter; `src/app/portal/[token]/page.tsx:43-47` does the same. If `session.firmId` matched a real firm, one client's portal would show the firm's other clients' completed jobs. Today it does not match (F16), and the query selects columns (`period`, `close_summary`, `storage_path`) that no migration defines, so it likely returns nothing.

**F12. Portal sessions show the owner's auth user id.** `src/lib/portal/auth.ts:60` falls back to `data.firm_id` for the firm name, and `firm_id` in `portal_tokens` is the firm owner's `auth.users` id (F16). Clients can see that UUID.

**F13. Some policies skip the role check.** `inbox_emails`, `inbox_attachments`, `entity_groups`, `entity_group_members`, `intercompany_transactions` (0421, 0421c) and the Plaid/bank-rec policies (0422) check only membership, so a `readonly` member can write. This is within one firm.

**F14. Admins can change `firms.owner_id`.** `firms_update` (`20260416000000_firm_members_rls_audit.sql:397-398`) has no `with check` that pins `owner_id`, so an admin can set it to another user (limited by `unique (owner_id)`). The app uses `owner_id` to find "my firm" in many places.

### Schema drift and tables not defined in the repo

**F15.** Tables and buckets the code uses that the migrations do not fully define:

- `qbo_connections`: only in the commented `.env.example:166-181`. It holds QuickBooks access and refresh tokens. The code uses it only through the service role. Whether RLS is on in the live database cannot be seen from the repo.
- `subscriptions`: migrations only `alter` it (0415:3-10). The `create table` is in `supabase/CLOSEBOOKS_PASTE_ALL_IN_SUPABASE.sql:108-120` and `.env.example:151-163`.
- `inbox-attachments` bucket: created by hand (0421:54-56); its policies are unknown.
- `portal_tokens` has two conflicting shapes. The migration (0419:10-22) has `client_id`, `permissions`, `expires_at`. `.env.example:184-202` has `firm_name`, `cash_position`, `active` and others. `src/app/api/portal/data/[clientToken]/route.ts:32-48` selects the `.env.example` columns, which do not exist in the migration version. That route also falls back to the anon key when the service key is missing (`:10-14`).
- `jobs.period`, `jobs.close_summary`, `jobs.storage_path` are used by the portal pages but are not in any migration.

**F16. Several tables are keyed on the user id in code but on the firm id in RLS.** The portal, Plaid and bank-rec code writes `firm_id = user.id` (`src/app/api/portal/tokens/route.ts:13,38`, `src/app/api/portal/actions/route.ts:50`, `src/app/api/integrations/plaid/exchange/route.ts:50`, `src/app/api/bank-rec/reconciliation/route.ts:61`, `src/app/api/bank-rec/statement/route.ts:73`). The 0422 policies for Plaid and bank-rec require `cb_is_member_of_firm(firm_id::uuid, auth.uid())`, and a user id is never a firm id. Consequences:

- Bank-rec runs on the anon key with the user's session (`src/lib/bank-rec/storage.ts:1,5`), so its inserts should be refused by RLS. This fails closed.
- Plaid and portal work only because they use the service role, which bypasses RLS. For those tables, RLS is not what separates firms; the `user.id` filter in each route is.
- Portal data is tied to the individual user, not the firm, so other members of a firm cannot see it.

## 4. Service-role key usage

Every place that creates a client with `SUPABASE_SERVICE_ROLE_KEY` (RLS bypassed). No client component imports any of these (checked: no `'use client'` file imports a service-role module, and no `NEXT_PUBLIC_` variable holds the key).

| Module / route | What it does with the service role | Caller scoping | Verdict |
|---|---|---|---|
| `src/lib/routeSubscription.ts:20-25, 84-106` | reads `subscriptions` by caller email, `firms` by `owner_id = user.id`, `firm_usage` for that firm | signed-in user from cookies (`:40`) | OK (email-keyed, F8) |
| `src/lib/middlewareSubscription.ts:5-10, 37-53` | same reads for dashboard gating | user id/email passed from middleware | OK |
| `src/lib/portal/auth.ts:5-63` | looks up `portal_tokens` by token and expiry, logs access, reads `firm_settings` | token is a random UUID (0419:12) | OK (F12) |
| `src/lib/portal/storage.ts` | all portal table and `portal-docs` access | list reads filter by `(firm_id, client_id)`; updates at `:76, :192, :198, :268` filter by `id` only | risky (F2) |
| `src/app/api/portal/tokens/route.ts` | GET/POST via storage helpers | GET/POST use `user.id`; DELETE `:52` has no ownership check | DELETE not OK (F2) |
| `src/app/api/portal/actions/route.ts` | insert/update `portal_action_items`, upload to `portal-docs` | GET and POST scoped; PATCH `:108, :113, :126, :140-144` not scoped | PATCH not OK (F2) |
| `src/app/api/portal/documents/route.ts` | read/insert/update `portal_documents`, upload and sign `portal-docs` | GET scoped; upload path scoped to session; `docId` `:89` and PATCH `:146` not scoped | partly not OK (F2) |
| `src/app/api/portal/messages/route.ts` | read/insert `portal_messages` | scoped by session or `user.id`; `getMessagesAfter` (`storage.ts:117`) looks up the `after` id unscoped but only uses its timestamp | OK |
| `src/app/api/portal/data/[clientToken]/route.ts:9-48` | reads `portal_tokens` by token | token; falls back to anon key | OK for access; schema drift (F15) |
| `src/app/api/portal/ingest/route.ts:4-62` | resolves any firm by id or name, inserts `portal_inbound_uploads` | none | not OK (F3) |
| `src/app/portal/[token]/page.tsx:39-48`, `src/app/portal/[token]/reports/page.tsx:27-37` | reads `jobs` | valid token, but filters by firm only, not client | risky (F11) |
| `src/app/portal/[token]/layout.tsx`, `.../actions/page.tsx`, `.../messages/page.tsx` | token validation and scoped list reads via helpers | token | OK |
| `src/app/api/inbox/webhook/route.ts:42` (via `src/lib/supabase/serviceClient.ts`) | resolves firm by slug, writes `inbox_emails`, `inbox_attachments`, `inbox-attachments` storage, updates `vault_document_requests` | shared secret only if `POSTMARK_WEBHOOK_TOKEN` is set (`:28-33`) | risky (F3, F4) |
| `src/app/api/audit/log/route.ts:47-70` | inserts `audit_log` for a body-supplied `firm_id` | checks the caller has a `firm_members` row for that firm | OK |
| `src/app/api/settings/audit-log/route.ts:25-43` | reads `audit_log` | caller's first membership (`limit 1`), must be owner/admin | OK (multi-firm users get an arbitrary firm) |
| `src/app/api/auth/membership/route.ts:25-30` | reads caller's `firm_members` row | `user_id = user.id` | OK |
| `src/app/api/auth/sessions/route.ts` | reads/writes `user_sessions` | all queries include `user_id = user.id` (update `:43-44`, insert `:48`, delete `:96`) | OK |
| `src/app/api/billing/status/route.ts:37-43`, `src/app/api/sync/subscription/route.ts:26-32`, `src/app/api/stripe/portal/route.ts:31-33`, `src/app/api/stripe/invoices/route.ts:31-33`, `src/app/api/subscription/route.ts:119-132` | read `subscriptions` (and `firms`/`firm_usage`) | caller email / `owner_id = user.id` | OK (email-keyed, F8) |
| `src/app/api/stripe/checkout/route.ts:64-67` | reads caller's firm for metadata | `owner_id = user.id` | OK |
| `src/app/api/stripe/webhook/route.ts:124, 186, 205, 222` | upserts/updates `subscriptions` | Stripe signature verified (`:143-151`) | OK |
| `src/app/api/integrations/quickbooks/status/route.ts:36-50`, `.../disconnect/route.ts:25-35`, `.../push/route.ts:60-76`, `.../callback/route.ts:137-166`, `src/lib/qboClient.ts:69, 89, 205, 212` | read/write `qbo_connections` | firm from `owner_id = user.id`; callback also checks the OAuth state cookie (`:105-106`) | OK |
| `src/lib/plaid/storage.ts` and `src/app/api/integrations/plaid/{status,sync,link-token,disconnect,exchange}/route.ts` | read/write `plaid_connections`, `plaid_transactions` | `firm_id = user.id` in every call | OK (self-scoped; F16) |
| `src/app/api/integrations/plaid/sync/cron/route.ts:9-13` | syncs every active connection | `Authorization: Bearer $CRON_SECRET`, fails closed if unset | OK |
| `src/app/api/integrations/plaid/webhooks/route.ts` | updates connection status, triggers sync by `item_id` | incomplete verification (`:13-23`) | risky (F6) |

Anon-key server usage (RLS applies with the caller's session): `src/lib/supabase/routeAuth.ts:23-36` and `src/lib/supabase/server.ts:13-36` back the bank-rec (`src/lib/bank-rec/storage.ts`), consolidation (`src/app/api/consolidation/**`), inbox (`src/app/api/inbox/{archive,assign,emails,send-request}`), copilot (`src/app/api/copilot/{action,chat}`) and logo routes. The consolidation routes look up the firm by `owner_id = user.id` before querying. These rely on the policies in section 2. Bank-rec is affected by F16.

## 5. What could not be verified

- The live database: whether every migration here was applied, whether the hand-run SQL files were used instead, and whether policies, grants or buckets were added, changed or removed in the dashboard. In particular: whether `portal_docs_service_role` (F1) is still live, the RLS state and policies of `qbo_connections`, and the policies on the `inbox-attachments` bucket.
- Function grants: no `grant`/`revoke` statements exist in the repo, so the Postgres and Supabase defaults are assumed.
- Supabase Auth settings (email confirmation, secure email change, OAuth providers), which matter for F8.
- Environment variables in Vercel (`POSTMARK_WEBHOOK_TOKEN`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`), which decide whether F3 (inbox webhook) is open.
- How client-side ids for payload rows, jobs and transactions are generated (relevant to id collisions between firms).
- Whether the settings UI stops two firms choosing the same inbox slug (F4).
- Nothing was run: no queries, no API calls, no build. All findings come from reading files.

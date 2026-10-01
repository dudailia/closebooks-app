# Migrations to apply

Date: 2026-10-01. Branch: `overnight`. Nothing in this list is applied.

**Already applied** (owner, Supabase SQL editor): `20260926000000_transaction_splits_source.sql`
(2026-09-26), `20260930000000_transaction_approved_by.sql` and
`20260930100000_portal_docs_service_role_only.sql` (F1), both 2026-09-30.

**Not applied:** the 8 below. "Main" means the code on `main`, which is what
Vercel serves today. "Merge" means `eval-harness` and `overnight` reaching
`main` and deploying.

## Order

| # | File | What it does | When |
|---:|---|---|---|
| 1 | `20261001100000_lock_tables_outside_migrations.sql` | F15: turns on RLS for `qbo_connections` (QuickBooks access and refresh tokens) and revokes anon and authenticated access. | **Before the merge is fine.** Main reads and writes the table only with the service role, which RLS doesn't affect. |
| 2 | `20261001000000_subscriptions_by_firm.sql` | F8: the subscriptions select policy matches the caller's firm, not their email. | **Before is fine.** Main reads subscriptions only on the server with the service role. Rows with no `firm_id` become invisible to signed-in users (not to the service role). |
| 3 | `20261001400000_member_check_caller_only.sql` | F10: `cb_is_member_of_firm` answers only about the caller, so it can't be used to ask whether another user is in a firm. | **Before is fine.** Main never calls it over RPC; every policy passes `auth.uid()`. |
| 4 | `20261001500000_firms_owner_id_pinned.sql` | F14: a trigger refuses a change to `firms.owner_id` from an API session (anon or signed-in). Service role and SQL editor can still change it. | **Before is fine.** No code on main or the branch changes `owner_id`. |
| 5 | `20261001600000_firm_members_insert_limits.sql` | F5: nobody can add a second owner row; only the owner adds or promotes admins; `cb_firm_id()` prefers the firm the user owns. | **Before is fine.** No code on main inserts or updates `firm_members` (the signup trigger is security definer, so RLS doesn't apply to it). |
| 6 | `20261001300000_brand_assets_firm_folder.sql` | F9: `brand-assets` uploads only into `<firm_id>/...` for an owner or admin of that firm; SVG removed from allowed types. | **Before is fine.** Main's logo route already writes `<firmId>/logo-...`, which the new policy allows for owners and admins (its firm lookup uses the browser client and likely returns null on the server; not tested). Existing SVGs are not deleted. |
| 7 | `20261001200000_jobs_client_id.sql` | Adds `jobs.client_id` (closes linked to clients by id) and backfills it where exactly one client of the firm has the job's name. | **Before is fine, and better.** Main never names the column. Apply before the merge so the new code saves `client_id` from its first close. **After the merge, run its `update ... set client_id` statement once more** to link jobs main created in between. |
| 8 | `20260930200000_firm_usage_server_owned.sql` | F7: members can no longer write `firm_usage` (trial dates, plan); the browser creates the trial row with `cb_ensure_firm_usage()` and counts a close with `cb_record_close_used()`. | **After the merge, as soon as it deploys.** Before it, main breaks: its browser writes to `firm_usage` would be refused, so closes stop being counted, and signup fails if the firm wasn't already created by the signup trigger (`src/lib/db.ts:314` on main). After the merge but before this runs, the new code works, but it counts closes only through `cb_record_close_used()`, so closes used are not saved (the free-tier limit isn't enforced) until it is applied. |

Steps 1 to 6 don't depend on each other. This order is by exposure: step 1
guards OAuth tokens whose live protection is unknown; steps 3 to 6 are low
findings.

## Before and after

- **Before step 1:** run `supabase/checks/open_findings_check.sql` (read-only).
  It shows whether `qbo_connections` already has RLS, subscriptions with no
  firm (they lose access after step 2), users in more than one firm (step 5
  changes which firm `cb_firm_id()` picks for them), and SVGs in
  `brand-assets` (step 6).
- **After each:** the same file has a check per finding (policy lists,
  function definition, trigger name, bucket types).

## Tested how

`supabase/__tests__/migrations.test.ts` (in `npm test`) applies every
migration in order to PGlite (Postgres in memory, with stand-ins for
Supabase's auth, roles and storage) and checks the F5, F9, F10 and F14
policies as signed-in and anon users. It also applies every migration from
2026-09-26 on a **second time** and checks the policies still hold: the SQL
editor doesn't record what ran, so a later `supabase db push` would run them
again. This shows the SQL runs on Postgres; it doesn't show the live
database's state.

## Not covered by any migration

F5's consent gap (a user can be added to a firm without accepting; needs an
invitation flow), F13 (membership-only policies on hidden features), F16 (user
id stored as firm id in hidden features), and the rest of F15 (the
`inbox-attachments` bucket and `portal_tokens` drift). See
[engine/rls-audit.md](./engine/rls-audit.md).

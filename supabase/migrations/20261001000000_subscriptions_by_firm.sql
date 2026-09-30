-- subscriptions: readable only by members of the firm the subscription belongs to.
--
-- Before: "subscriptions_select" (20260416000000_firm_members_rls_audit.sql:453-459)
-- also matched customer_email against the JWT email. With email confirmation
-- off, anyone could sign up with an address used at checkout (the pricing page
-- accepted any email) and read that subscription; the server gates did the
-- same email match and opened that customer's Stripe billing portal.
-- See docs/engine/rls-audit.md, F8.
--
-- The app now looks subscriptions up by firm only (src/lib/subscriptionLookup.ts)
-- and checkout requires a signed-in firm, so firm_id is always in the Stripe
-- metadata the webhook stores. Writes stay service-role only (no write policy).

drop policy if exists "subscriptions_select" on public.subscriptions;
drop policy if exists "subscriptions_select_own_email" on public.subscriptions;
drop policy if exists "subscriptions_select_firm" on public.subscriptions;
drop policy if exists "subscriptions_select_own_firm" on public.subscriptions;

create policy "subscriptions_select" on public.subscriptions
  for select using (firm_id is not null and public.cb_user_has_firm_access(firm_id));

notify pgrst, 'reload schema';

-- Rows with no firm_id (anonymous checkouts) no longer grant access to anyone.
-- To link one by hand after checking who paid, run for that row only:
--   update public.subscriptions set firm_id = '<firm uuid>' where stripe_subscription_id = '<sub_...>';

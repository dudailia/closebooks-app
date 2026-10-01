-- Read-only checks for docs/engine/rls-audit.md findings. Run in the Supabase SQL editor.

-- F15: is qbo_connections protected? Expect rls_enabled = true and no anon/authenticated grants.
select c.relname, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'qbo_connections';

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'qbo_connections' and grantee in ('anon', 'authenticated');

select policyname, cmd, roles, qual from pg_policies where schemaname = 'public' and tablename = 'qbo_connections';

-- Any public table with RLS off (should return no rows).
select c.relname
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- F15: the hand-made inbox-attachments bucket and its policies.
select id, public from storage.buckets where id = 'inbox-attachments';

-- F8: subscriptions with no firm (they grant access to no one after the migration).
select stripe_subscription_id, customer_email, status, created_at
from public.subscriptions where firm_id is null order by created_at desc;

-- F8: current subscriptions policies.
select policyname, cmd, qual from pg_policies where schemaname = 'public' and tablename = 'subscriptions';

-- F9: brand-assets bucket types and insert policy; SVG objects already stored.
select id, public, allowed_mime_types from storage.buckets where id = 'brand-assets';
select policyname, cmd, with_check from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like '%brand%';
select name, created_at from storage.objects where bucket_id = 'brand-assets' and (name ilike '%.svg' or metadata->>'mimetype' = 'image/svg+xml');

-- F9: brand-assets objects outside a firm folder (first path segment is not a firm id).
select o.name from storage.objects o
where o.bucket_id = 'brand-assets'
  and not exists (select 1 from public.firms f where f.id::text = (storage.foldername(o.name))[1]);

-- F10: current definition of cb_is_member_of_firm (after the fix it compares check_user to auth.uid()).
select pg_get_functiondef('public.cb_is_member_of_firm(uuid, uuid)'::regprocedure);

-- F14: is the owner_id trigger installed?
select tgname from pg_trigger where tgrelid = 'public.firms'::regclass and not tgisinternal;

-- F5: users in more than one firm (cb_firm_id() picks one), and extra 'owner' rows.
select user_id, count(*) from public.firm_members group by user_id having count(*) > 1;
select fm.firm_id, fm.user_id from public.firm_members fm join public.firms f on f.id = fm.firm_id
where fm.role = 'owner' and fm.user_id <> f.owner_id;

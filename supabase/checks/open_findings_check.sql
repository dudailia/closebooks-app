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

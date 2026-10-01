-- Read-only checks for the portal-docs bucket. Run in the Supabase SQL editor.

-- 1. How many objects the bucket holds, and their total size.
select count(*)                                          as objects,
       coalesce(sum((metadata->>'size')::bigint), 0)     as total_bytes,
       min(created_at)                                   as oldest,
       max(created_at)                                   as newest
from storage.objects
where bucket_id = 'portal-docs';

-- 2. Every storage policy that could still reach the bucket. After the
--    migration, no row should mention portal-docs, and none should be a
--    policy with no bucket condition that applies to anon or authenticated.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 3. Bucket settings.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'portal-docs';

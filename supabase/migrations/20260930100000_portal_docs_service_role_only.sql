-- portal-docs: remove the policy that had no role limit.
--
-- 20260419000000_client_portal.sql created
--   create policy "portal_docs_service_role" on storage.objects
--     for all using (bucket_id = 'portal-docs');
-- with no `to` clause, so it applied to every role, including anon: anyone
-- with the public anon key could list, read, overwrite and delete every file
-- in the bucket. See docs/engine/rls-audit.md, F1.
--
-- The service role bypasses RLS and needs no policy. With the portal disabled
-- (src/lib/features.ts, PORTAL_ENABLED = false), nothing else should touch
-- this bucket, so after this migration anon and authenticated have no access.
-- The bucket and its files are kept.

drop policy if exists "portal_docs_service_role" on storage.objects;

-- Keep the bucket private (it already is; this makes it explicit).
update storage.buckets set public = false where id = 'portal-docs';

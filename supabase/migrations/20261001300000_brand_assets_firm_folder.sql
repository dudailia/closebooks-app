-- brand-assets: uploads only into the caller's own firm folder, and no SVG.
-- Written 2026-10-01 on branch `overnight`. NOT APPLIED. docs/engine/rls-audit.md, F9.
--
-- Before (20260423200000_brand_assets_bucket.sql:6-9): any signed-in user could
-- insert into brand-assets at any path, including another firm's folder, and
-- the bucket is public and accepted image/svg+xml (an SVG can carry script and
-- is served from a public URL).
--
-- After:
--   * insert: only into `<firm_id>/...` for a firm where the caller is owner or
--     admin (the roles that edit branding). The logo route already builds
--     paths as `${firmId}/logo-<timestamp>.<ext>` (src/app/api/firm/logo/route.ts).
--   * allowed types: png, jpeg, webp. Existing SVG objects are not deleted;
--     list them with supabase/checks/open_findings_check.sql.
--   * select (public read) unchanged. Still no update/delete policy, so files
--     can't be overwritten or removed from a session.

update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'brand-assets';

drop policy if exists "firm_members_upload_brand_assets" on storage.objects;
create policy "firm_members_upload_brand_assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'brand-assets'
    and exists (
      select 1
      from public.cb_member_firm_ids() as f(id)
      where f.id::text = (storage.foldername(name))[1]
        and public.cb_can_manage_billing(f.id)
    )
  );

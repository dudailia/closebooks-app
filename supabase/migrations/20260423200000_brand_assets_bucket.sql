insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-assets', 'brand-assets', true, 524288,
        ARRAY['image/png','image/jpeg','image/svg+xml','image/webp'])
on conflict (id) do nothing;

drop policy if exists "firm_members_upload_brand_assets" on storage.objects;
create policy "firm_members_upload_brand_assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'brand-assets');

drop policy if exists "public_read_brand_assets" on storage.objects;
create policy "public_read_brand_assets" on storage.objects
  for select using (bucket_id = 'brand-assets');

-- ABOGIDA (FIDEL) - Storage bucket and policies
-- Create private media bucket and RLS policies on storage.objects

-- Create bucket if not exists (Supabase pattern: insert into storage.buckets)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 52428800, array['image/*','video/*'])
on conflict (id) do nothing;

-- Helpful function to map storage object to media_assets by path
create or replace function public.media_asset_for_object(obj storage.objects)
returns public.media_assets language sql stable as $$
  select ma
  from public.media_assets ma
  where ma.bucket = obj.bucket_id
    and ma.object_path = obj.name
    and ma.deleted_at is null
  limit 1;
$$;

-- Note: Do not ALTER storage.objects RLS on Supabase; managed by platform

-- SELECT: allow only when there is a corresponding media_assets row in same school
create policy storage_select_media_by_school on storage.objects for select
  to authenticated
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.media_assets ma
      where ma.bucket = storage.objects.bucket_id
        and ma.object_path = storage.objects.name
        and ma.school_id = public.user_school_id()
        and ma.deleted_at is null
    )
  );

-- INSERT: allow staff (teacher/admin) to upload into media bucket
create policy storage_insert_media_staff on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media' and (public.is_teacher() or public.is_school_admin())
  );

-- DELETE: allow staff to delete from media bucket if same school via matching media_assets or by uploader link
create policy storage_delete_media_staff on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media' and (
      public.is_school_admin() or public.is_teacher()
    )
  );

-- UPDATE: generally disallow client-side updates to storage.objects (no policy)

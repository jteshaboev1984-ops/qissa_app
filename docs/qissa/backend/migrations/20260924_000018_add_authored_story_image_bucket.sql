-- Public, read-only-at-runtime storage for owner-approved authored-story illustrations.
-- Uploads remain an operator/admin action; browser clients receive no insert/update/delete policy.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-images',
  'story-images',
  true,
  5242880,
  array['image/webp', 'image/png']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

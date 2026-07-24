begin;

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ]::text[]
where id in ('portfolio-drafts', 'portfolio-media');

commit;

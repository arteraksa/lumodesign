begin;

update storage.buckets
set file_size_limit = 26214400
where id in ('portfolio-drafts', 'portfolio-media');

commit;

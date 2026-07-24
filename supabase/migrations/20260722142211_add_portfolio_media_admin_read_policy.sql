create policy "Portfolio media admin read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'portfolio-media'
  and can_manage_portfolio()
);

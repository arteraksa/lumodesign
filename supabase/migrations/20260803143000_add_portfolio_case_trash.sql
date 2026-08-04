begin;

alter table public.portfolio_cases add column if not exists deleted_at timestamptz;
comment on column public.portfolio_cases.deleted_at is 'Soft-delete timestamp. Cases remain restorable for 30 days before a scheduled permanent purge.';
create index if not exists portfolio_cases_deleted_at_idx on public.portfolio_cases (deleted_at) where deleted_at is not null;

drop policy if exists "Portfolio cases public published read" on public.portfolio_cases;
create policy "Portfolio cases public published read" on public.portfolio_cases for select to anon, authenticated using (status = 'published' and deleted_at is null);

create or replace function public.purge_deleted_portfolio_cases()
returns integer language plpgsql security definer set search_path = pg_catalog, public, storage as $$
declare asset record; purged_count integer;
begin
  for asset in select distinct bucket_id, object_name from (
    select c.cover_storage_bucket as bucket_id, c.cover_storage_path as object_name from public.portfolio_cases c where c.deleted_at <= now() - interval '30 days'
    union
    select m.storage_bucket, m.storage_path from public.portfolio_case_media m join public.portfolio_cases c on c.id = m.case_id where c.deleted_at <= now() - interval '30 days'
  ) assets where bucket_id in ('portfolio-drafts', 'portfolio-media') and object_name is not null loop
    delete from storage.objects where bucket_id = asset.bucket_id and name = asset.object_name;
  end loop;
  delete from public.portfolio_cases where deleted_at <= now() - interval '30 days';
  get diagnostics purged_count = row_count;
  return purged_count;
end;
$$;
revoke all on function public.purge_deleted_portfolio_cases() from public;

create extension if not exists pg_cron;
do $$ declare existing_job bigint; begin
  select jobid into existing_job from cron.job where jobname = 'purge-deleted-portfolio-cases';
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  perform cron.schedule('purge-deleted-portfolio-cases', '17 3 * * *', 'select public.purge_deleted_portfolio_cases()');
end; $$;

commit;

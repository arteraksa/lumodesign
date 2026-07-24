begin;

-- Public buckets are readable by object URL without a SELECT policy. Removing
-- this broad policy prevents anonymous bucket listing while keeping published
-- assets publicly addressable.
drop policy if exists "Portfolio media public read" on storage.objects;

-- Trigger functions do not need to be directly callable through the Data API.
revoke all on function public.portfolio_sync_case_archived_at() from public;
revoke execute on function public.portfolio_sync_case_archived_at() from anon, authenticated;

create index if not exists portfolio_cases_created_by_idx
on public.portfolio_cases (created_by)
where created_by is not null;

create index if not exists portfolio_cases_updated_by_idx
on public.portfolio_cases (updated_by)
where updated_by is not null;

commit;

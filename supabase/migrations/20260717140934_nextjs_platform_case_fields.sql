begin;

-- Incremental, non-destructive compatibility layer for the Next.js platform.
-- Portfolio CMS v2 must already exist. Re-running this migration is safe.
do $$
declare
  client_name_type text;
  archived_at_type text;
begin
  if to_regclass('public.portfolio_cases') is null then
    raise exception 'public.portfolio_cases is required; apply Portfolio CMS v2 first';
  end if;

  select format_type(a.atttypid, a.atttypmod)
  into client_name_type
  from pg_attribute a
  where a.attrelid = 'public.portfolio_cases'::regclass
    and a.attname = 'client_name'
    and not a.attisdropped;

  if client_name_type is not null and client_name_type <> 'text' then
    raise exception 'public.portfolio_cases.client_name has incompatible type %', client_name_type;
  end if;

  select format_type(a.atttypid, a.atttypmod)
  into archived_at_type
  from pg_attribute a
  where a.attrelid = 'public.portfolio_cases'::regclass
    and a.attname = 'archived_at'
    and not a.attisdropped;

  if archived_at_type is not null and archived_at_type <> 'timestamp with time zone' then
    raise exception 'public.portfolio_cases.archived_at has incompatible type %', archived_at_type;
  end if;
end;
$$;

alter table public.portfolio_cases
  add column if not exists client_name text not null default '',
  add column if not exists archived_at timestamptz;

-- Normalize only a partially-applied schema. A clean application adds the
-- column with its final default/NOT NULL contract and does not update rows,
-- avoiding audit/version triggers on existing cases.
update public.portfolio_cases
set client_name = ''
where client_name is null;

alter table public.portfolio_cases
  alter column client_name set default '',
  alter column client_name set not null;

comment on column public.portfolio_cases.client_name is
'Client or organization name displayed in case metadata.';

comment on column public.portfolio_cases.archived_at is
'Timestamp maintained automatically while status is archived.';

-- Preserve an existing archive timestamp. For pre-existing archived rows with
-- no timestamp, updated_at is the closest durable historical approximation.
update public.portfolio_cases
set archived_at = coalesce(archived_at, updated_at, now())
where status = 'archived'
  and archived_at is null;

update public.portfolio_cases
set archived_at = null
where status <> 'archived'
  and archived_at is not null;

create index if not exists portfolio_cases_archived_at_idx
on public.portfolio_cases (archived_at)
where archived_at is not null;

create or replace function public.portfolio_sync_case_archived_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.status = 'archived' then
    new.archived_at := coalesce(new.archived_at, now());
  else
    new.archived_at := null;
  end if;

  return new;
end;
$$;

comment on function public.portfolio_sync_case_archived_at() is
'Keeps archived_at populated only while a portfolio case has archived status.';

drop trigger if exists portfolio_cases_15_sync_archived_at on public.portfolio_cases;

create trigger portfolio_cases_15_sync_archived_at
before insert or update of status, archived_at on public.portfolio_cases
for each row execute function public.portfolio_sync_case_archived_at();

commit;

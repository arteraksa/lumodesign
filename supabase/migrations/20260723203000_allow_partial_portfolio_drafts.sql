begin;

alter table public.portfolio_cases
  drop constraint if exists portfolio_cases_categories_check,
  drop constraint if exists portfolio_cases_slug_key,
  drop constraint if exists portfolio_cases_slug_length_check,
  drop constraint if exists portfolio_cases_slug_not_blank_check,
  drop constraint if exists portfolio_cases_title_length_check;

alter table public.portfolio_cases
  add constraint portfolio_cases_title_length_check
    check (
      length(btrim(title)) <= 120
      and (status <> 'published' or length(btrim(title)) >= 2)
    ),
  add constraint portfolio_cases_slug_length_check
    check (
      length(btrim(slug)) <= 140
      and (status <> 'published' or length(btrim(slug)) >= 2)
    );

create unique index if not exists portfolio_cases_slug_unique_nonblank_idx
  on public.portfolio_cases (slug)
  where length(btrim(slug)) > 0;

create or replace function public.portfolio_validate_case_categories()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from unnest(new.categories) as category(name)
    where not exists (
      select 1
      from public.portfolio_categories registered
      where registered.name = category.name
        and registered.is_active
    )
  ) then
    raise exception 'portfolio case uses an unknown or inactive category';
  end if;
  return new;
end;
$$;

revoke all on function public.portfolio_validate_case_categories() from public;

drop trigger if exists portfolio_validate_case_categories on public.portfolio_cases;
create trigger portfolio_validate_case_categories
before insert or update of categories on public.portfolio_cases
for each row execute function public.portfolio_validate_case_categories();

commit;

begin;

create table public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_categories_name_key unique (name),
  constraint portfolio_categories_slug_key unique (slug),
  constraint portfolio_categories_name_check check (length(btrim(name)) between 2 and 80),
  constraint portfolio_categories_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

insert into public.portfolio_categories (name, slug) values
  ('Branding', 'branding'), ('Desenvolvimento', 'desenvolvimento'), ('Editorial', 'editorial'), ('UI/UX Design', 'ui-ux-design');

alter table public.portfolio_cases drop constraint if exists portfolio_cases_categories_check;

create function public.portfolio_touch_category_updated_at()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public
as $$ begin new.updated_at := now(); return new; end; $$;

create trigger portfolio_touch_category_updated_at
before update on public.portfolio_categories for each row execute function public.portfolio_touch_category_updated_at();

create function public.portfolio_validate_case_categories()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1 from unnest(new.categories) as category(name)
    where not exists (select 1 from public.portfolio_categories pc where pc.name = category.name and pc.is_active)
  ) then
    raise exception 'portfolio case uses an unknown or inactive category';
  end if;
  return new;
end; $$;

revoke all on function public.portfolio_validate_case_categories() from public;

create trigger portfolio_validate_case_categories
before insert or update of categories on public.portfolio_cases
for each row execute function public.portfolio_validate_case_categories();

alter table public.portfolio_categories enable row level security;
create policy "Published portfolio categories are readable"
on public.portfolio_categories for select to anon, authenticated using (is_active);
create policy "Portfolio admins manage categories"
on public.portfolio_categories for all to authenticated using (public.can_manage_portfolio()) with check (public.can_manage_portfolio());

grant select on public.portfolio_categories to anon, authenticated;
grant insert, update, delete on public.portfolio_categories to authenticated;
commit;

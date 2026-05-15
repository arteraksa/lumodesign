create extension if not exists pgcrypto;

create table if not exists public.cases (
  id text primary key,
  slug text not null unique,
  title text not null,
  tags text[] not null default '{}',
  description text not null default '',
  cover text not null default '',
  images text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.cases enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Cases are readable by everyone" on public.cases;
drop policy if exists "Admins can insert cases" on public.cases;
drop policy if exists "Admins can update cases" on public.cases;
drop policy if exists "Admins can delete cases" on public.cases;
drop policy if exists "Admins can read own admin status" on public.admin_users;

create policy "Cases are readable by everyone"
  on public.cases for select
  using (true);

create policy "Admins can insert cases"
  on public.cases for insert
  to authenticated
  with check (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

create policy "Admins can update cases"
  on public.cases for update
  to authenticated
  using (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

create policy "Admins can delete cases"
  on public.cases for delete
  to authenticated
  using (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

create policy "Admins can read own admin status"
  on public.admin_users for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on table public.cases to anon, authenticated;
grant insert, update, delete on table public.cases to authenticated;
grant select on table public.admin_users to authenticated;

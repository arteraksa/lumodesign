begin;

drop policy if exists "Published portfolio categories are readable" on public.portfolio_categories;
create policy "Published portfolio categories are readable"
on public.portfolio_categories
for select
to anon, authenticated
using (is_active);

commit;

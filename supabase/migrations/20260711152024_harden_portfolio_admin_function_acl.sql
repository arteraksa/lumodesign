begin;

-- Hardening only: tighten execution ACL for the existing Portfolio CMS v2
-- authorization helper. This intentionally does not recreate or alter the
-- function body, volatility, SECURITY DEFINER setting, or search_path.
revoke all on function public.can_manage_portfolio() from public;
revoke execute on function public.can_manage_portfolio() from anon;
grant execute on function public.can_manage_portfolio() to authenticated;

commit;

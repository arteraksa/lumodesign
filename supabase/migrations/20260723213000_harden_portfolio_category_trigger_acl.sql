begin;

revoke all on function public.portfolio_validate_case_categories() from public;
revoke execute on function public.portfolio_validate_case_categories() from anon;
revoke execute on function public.portfolio_validate_case_categories() from authenticated;

commit;

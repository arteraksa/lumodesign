# Portfolio Admin Function ACL Hardening

Date: 2026-07-11T15:21Z  
Project: `raksadesign`  
Project ref: `yzivkrotylwyglavtnho`

## Motivo

After applying Portfolio CMS v2, `public.can_manage_portfolio()` had the expected behavior and returned false for anon, but the remote function ACL included explicit `EXECUTE` for `anon`.

This hardening removes direct anon execution while keeping `authenticated` execution intact. No function logic was changed.

## ACL Antes

Captured before applying the hardening migration:

- `PUBLIC` execute: false
- `anon` execute: true
- `authenticated` execute: true
- execute grantees: `anon`, `authenticated`, `postgres`, `service_role`

Function properties before hardening:

- function: `public.can_manage_portfolio()`
- `SECURITY DEFINER`: true
- volatility: `STABLE`
- `search_path`: `pg_catalog, public, auth`

The only ACL issue was explicit `EXECUTE` for `anon`.

## Migration Aplicada

Local file:

```text
supabase/migrations/20260711152024_harden_portfolio_admin_function_acl.sql
```

SQL:

```sql
begin;

revoke all on function public.can_manage_portfolio() from public;
revoke execute on function public.can_manage_portfolio() from anon;
grant execute on function public.can_manage_portfolio() to authenticated;

commit;
```

Remote Supabase migration history entry:

- version: `20260711152111`
- name: `harden_portfolio_admin_function_acl`

The migration did not use `CREATE OR REPLACE`, did not recreate the function, and did not alter function body, volatility, `SECURITY DEFINER`, or `search_path`.

## ACL Depois

Captured after applying the hardening migration:

- `PUBLIC` execute: false
- `anon` execute: false
- `authenticated` execute: true
- execute grantees: `authenticated`, `postgres`, `service_role`

Function properties after hardening:

- `SECURITY DEFINER`: true
- volatility: `STABLE`
- `search_path`: `pg_catalog, public, auth`
- function definition unchanged

## Testes

Smoke tests were executed inside a transaction and finished with `ROLLBACK`.

Validated:

1. authenticated admin calls `public.can_manage_portfolio()` and receives true;
2. authenticated common user calls `public.can_manage_portfolio()` and receives false;
3. anon receives permission denied when invoking `public.can_manage_portfolio()` directly;
4. public read of published `portfolio_cases` still works;
5. public write to `portfolio_cases` remains blocked;
6. test fixtures were rolled back.

## Impacto Em Dados

No tables, policies, buckets, Storage objects, legacy rows, CRM rows, or CMS content were modified.

Post-validation counts:

- `public.portfolio_cases`: 0
- `public.portfolio_case_media`: 0
- `public.portfolio_case_slug_history`: 0
- `public.cases`: 40
- `case-images`: exists and remains public

No content was migrated.

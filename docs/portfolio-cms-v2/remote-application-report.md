# Portfolio CMS v2 - Remote Application Report

Date: 2026-07-11T00:18Z  
Project: `raksadesign`  
Project ref: `yzivkrotylwyglavtnho`  
Method: Supabase MCP `apply_migration`, applying only the contents of `supabase/migrations/20260710192407_portfolio_cms_v2.sql`.

No `supabase db push`, `db reset`, frontend deploy, content migration, Storage upload, or legacy data mutation was executed.

## Snapshot

Pre-application snapshot directory:

```text
docs/portfolio-cms-v2/remote-snapshot-before-application/
```

Files:

- `preflight.json`
- `public-cases-hash-inventory.json`
- `schema-policies-storage.md`

Snapshot highlights:

- `public.cases`: 40 rows
- `novo-case-*`: 4 rows
- `public.cases` aggregate md5: `df5e661ec75fc031582def13cba7382a`
- bucket `case-images`: present and public
- `portfolio-drafts`: absent before application
- `portfolio-media`: absent before application

## Pre-Application Verification

Confirmed through Supabase MCP before any remote write:

- project ref: `yzivkrotylwyglavtnho`
- project name: `raksadesign`
- `public.portfolio_cases`: absent
- `public.portfolio_case_media`: absent
- `public.portfolio_case_slug_history`: absent
- `public.can_manage_portfolio()`: absent
- bucket `portfolio-drafts`: absent
- bucket `portfolio-media`: absent
- `public.cases`: present with 40 rows
- `case-images`: present
- `public.is_admin()`: present
- `public.profiles`: present
- `public.admin_users`: present

## Administrative Authorization

The v2 authorization rule was checked against remote data before applying:

- users matching the primary `profiles` rule: 2
- users matching only `admin_users` fallback: 0
- rows in `admin_users`: 2

No emails or personal data were exported. At least one real administrator remains authorized by `public.can_manage_portfolio()`.

## Migration Result

Result: applied successfully.

Supabase migration history entry:

- version: `20260711001821`
- name: `portfolio_cms_v2`

The migration returned success and created all v2 objects. The SQL file itself contains `begin; ... commit;`, so failure inside the script would have aborted the transaction.

## Objects Created

Tables:

- `public.portfolio_cases`
- `public.portfolio_case_media`
- `public.portfolio_case_slug_history`

Function:

- `public.can_manage_portfolio()`

Buckets:

- `portfolio-drafts`, private
- `portfolio-media`, public

RLS was enabled on all three v2 tables.

## Policies

Public tables:

- `portfolio_cases`: public SELECT for `status = 'published'`; admin CRUD with `can_manage_portfolio()`.
- `portfolio_case_media`: public SELECT only for published cases and `portfolio-media`, `case-images`, or valid external HTTP/HTTPS media; admin CRUD with `can_manage_portfolio()`.
- `portfolio_case_slug_history`: public SELECT only when the related case is published; admin CRUD with `can_manage_portfolio()`.

Storage:

- `portfolio-drafts`: authenticated admin read/write/delete only, through `can_manage_portfolio()`.
- `portfolio-media`: public read; authenticated admin write/delete only, through `can_manage_portfolio()`.
- Write policies validate that object paths begin with a UUID segment.

Legacy `case-images` policies were not modified.

## Structural Validation

Confirmed after application:

- all requested `portfolio_cases` columns exist, including `cover_storage_bucket`;
- primary keys, foreign keys, unique constraints and check constraints exist;
- indexes exist for status, order fields, home featured ordering, timestamps, category GIN, media case/order, media storage, and slug history;
- triggers exist for audit fields, `updated_at`, version increments, `published_at`, publication validation, media publication validation, and slug history;
- `public.can_manage_portfolio()` is `SECURITY DEFINER`, `STABLE`, with `search_path=pg_catalog, public, auth`;
- `PUBLIC` does not have execute on `public.can_manage_portfolio()`;
- `authenticated` has execute on `public.can_manage_portfolio()`.

Observed Supabase-specific ACL nuance:

- `has_function_privilege('anon', public.can_manage_portfolio, 'execute')` returned true.
- `pg_proc.proacl` includes explicit grants for `anon`, `authenticated`, and `service_role`, despite the migration revoking `PUBLIC` and granting only `authenticated`.
- Smoke tests confirmed `anon` cannot write and `public.can_manage_portfolio()` returns false without an authenticated `auth.uid()`.
- This is not an observed write bypass, but it is a divergence from the desired "execute only authenticated" ACL and should be corrected in the next database-hardening migration if strict function ACL is required.

## Smoke Tests

Remote smoke tests were run inside a single transaction and finished with `ROLLBACK`.

Covered:

1. admin inserted a draft case;
2. admin read draft;
3. anon did not read draft;
4. published case with external HTTP/HTTPS cover worked;
5. publishing with `portfolio-drafts` cover failed;
6. version incremented once;
7. slug history was recorded;
8. slug/history collision was blocked;
9. Unicode slug was accepted;
10. external HTTP/HTTPS media was inserted;
11. draft media was not exposed publicly;
12. published media was exposed publicly;
13. common authenticated user could not insert;
14. `manager` role/access alone did not authorize;
15. `admin_users` fallback authorized;
16. fixtures were removed by rollback.

No Storage objects were created during remote smoke tests. Storage was validated by bucket metadata and policies.

## Client/PostgREST Validation

Using the public key already configured in `admin/supabase-config.js`, without exposing it:

- `GET /rest/v1/portfolio_cases?select=slug,status&status=eq.published`: HTTP 200, empty array;
- `GET /rest/v1/portfolio_cases?select=slug,status&status=eq.draft`: HTTP 200, empty array.

Because no v2 content has been migrated, an empty array is the expected result. There was no schema-cache error.

## Post-Application Counts

V2 tables after smoke test rollback:

- `public.portfolio_cases`: 0
- `public.portfolio_case_media`: 0
- `public.portfolio_case_slug_history`: 0

Legacy:

- `public.cases`: 40 before, 40 after
- `novo-case-*`: 4 before, 4 after
- `public.cases` aggregate md5 after: `df5e661ec75fc031582def13cba7382a`
- `case-images`: still present and public

CRM table counts matched the pre-application snapshot:

- `budgets`: 1
- `clients`: 1
- `products`: 1
- `projects`: 0
- `service_orders`: 0

## Content Migration

No content was migrated.

No rows were inserted permanently into v2 tables. No files were uploaded, copied, moved, or deleted from Storage.

## Remaining Risks

- The legacy `public.cases` public SELECT policy still calls `public.is_admin()` and produced a permission error through an anon raw-export attempt. This is pre-existing and outside the v2 migration.
- `public.can_manage_portfolio()` has explicit `anon` execute in remote ACL despite `PUBLIC` being revoked. The function still returns false for anon and RLS/write tests passed, but the ACL should be tightened in a follow-up hardening migration if the team wants exact privilege conformance.
- The remote migration history version differs from the local filename because MCP `apply_migration` generated its own timestamped entry while applying the v2 SQL content.

## Recommendation

The database layer is ready for the data migrator from a schema, RLS, trigger, and Storage-bucket perspective, with one recommended hardening item before exposing an admin UI broadly: explicitly revoke execute on `public.can_manage_portfolio()` from `anon` and confirm no Supabase default privilege re-adds it.

## Follow-Up Hardening

Completed on 2026-07-11:

- local migration: `supabase/migrations/20260711152024_harden_portfolio_admin_function_acl.sql`
- remote migration history: `20260711152111 / harden_portfolio_admin_function_acl`
- changed only the ACL for `public.can_manage_portfolio()`;
- revoked explicit `EXECUTE` from `anon`;
- kept `EXECUTE` for `authenticated`;
- kept `PUBLIC` without execute;
- did not alter function logic, tables, policies, buckets, legacy data, CRM data, or content.

Detailed report:

```text
docs/portfolio-cms-v2/portfolio-admin-function-hardening.md
```

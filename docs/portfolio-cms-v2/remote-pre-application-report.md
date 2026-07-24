# Portfolio CMS v2 - Remote Pre-Application Report

Date: 2026-07-11T00:14Z  
Project: `raksadesign`  
Project ref: `yzivkrotylwyglavtnho`  
Database: Supabase remote, PostgreSQL 17.6.1

## Verification Result

The project ref and name were confirmed through the Supabase MCP project list before any write operation.

Required v2 objects were absent:

- `public.portfolio_cases`: absent
- `public.portfolio_case_media`: absent
- `public.portfolio_case_slug_history`: absent
- `public.can_manage_portfolio()`: absent
- bucket `portfolio-drafts`: absent
- bucket `portfolio-media`: absent

Required legacy objects were present:

- `public.cases`: present, 40 rows
- four `novo-case-*` rows: present
- bucket `case-images`: present and public
- `public.is_admin()`: present
- `public.profiles`: present
- `public.admin_users`: present

## Administrative Authorization

The v2 authorization rule was checked against remote data before application:

- users authorized by the primary `profiles` rule: 2
- users authorized only through `admin_users` fallback: 0
- total rows in `admin_users`: 2

Emails and personal data were not exported. The rule has at least one real administrator, so the migration is safe to apply from an authorization-continuity standpoint.

## Snapshots Created

Created directory:

```text
docs/portfolio-cms-v2/remote-snapshot-before-application/
```

Files:

- `preflight.json`
- `public-cases-hash-inventory.json`
- `schema-policies-storage.md`

The snapshot includes counts, per-row hashes for all 40 `public.cases` rows, legacy policies, `public.is_admin()` behavior summary, relevant structure for `profiles` and `admin_users`, buckets, and `case-images` storage policy summaries.

## Risks Before Application

- The legacy `public.cases` public SELECT policy calls `public.is_admin()`. A public anon client query hit `permission denied for table profiles` during the raw-export attempt. This is pre-existing and was not changed in this phase.
- The snapshot is hash-based rather than a complete raw JSON dump of `public.cases` because the safe public client path failed and the full MCP result exceeded reliable artifact capture size. The hash inventory is sufficient to verify that legacy rows are unchanged before/after application.
- No content migration is part of this phase; v2 tables are expected to remain empty after application and smoke tests.

## Decision

The remote database is in the expected clean state for Portfolio CMS v2 application. Proceeding is acceptable if the migration is applied atomically and exclusively from `supabase/migrations/20260710192407_portfolio_cms_v2.sql`.

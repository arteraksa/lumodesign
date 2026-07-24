# Remote Migration History - Portfolio CMS v2

Date: 2026-07-11  
Project: `raksadesign`  
Project ref: `yzivkrotylwyglavtnho`

## Portfolio CMS v2 Migrations

Remote order confirmed with Supabase MCP `list_migrations`:

| order | remote timestamp | remote name | local file | purpose |
| ---: | --- | --- | --- | --- |
| 32 | `20260711001821` | `portfolio_cms_v2` | `supabase/migrations/20260710192407_portfolio_cms_v2.sql` | Created `portfolio_cases`, `portfolio_case_media`, `portfolio_case_slug_history`, `can_manage_portfolio()`, triggers, RLS policies, `portfolio-drafts`, and `portfolio-media`. |
| 33 | `20260711152111` | `harden_portfolio_admin_function_acl` | `supabase/migrations/20260711152024_harden_portfolio_admin_function_acl.sql` | Removed explicit `EXECUTE` from `anon` for `public.can_manage_portfolio()` and kept `authenticated` execute. |

## Required Confirmations

- Migration that created `portfolio_cases`: `20260711001821 / portfolio_cms_v2`.
- Migration that created `portfolio_case_media`: `20260711001821 / portfolio_cms_v2`.
- Migration that created `portfolio_case_slug_history`: `20260711001821 / portfolio_cms_v2`.
- Migration that created `can_manage_portfolio()`: `20260711001821 / portfolio_cms_v2`.
- Migration that created `portfolio-drafts`: `20260711001821 / portfolio_cms_v2`.
- Migration that created `portfolio-media`: `20260711001821 / portfolio_cms_v2`.
- Migration of hardening: `20260711152111 / harden_portfolio_admin_function_acl`.

## Local/Remote Timestamp Divergence

The remote timestamps for the two Portfolio CMS v2 migrations differ from the local filenames because they were applied through Supabase MCP `apply_migration`, which records its own remote migration timestamp:

- local `20260710192407_portfolio_cms_v2.sql` -> remote `20260711001821 / portfolio_cms_v2`;
- local `20260711152024_harden_portfolio_admin_function_acl.sql` -> remote `20260711152111 / harden_portfolio_admin_function_acl`.

This is a migration-history naming divergence only. The SQL content applied remotely matches the local migration intent.

## Remote Migrations Without Local File Equivalence

The remote history contains older migrations with timestamps that do not exactly match every current local filename, especially the June 2026 CRM/financial migrations. Those are legacy history items and are not part of Portfolio CMS v2.

For Portfolio CMS v2 specifically, both remote migrations have local files representing the applied SQL intent.

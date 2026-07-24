# Remote Security Verification - Portfolio CMS v2

Date: 2026-07-11  
Project: `raksadesign` (`yzivkrotylwyglavtnho`)

## Method

Smoke tests were run through Supabase MCP SQL inside a transaction and ended with `ROLLBACK`.

Synthetic fixtures were inserted only inside the transaction:

- admin profile user;
- common authenticated user;
- fallback `admin_users` user;
- one published v2 case;
- one draft v2 case;
- one `portfolio-media` object;
- one `portfolio-drafts` object.

## Results

All assertions passed:

- anon cannot execute `public.can_manage_portfolio()` directly; direct call returns permission denied.
- authenticated common user receives `false` from `public.can_manage_portfolio()`.
- explicit admin profile receives `true`.
- `admin_users` fallback receives `true`.
- anon reads only published `portfolio_cases`.
- anon does not read draft `portfolio_cases`.
- authenticated common user cannot write `portfolio_cases`.
- `portfolio-drafts` does not have public read.
- `portfolio-media` has public read.
- public write remains blocked.
- transaction rollback removed all fixtures.

## Post-Test Counts

- `public.portfolio_cases`: 0
- `public.portfolio_case_media`: 0
- `public.portfolio_case_slug_history`: 0
- hardening test auth users: 0
- hardening test profiles: 0
- hardening test storage objects: 0
- `public.cases`: 40
- `case-images`: exists and remains public.

No remote content was migrated or persisted.

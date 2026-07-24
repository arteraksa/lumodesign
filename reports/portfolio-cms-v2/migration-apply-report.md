# Portfolio CMS v2 Apply Report

Timestamp: 2026-07-11T20:17:47.373Z
Status: applied_committed
Project: raksadesign (yzivkrotylwyglavtnho)
Backup SHA-256: 13e1754324ff23716023b8fe8ccab4781ab54f89e0270a86699ebdbab1d79dd1

## Dry-run gate
- cases: 36
- excluded: 4
- media: 561
- blocked: 0
- warnings: 0
- errors: 0

## Apply result
- public.cases: 40
- public.portfolio_cases: 36
- public.portfolio_case_media: 561
- public.portfolio_case_slug_history: 0
- novo-case-* in portfolio_cases: 0
- orphan media: 0
- case UUID hash matches dry-run: true
- media UUID hash matches dry-run: true

## Scope guard
- No migrations were applied.
- Storage was not changed.
- public.cases was not changed.
- Frontend/deploy were not changed.
- Credentials were not printed or recorded.
- Local static media URLs were normalized to HTTPS public URLs to satisfy existing remote constraints.

## Smoke tests
- npm run portfolio:migrate:validate: passed
- remote post-apply readonly SQL checks: passed

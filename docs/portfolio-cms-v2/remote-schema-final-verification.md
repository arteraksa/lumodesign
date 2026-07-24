# Remote Schema Final Verification - Portfolio CMS v2

Date: 2026-07-11  
Project: `raksadesign` (`yzivkrotylwyglavtnho`)

Compared against:

- `supabase/migrations/20260710192407_portfolio_cms_v2.sql`
- `supabase/migrations/20260711152024_harden_portfolio_admin_function_acl.sql`
- `admin/types/portfolio-cms-v2.ts`

## Counts

- `public.cases`: 40
- `public.portfolio_cases`: 0
- `public.portfolio_case_media`: 0
- `public.portfolio_case_slug_history`: 0

## Tables

`portfolio_cases` remote columns match the local migration and TypeScript type:

- `id uuid not null default gen_random_uuid()`
- `legacy_id text null`
- `legacy_slug text null`
- `slug text not null`
- `title text not null`
- `status text not null default 'draft'`
- `categories text[] not null default '{}'`
- `excerpt text not null default ''`
- `content_json jsonb not null default {"type":"doc","content":[]}`
- `content_html text not null default ''`
- `cover_url text not null default ''`
- `cover_storage_bucket text null`
- `cover_storage_path text null`
- `external_url text not null default ''`
- `featured_on_home boolean not null default false`
- `home_order integer not null default 999`
- `portfolio_order integer not null default 999`
- `seo_title text not null default ''`
- `seo_description text not null default ''`
- `published_at timestamptz null`
- `created_by uuid null references auth.users(id) on delete set null`
- `updated_by uuid null references auth.users(id) on delete set null`
- `version integer not null default 1`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`portfolio_case_media` remote columns match:

- `id`, `case_id`, `source_url`, `storage_bucket`, `storage_path`, `media_type`, `alt_text`, `caption`, `width`, `height`, `sort_order`, `created_at`, `updated_at`.

`portfolio_case_slug_history` remote columns match:

- `id`, `case_id`, `old_slug`, `created_at`.

## Constraints And Indexes

Confirmed remotely:

- primary keys on all three v2 tables;
- `portfolio_cases.slug` unique;
- `portfolio_case_slug_history.old_slug` unique;
- foreign keys from media/history to `portfolio_cases` with `on delete cascade`;
- foreign keys from `created_by` and `updated_by` to `auth.users` with `on delete set null`;
- status check: `draft`, `published`, `archived`;
- media type check: `image`, `video`;
- category check: `Branding`, `Desenvolvimento`, `Editorial`, `UI/UX Design`;
- route-safe slug checks;
- cover bucket/path checks;
- published cover validation checks;
- URL checks for `external_url` and media `source_url`;
- indexes for status, ordering, featured home ordering, updated/published timestamps, categories GIN, media case/order, media storage, and slug history.

## RLS And Policies

RLS is enabled on:

- `public.portfolio_cases`
- `public.portfolio_case_media`
- `public.portfolio_case_slug_history`

Public policies:

- `portfolio_cases`: anon/authenticated SELECT only `status = 'published'`.
- `portfolio_case_media`: anon/authenticated SELECT only when related case is published and media is `portfolio-media`, `case-images`, or external HTTP/HTTPS.
- `portfolio_case_slug_history`: anon/authenticated SELECT only when related case is published.

Admin policies:

- CRUD on all three v2 tables for `authenticated` when `public.can_manage_portfolio()` returns true.

## Functions And Triggers

Confirmed remote functions:

- `public.can_manage_portfolio()`: `SECURITY DEFINER`, `STABLE`, `search_path = pg_catalog, public, auth`.
- `portfolio_set_case_audit_fields()`
- `portfolio_touch_case_updated_at()`
- `portfolio_increment_case_version()`
- `portfolio_sync_case_published_at()`
- `portfolio_validate_case_slug()`
- `portfolio_validate_case_publication()`
- `portfolio_record_slug_history()`
- `portfolio_touch_media_updated_at()`
- `portfolio_validate_media_publication()`
- `portfolio_validate_slug_history()`

Confirmed triggers:

- `portfolio_cases_10_validate_slug`
- `portfolio_cases_20_audit_fields`
- `portfolio_cases_30_touch_updated_at`
- `portfolio_cases_40_increment_version`
- `portfolio_cases_50_sync_published_at`
- `portfolio_cases_60_validate_publication`
- `portfolio_cases_70_record_slug_history`
- `portfolio_case_media_10_touch_updated_at`
- `portfolio_case_media_20_validate_publication`
- `portfolio_case_slug_history_10_validate`

## Storage

Confirmed buckets:

- `case-images`: public, legacy, unchanged.
- `portfolio-drafts`: private.
- `portfolio-media`: public.

Confirmed Storage policies:

- `portfolio-drafts`: authenticated admin read/insert/update/delete only, using `can_manage_portfolio()`.
- `portfolio-media`: public read for anon/authenticated; authenticated admin insert/update/delete only.
- Write policies validate that the first path segment is UUID-shaped.

## Divergences

No functional schema divergence was found between remote Portfolio CMS v2 and the local v2 migrations/types.

Known migration-history divergence:

- remote timestamps differ from local filenames because MCP `apply_migration` assigned remote versions.

Known ACL correction:

- initial remote `portfolio_cms_v2` had explicit anon execute on `can_manage_portfolio()`;
- hardening migration removed it;
- final state: `PUBLIC=false`, `anon=false`, `authenticated=true`.

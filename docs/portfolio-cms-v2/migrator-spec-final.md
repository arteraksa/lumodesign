# Portfolio CMS v2 Migrator Spec - Final Before Dry-Run

Date: 2026-07-11

This document specifies the migrator only. It must not be implemented or executed in this phase.

## Sources

Priority must be evaluated per field, not assumed globally.

Recommended default priority:

1. Current metadata: remote `public.cases`.
2. Formatted semantic content: static HTML in `cases/<slug>/index.html`.
3. Fallback data: `admin/data/cases.json`.
4. Media: preserve original URL/path first; no reupload in the first migration.

## Source Field Mapping

`portfolio_cases`:

- `id`: generated UUID, stable within dry-run output and apply manifest.
- `legacy_id`: remote `public.cases.id`.
- `legacy_slug`: remote `public.cases.slug`.
- `slug`: NFC-normalized remote slug.
- `title`: remote title.
- `status`: `published` if remote `published=true`, else `draft`.
- `categories`: remote `tags`, validated against v2 allowed categories.
- `excerpt`: remote `excerpt`; if empty, may remain empty.
- `content_json`: generated Tiptap document from static HTML semantic extraction; fallback to a valid empty doc.
- `content_html`: extracted semantic HTML from static case page; fallback to remote `description` or local JSON.
- `cover_url`: preserve remote cover URL/path when it is external or legacy URL.
- `cover_storage_bucket`: `case-images` only when the cover is a Supabase public URL for the legacy `case-images` bucket and object path can be parsed safely.
- `cover_storage_path`: object path inside `case-images`, without bucket prefix.
- `external_url`: remote `external_url`.
- `featured_on_home`: remote `featured_on_home`.
- `home_order`: remote `home_order`.
- `portfolio_order`: deterministic order from current portfolio/static ordering; default 999 for unresolved.
- `seo_title`: default title or empty until SEO pass.
- `seo_description`: remote excerpt/description summary or empty until SEO pass.
- `published_at`: for published records, use remote `updated_at` as migration approximation unless a better source is introduced.
- `created_by`, `updated_by`: null during migration unless apply runs under an authenticated admin and explicit attribution is desired.

`portfolio_case_media`:

- `case_id`: generated UUID for mapped `portfolio_cases` row.
- `source_url`: original image URL/path when not safely mapped to `case-images`.
- `storage_bucket`: `case-images` for parseable legacy bucket URLs; null for external/local Framer paths.
- `storage_path`: object path inside `case-images`; never include bucket prefix.
- `media_type`: `image` unless URL extension indicates video in a future pass.
- `alt_text`, `caption`: empty for first migration.
- `width`, `height`: parse from querystring when available; otherwise null.
- `sort_order`: stable array order.

`portfolio_case_slug_history`:

- no rows created during initial migration unless explicit slug changes are introduced.
- legacy slugs equal current slugs, including Unicode, so history is not needed for initial import.

## Unicode Slugs

Normalize all slugs to NFC before comparison or insert.

Known slugs requiring attention:

- `atitus-educação`
- `calendário-impresul-2023`
- `calendário-impresul-2024`
- `vacinas-infográfico`
- `voce-marca`

Static directories for some cases are decomposed Unicode. The migrator must compare normalized values but preserve the canonical remote slug string.

## Four `novo-case-*` Records

The four remote-only records must be treated as a separate class:

- include in dry-run report as `remote_only`;
- do not delete;
- do not migrate in default apply mode;
- allow `--include-remote-only` only after explicit review;
- block published records with empty cover/images unless remediated or imported as draft.

## Idempotency

Dry-run must compute deterministic plans without writes.

Apply mode must be idempotent using:

- `legacy_id`;
- `legacy_slug`;
- unique `slug`;
- optional manifest file recording generated UUIDs.

If a target v2 row already exists with matching `legacy_id` or slug, apply mode should update only when `--update-existing` is explicitly enabled. Default apply should fail on existing target rows to prevent silent overwrites.

## Modes

### Dry-Run

Required default.

Outputs:

- planned `portfolio_cases` rows;
- planned `portfolio_case_media` rows;
- skipped records and reasons;
- validation errors;
- slug normalization report;
- source precedence report by field;
- media classification report.

Dry-run must not write to Supabase.

### Apply

Not part of this phase.

Apply must:

- require explicit flag;
- require byte-complete backup of `public.cases`;
- verify v2 tables are empty or explicitly allow update mode;
- run in a transaction where possible;
- write cases first, media second;
- keep `portfolio_case_slug_history` empty unless needed;
- verify row counts after write.

## Rollback

Rollback plan for apply mode:

- use generated manifest of inserted UUIDs;
- delete `portfolio_case_media` by `case_id`;
- delete `portfolio_case_slug_history` by `case_id` if any;
- delete `portfolio_cases` by generated UUID or `legacy_id`;
- never touch `public.cases`;
- never touch `case-images`.

## Pre-Migration Validations

- remote project ref is `yzivkrotylwyglavtnho`;
- `public.cases` count is 40;
- v2 tables are empty unless update mode is explicit;
- `case-images` exists and is public;
- `portfolio-drafts` exists and is private;
- `portfolio-media` exists and is public;
- `can_manage_portfolio()` ACL has no anon execute;
- byte-complete backup exists;
- all slugs normalize without collision;
- all categories are in the allowed v2 set.

## Post-Migration Validations

- expected case count inserted;
- expected media count inserted;
- no published case references `portfolio-drafts`;
- no published case lacks valid cover unless imported as draft;
- anon reads only published v2 cases;
- draft metadata and draft media are not public;
- `public.cases` remains unchanged at 40;
- `case-images` remains unchanged.

## Reporting

The migrator must write:

- dry-run JSON plan;
- dry-run Markdown report;
- apply manifest JSON;
- post-apply verification report;
- rollback instructions specific to inserted UUIDs.

No frontend, renderer, or CMS code should be changed by the migrator.

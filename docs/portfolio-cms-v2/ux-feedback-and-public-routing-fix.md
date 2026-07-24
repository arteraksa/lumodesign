# Portfolio CMS v2 UX feedback and public routing fix

Date: 2026-07-14

## Scope

This change fixes the remaining published-update, feedback, detail-routing, title/badge, and cover/gallery separation issues without deploy, schema changes, migrations, service role, or destructive edits to the 36 migrated cases.

## Published update cause

The CMS had a visible `Atualizar publicacao` action, but it called the same `publishCase()` path used by drafts. That made the published flow unclear and mixed validation, Storage promotion, and the final optimistic-lock update without dedicated success/error states for already published content.

## New published update flow

`updatePublishedCase()` now:

- validates the current draft fields and gallery;
- promotes a draft cover only when the cover is still in `portfolio-drafts`;
- promotes only gallery rows that are still in `portfolio-drafts`;
- updates media rows after promotion;
- updates `portfolio_cases` with optimistic locking;
- keeps `status` as `published`;
- does not send `published_at`, preserving the original database value;
- returns the database row so local state can be refreshed from the authoritative record.

## Change states and feedback

The editor distinguishes draft unsaved changes from published unpublished changes through the existing save-state label. Pending-change protection now includes draft media, not only field edits.

The UI adds:

- global top progress for route/list/case/save/publish operations;
- publication step chips for validation, media promotion, record update, confirmation, and completion;
- accessible toast messages with title, description, keyboard focus, close button, and `aria-live`;
- critical error modal for version conflicts or possible partial publish/update failure;
- readable Supabase/storage/network/version error mapping.

## Upload progress

Supabase Storage upload in the current browser client path does not expose real byte progress. The CMS therefore shows honest indeterminate progress: file name, size, queued/uploading/processing/done/error state, and retry/error visibility, without invented percentages.

## Public detail routing

Cause of the flash: `scripts/serve.mjs` served `cases/index.html` for `/cases/:slug`, so the browser painted the Framer listing before `scripts/raksa-public-content.js` replaced it with the case detail.

Fix:

- new `cases/detail.html` shell for dynamic detail routes;
- `scripts/serve.mjs` serves that shell for `/cases/:slug` and `/raksadesign/cases/:slug/`;
- `cases/index.html` remains the list page;
- existing static case HTMLs remain in place;
- `?raksa-static-case-template=1` still allows the script to fetch a static case as the visual template.

## Title and badge

Dynamic details still clone the static Framer case template, then patch only the title text and badge text inside existing Framer wrappers. This preserves the static case structure, classes, CSS, typography, responsive breakpoints, and badge styling instead of replacing them with generic fallback markup.

## Cover and gallery separation

Data rule:

- cover lives in `cover_url`, `cover_storage_bucket`, `cover_storage_path`;
- gallery lives in `portfolio_case_media`;
- cover upload updates only cover fields;
- gallery upload inserts only gallery media rows;
- reorder operates only on gallery rows.

Public deduplication now compares:

1. `cover_storage_bucket + cover_storage_path` against media `storage_bucket + storage_path`;
2. normalized cover URL against normalized media URL.

Normalization removes query strings, hashes, trailing slash differences, and equivalent URL encoding. It does not compare by filename, visual position, sort order, or first-image status.

## Read-only audit of 36 published cases

Readonly anon REST audit:

- published cases checked: 36;
- possible cover/gallery duplicates: 1.

Duplicate candidate:

| case_id | slug | media_id | sort_order | criterion |
| --- | --- | --- | --- | --- |
| 87d68e2c-347d-5082-beea-089b40191120 | digital-marketing | 08a235ea-1a85-599e-be53-39bc39c74bfb | 0 | normalized_url |

No data cleanup was executed. If cleanup is desired, it should be a separate authorized write plan.

## Tests and validation

Commands run:

```bash
npm run portfolio:cms:lint
npm run portfolio:cms:test
npm run portfolio:cms:build
```

Results:

- lint passed;
- 5 test files passed;
- 26 tests passed;
- build passed with the existing large chunk warning.
- `npm run verify` passed.
- HTTP check confirmed `/raksadesign/cases/leylaw/` serves `cases/detail.html` with `.raksa-detail-shell` and no listing hero in the initial HTML.

Local servers restarted:

- public: `http://localhost:4174/raksadesign/cases/`;
- CMS: `http://localhost:5174/admin/portfolio/`.

## Limitations

- The controlled destructive CMS workflow with `test-cms-ux-public-fix` was not executed yet because it requires an authenticated admin browser session and real uploads.
- Browser-level Playwright validation was not executed because this checkout does not have Playwright or Puppeteer installed, and no dependency was added.
- No remote writes were performed during the 36-case audit.
- No schema, migration, or deploy was performed.

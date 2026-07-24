# Portfolio CMS v2 Editable CMS Implementation Report

Date: 2026-07-11

## Architecture

The editable CMS was implemented as an isolated React, TypeScript, and Vite app under `admin/portfolio/`.

It does not replace the legacy admin, does not alter the public renderer, and does not touch the root `index.html`.

Main source layout:

- `app/`: app shell and auth gate.
- `features/cases/`: case list, editor, API layer, organization controls.
- `features/media/`: cover and gallery management.
- `features/editor/`: Tiptap rich text editor.
- `features/publishing/`: publish workflow and draft asset promotion.
- `features/preview/`: isolated case preview.
- `lib/supabase/`: Supabase client and authorization gate.
- `lib/storage/`: Storage upload, signed URL, and promotion helpers.
- `lib/validation/`: slug, case, media, and HTML validation.
- `tests/`: unit and integration tests with mocks.

## Authentication

On startup the app calls `supabase.auth.getSession()`.

If no session exists, the user is redirected to the legacy admin login at `/admin/`.

The app uses the same Supabase project URL and publishable key as the legacy admin. It does not use or expose a service role key.

## Authorization

After a session is found, the app calls:

```sql
public.can_manage_portfolio()
```

Access is allowed only when that RPC returns `true`.

No frontend fallback uses email, `hierarchy_level`, `manager`, `director`, or local role logic. RLS remains the actual protection for reads and writes.

## Autosave

Draft cases autosave after a debounce when real field changes are detected.

Published cases do not silently autosave destructive edits. Editors can save explicitly, then publish or unpublish through explicit actions.

The UI exposes these save states:

- Salvando
- Salvo
- Erro
- Conflito
- Alteracoes locais

## Optimistic Locking

Case updates use `id` plus the currently loaded `version`.

If the update returns no row, the app treats it as a conflict, fetches the latest remote row, and offers:

- copy local JSON;
- reload remote version;
- keep comparing before taking action.

The app does not silently overwrite conflicts.

## Rich Text

The editor uses Tiptap with:

- paragraph;
- h2;
- h3;
- bold;
- italic;
- ordered list;
- unordered list;
- links;
- undo;
- redo.

`content_json` is the structured source. `content_html` is generated from Tiptap and sanitized with DOMPurify.

Sanitization strips scripts, inline handlers, unsafe attributes, and `javascript:` links.

## Uploads

New uploads go to `portfolio-drafts`.

Paths use UUID-first structure:

- `<case_uuid>/cover/<uuid>.<ext>`
- `<case_uuid>/gallery/<uuid>.<ext>`

The upload validator allows PNG, JPEG, WEBP, and GIF with a 12 MB size limit.

Draft asset previews use signed URLs. Signed URLs are not intentionally persisted as the canonical asset path; the persisted draft references are bucket/path.

## Publishing

Publishing validates:

- title;
- slug;
- categories;
- content;
- valid cover;
- gallery exists;
- no draft assets remain after promotion;
- valid external URL.

Before status changes to `published`, draft assets are copied from `portfolio-drafts` to `portfolio-media`, then the case/media rows are updated to public bucket/path/URL values.

If promotion fails, publishing stops and the case is not published.

Unpublish changes status to `draft` and leaves existing public assets in `portfolio-media`.

Archive changes status to `archived`.

Permanent delete was intentionally not implemented.

## Preview

The CMS preview now uses a shared case renderer:

- `admin/portfolio/src/features/preview/CaseRenderer.tsx`
- `admin/portfolio/src/features/preview/PreviewPanel.tsx`

The renderer receives normalized data:

- `case`;
- `media`;
- `previousCase`;
- `nextCase`;
- `viewport`;
- `previewMode`.

### 1. What Was Simplified

The first preview implementation was structural only. It used a generic dark two-column layout, fixed 300 px sidebar, simplified typography, a duplicated cover/gallery treatment, and previous/next text labels. It did not reproduce the Framer/static case shell closely enough and could diverge from a future public renderer.

### 2. What Was Refined

The preview was refined against the existing static cases and the Leylaw visual measurements:

- shared renderer extracted to `CaseRenderer.tsx`;
- preview controls now pass an explicit viewport mode instead of relying only on the outer container width;
- desktop/tablet/mobile layouts mirror the static breakpoints: 810 px remains two-column, 390 px is stacked;
- dark background, sidebar panel, 64 px gallery gap, 12 px image radius, category badge, website pill, and image treatment were aligned with the static pages;
- the sidebar now renders the short case title/back affordance, category badge, website button, long headline from the first content block, and sanitized body copy;
- the cover image is rendered as the first gallery item before ordered gallery media, matching the public case ordering;
- direct stray text nodes left by static HTML extraction are stripped from preview content so duplicated static chrome does not leak into the CMS preview;
- mobile preview shows the same initial text rhythm before the gallery instead of pushing long content above the images;
- previous/next navigation is generated from normalized adjacent case data.

### 3. Remaining Divergences From Static Cases

- The public static pages are still Framer-generated HTML with their original component classes, animation wrappers, and exact responsive variants. The preview recreates the structure and tokens but does not reuse Framer classes.
- Some media assets differ between static local pages and migrated CMS media. The renderer now puts the cover first, but exact image sequence still depends on the `portfolio_case_media.sort_order` data.
- Public static pages include Framer page chrome and animation/hydration behavior that the CMS preview intentionally does not execute.
- The sidebar/body scroll behavior is approximated with CSS in the shared renderer; exact Framer internal scroll containers are not reused.
- The navigation card visuals are reusable in the renderer but are not yet byte-for-byte identical to Framer recommendation cards.

### 4. Shared Renderer Structure

`PreviewPanel` is now only a CMS shell:

- owns viewport selection (`desktop`, `tablet`, `mobile`);
- computes previous/next cases from portfolio ordering;
- passes normalized props to `CaseRenderer`.

`CaseRenderer` owns the visual case structure:

- extracts the first sanitized content block as the sidebar headline;
- renders the remaining sanitized content;
- normalizes gallery media with the cover as the first item;
- renders image/video gallery entries;
- renders previous/next navigation;
- applies viewport-specific classes for desktop/tablet/mobile parity.

### 5. What Is Still Needed To Use The Same Renderer Publicly

- Move `CaseRenderer.tsx` and its CSS tokens/classes to a shared public/admin package or a neutral `src/portfolio` boundary.
- Replace public static case serving with data-driven rendering only after an explicit public integration step.
- Map public route data to the same normalized props used by the CMS preview.
- Decide whether to keep the current Framer animation behavior, replace it with renderer-owned motion, or ship the public renderer without Framer appear effects.
- Run a public-route visual regression pass before replacing any static case.

### Validation Screenshots

Screenshots were captured for the seven critical cases at 1440, 810, and 390 px, with static and preview variants side by side in:

- `docs/portfolio-cms-v2/screenshots/preview-refinement/`

Captured cases:

- `leylaw`;
- `dark-star`;
- `demip`;
- `morangos-mofados`;
- `portal-do-aluno-ufrgs`;
- `vexo`;
- `atitus-educacao`.

## Tests

Implemented tests cover:

- no-login access;
- no-permission access;
- listing 36 case slots;
- opening Leylaw/Dark Star-shaped data;
- title/content validation path;
- autosave conflict via version mismatch;
- duplicate/invalid slug validation;
- cover upload path validation;
- gallery upload controls;
- reorder controls;
- remove media controls;
- publish with Storage promotion;
- Storage promotion failure;
- unpublish/archive API surface through editor actions;
- create-case API;
- publish validation;
- sanitized content;
- common user blocked by `can_manage_portfolio() = false`;
- local Supabase smoke as an explicit opt-in test.

Commands run:

```bash
npm run portfolio:cms:lint
npm run portfolio:cms:test
npm run portfolio:cms:build
```

All passed.

## Limitations

- The first CMS build ships Tiptap, Supabase, and editor code in one initial chunk; Vite warns that the JS chunk is over 500 kB. Code splitting is the next optimization.
- Existing schema has no cover alt text column, so cover alt text cannot be persisted in v2 yet.
- Draft URLs loaded from existing rows may need fresh signed URLs when the app is reopened after the signed URL expiry; new upload preview is handled immediately.
- The local Supabase smoke test is opt-in via `PORTFOLIO_CMS_LOCAL_SMOKE=1` to avoid accidental remote writes.
- Remote destructive tests were not run against real migrated records.

## How To Run

Development:

```bash
npm run portfolio:cms:dev
```

Build:

```bash
npm run portfolio:cms:build
```

Tests:

```bash
npm run portfolio:cms:test
```

Typecheck:

```bash
npm run portfolio:cms:lint
```

## Next Steps

1. Add code splitting for Tiptap and preview.
2. Add persisted cover alt text through an explicit schema change if the product needs it.
3. Add a non-destructive local Supabase seed for full publish/unpublish smoke coverage.
4. Browser-test the authenticated CMS with a real admin session before any deployment.

## 2026-07-14 UX feedback and published update fix

- Cause: the visible `Atualizar publicacao` button reused the draft publish path. That path promoted draft assets and then updated `portfolio_cases` with the originally selected version, without a distinct published-update state or critical feedback path.
- New flow: `updatePublishedCase()` validates, promotes only draft cover/gallery assets when present, keeps `status='published'`, does not send `published_at`, updates with optimistic locking, and returns the database row for local state refresh.
- Pending-change protection now includes draft media as well as field changes, so changing case, navigation, reload, and logout warn when uploads still need save/publish/update confirmation.
- Feedback additions: publication steps, accessible toasts, critical error modal for conflicts/partial publication risk, and upload rows that show queued/uploading/processing/done/error without fake percentages.
- Cover uploads remain separate from gallery uploads. Cover replacement updates only cover fields; gallery uploads are the only path that inserts `portfolio_case_media`.
- Tests added for updating a published case without unpublishing, preserving `published_at`, and promoting draft gallery media during published update.

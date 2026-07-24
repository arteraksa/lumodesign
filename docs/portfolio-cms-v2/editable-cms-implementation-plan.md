# Editable Portfolio CMS v2 Implementation Plan

## Scope

Build the editable CMS on top of the migrated `public.portfolio_cases` and `public.portfolio_case_media` records without changing the legacy `public.cases` renderer.

## Access Control

- Gate every read/write admin route with `can_manage_portfolio()`.
- Keep public reads limited to published cases through the existing RLS model.
- Deny writes for ordinary authenticated users and anonymous users.
- Use server-side checks for all mutations; the client must not be trusted for role decisions.

## Case List

- List all 36 migrated cases for admins.
- Include search by title, slug, category, and status.
- Include filters for status, category, featured home state, missing cover, missing gallery, and draft changes.
- Sort by `portfolio_order`, `home_order`, updated date, title, and status.

## Case Creation And Editing

- Create new cases as drafts.
- Edit title, slug, categories, status, cover, gallery, rich text content, external URL, featured home flag, `home_order`, `portfolio_order`, and SEO fields.
- Validate slug uniqueness against `portfolio_cases.slug` and `portfolio_case_slug_history.old_slug`.
- Store slug changes in `portfolio_case_slug_history`.
- Preserve deterministic ordering controls with explicit reorder operations.

## Rich Text

- Store editor state in `content_json`.
- Render sanitized `content_html` from the rich text model.
- Support headings, paragraphs, bold, italic, links, lists, quotes, and image embeds.
- Reject unsafe HTML and unsupported embeds server-side.

## Drafts, Autosave, And Publishing

- Autosave draft edits with conflict detection.
- Use optimistic locking through `version`; every update must include the version read by the editor.
- Return a conflict response when the stored version changed.
- Publish only when required fields, valid categories, cover, gallery, content, and SEO checks pass.
- Support unpublishing without deleting content.
- Support archiving as a non-public status.

## Media Workflow

- Upload draft media to `portfolio-drafts`.
- Keep draft media separate from published media.
- On publish, copy approved files from `portfolio-drafts` to `portfolio-media`.
- Preserve source metadata, dimensions, alt text, captions, and `sort_order`.
- Do not delete draft assets until publish has fully succeeded.
- Provide rollback behavior for failed publish copies.

## Preview

- Provide preview for drafts and unpublished changes through authenticated admin routes.
- Preview must render the same `content_json`, `content_html`, cover, gallery, external URL, home flags, SEO, and ordering data that would be published.

## Error Handling

- Show field-level validation errors.
- Show publish blockers before attempting writes.
- Log mutation failures without exposing credentials or internal tokens.
- Keep failed media operations recoverable and retryable.

## Rollback

- For editorial updates, keep previous row snapshots or audit entries sufficient to restore the prior version.
- For publish media moves, record copied object paths and delete only those paths if the transaction fails before final publish.
- Never roll back by deleting unrelated rows or Storage folders.

## Tests

- Unit test validators for slug, categories, status, SEO, media metadata, and rich text sanitization.
- Integration test create, autosave, update with version conflict, publish, unpublish, archive, media reorder, and slug history.
- RLS test anonymous published reads, anonymous draft denial, admin full access, and ordinary user write denial.
- Regression test the 36 migrated records can be listed, opened, reordered, previewed, and republished without data loss.

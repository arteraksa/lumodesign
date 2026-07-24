# Portfolio CMS v2 Dry-Run Final Prep

Date: 2026-07-11

Scope: final preparation for content migration dry-run. No remote writes, migrations, Storage operations, deploys, frontend changes, CMS changes, renderer changes, or apply execution were performed.

## Full Remote Backup

The full `public.cases` backup was materialized at:

- `backups/portfolio-cms-v2/public-cases-before-migration-full.json`
- `backups/portfolio-cms-v2/public-cases-before-migration-full.sha256`
- `backups/portfolio-cms-v2/public-cases-full-validation.md`

Method:

- confirmed real columns through remote catalog/MCP read-only SQL;
- confirmed current remote aggregate md5 still matched the prior row-hash inventory;
- read the 39 public/published rows through PostgREST using the versioned publishable key with only the `apikey` header;
- read the single draft row through Supabase MCP with a SELECT-only query because the legacy policy blocks anon access to drafts;
- merged the four column-level blocked fields on published rows (`title`, `published`, `featured_on_home`, `home_order`) from the MCP row-hash inventory, after confirming the aggregate hash remained unchanged.

Validated result:

- total records: 40;
- published: 39;
- drafts: 1;
- unique ids: 40;
- unique slugs: 40;
- truncation/placeholder markers: 0;
- SHA-256: `13e1754324ff23716023b8fe8ccab4781ab54f89e0270a86699ebdbab1d79dd1`.

## Dry-Run Result

Commands:

- `npm run portfolio:migrate:dry-run`
- `npm run portfolio:migrate:dry-run`
- `npm run portfolio:migrate:validate`

Final output:

- `dry_run_complete`: true;
- `apply_allowed`: false;
- proposed cases: 40;
- proposed media: 564;
- published: 39;
- drafts: 1;
- blocked: 2;
- warnings: 10;
- errors: 4;
- determinism hash: `5182e103e6851acf7dc0b31e34cdab049f3f432a2aae9e9382311554ed13c217`.

Determinism was checked by hashing generated dry-run artifacts after two consecutive runs. `--apply` was tested and rejected.

## Media Audit

Report files:

- `reports/portfolio-cms-v2/media-audit.md`
- `reports/portfolio-cms-v2/media-audit.json`

The proposed media count remains 564 because remote `images` is the primary gallery source and already contains the authoritative arrays. The HTML extractor was hardened for fallback paths to read only `[data-framer-name="imagens-scroll"]`, ignore navigation/UI images, ignore SVG/data URI assets, and dedupe canonical URL variants.

Cases with more than 30 media items require human review:

- `dark-star`: 38;
- `demip`: 71;
- `leylaw`: 49;
- `morangos-mofados`: 50;
- `portal-do-aluno-ufrgs`: 51;
- `vexo`: 47.

No case exceeded the hard alert threshold of 80.

## Human Decisions

Report files:

- `reports/portfolio-cms-v2/new-cases-review.md`
- `reports/portfolio-cms-v2/new-cases-review.json`
- `reports/portfolio-cms-v2/human-decisions-required.md`
- `reports/portfolio-cms-v2/human-decisions-required.json`

Blocked cases:

- `novo-case-1780074762889`: published, no cover, no gallery, no static HTML, empty content.
- `novo-case-1780960017640`: published, no cover, no gallery, no static HTML, empty content.

Other `novo-case-*` records:

- `novo-case-1779977160261`: draft with one cover and one image, remote-only, empty content, requires confirmation before migration.
- `novo-case-1780068948570`: published with cover, two images, external URL `https://www.google.com.br`, remote-only, empty content, requires human decision.

## Preview

Updated local preview:

- `reports/portfolio-cms-v2/preview/index.html`

The preview displays backup completeness, final media count, apply-disabled warning, filters for blocked/human-decision/`novo-case-*`, per-case source comparison, warnings, errors, cover, content, and gallery.

## Protections

- No `portfolio:migrate:apply` script exists.
- `--apply` exits with `Apply is disabled until explicit approval and full backup.`
- `apply_allowed` remains false even with `dry_run_complete=true`.
- The migrator does not import `@supabase/supabase-js`.
- No insert/update/upsert/delete SQL or Storage operation is implemented.
- No `.env` file was found under the project root during the final check.

## Recommendation

Do not apply yet. Resolve the two blocked published `novo-case-*` records and review all 18 human decisions before enabling any migration apply path.

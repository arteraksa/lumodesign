# Public Cases Before Migration - Summary

Date: 2026-07-11  
Project ref: `yzivkrotylwyglavtnho`  
Table: `public.cases`

## Counts

- total: 40
- published: 39
- drafts/unpublished: 1
- featured on home: 9
- sem capa: 2
- sem imagens: 2
- sem external_url: 29
- content_blocks vazios: 40
- client_id nulo: 40

## Slugs Unicode

- `atitus-educação`
- `calendário-impresul-2023`
- `calendário-impresul-2024`
- `vacinas-infográfico`
- `voce-marca`

Static filesystem directories for some of these are stored in decomposed Unicode and must be normalized to NFC before slug comparisons.

## Slugs `novo-case-*`

Remote-only records:

- `novo-case-1779977160261`: unpublished, has cover, 1 image, empty description, no external URL.
- `novo-case-1780068948570`: published, has cover, 2 images, empty description, has external URL.
- `novo-case-1780074762889`: published, no cover, 0 images, empty description, no external URL.
- `novo-case-1780960017640`: published, no cover, 0 images, empty description, no external URL.

These are likely admin/test records and must not be deleted automatically. The dry-run migrator should classify them separately and require an explicit decision.

## Categorias Encontradas

- `Branding`
- `Desenvolvimento`
- `Editorial`
- `UI/UX Design`

## Duplicidades

- No duplicate slugs were observed in the remote summary.
- Remote `id` equals `slug` for the legacy cases observed.

## Campos Nulos / Vazios

- `client_id`: null for all 40.
- `content_blocks`: empty array for all 40.
- `excerpt`: empty for all 40.
- `description`: empty in the four `novo-case-*` records.
- `cover`: empty in `novo-case-1780074762889` and `novo-case-1780960017640`.
- `images`: empty in `novo-case-1780074762889` and `novo-case-1780960017640`.

## Full Export Command

The available MCP transport truncated the full JSON payload. Before running any apply migrator, generate the byte-complete snapshot with an authenticated Postgres connection:

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -Atc \
  "select jsonb_pretty(jsonb_agg(to_jsonb(c) order by slug)) from public.cases c" \
  > backups/portfolio-cms-v2/public-cases-before-migration.json
```

Do not use the public anon REST path for this export; the legacy `public.cases` policy can fail by evaluating `public.is_admin()` against `public.profiles`.

# Legacy Data Diff - Remote Supabase vs Local JSON

Date: 2026-07-11

Sources:

- remote: `public.cases`, read-only via Supabase MCP
- local: `admin/data/cases.json`, copied to `backups/portfolio-cms-v2/admin-cases-before-migration.json`
- static HTML: `cases/*/index.html`

## Summary

| source | count |
| --- | ---: |
| remote `public.cases` | 40 |
| local `admin/data/cases.json` | 36 |
| static HTML case pages | 36 |

The 36 local JSON slugs match the 36 static HTML slugs after NFC normalization.

The remote has 4 extra records:

- `novo-case-1779977160261`
- `novo-case-1780068948570`
- `novo-case-1780074762889`
- `novo-case-1780960017640`

## Remote-Only Records

| slug | title | status | categories | cover | images | external_url | featured | home_order | updated_at | note |
| --- | --- | --- | --- | --- | ---: | --- | --- | ---: | --- | --- |
| `novo-case-1779977160261` | Novo case | draft | none | present | 1 | empty | false | 999 | 2026-05-28 | likely test/admin-created draft |
| `novo-case-1780068948570` | Novo case | published | none | present | 2 | present | false | 999 | 2026-06-01 | likely test/admin-created record |
| `novo-case-1780074762889` | Novo case | published | none | empty | 0 | empty | false | 999 | 2026-05-29 | invalid for v2 published constraints without remediation |
| `novo-case-1780960017640` | Novo case | published | none | empty | 0 | empty | false | 999 | 2026-06-08 | invalid for v2 published constraints without remediation |

Recommendation: include these four in dry-run output as `remote_only`, but do not migrate them in apply mode unless an explicit flag or mapping decision is provided.

## Common Slugs

All 36 local slugs are present remotely:

| slug | remote presence | local presence | static HTML | status | categories | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `a-primeira-segunda-feira` | yes | yes | yes | published | UI/UX Design | remote metadata should be canonical |
| `anima` | yes | yes | yes | published | UI/UX Design, Branding | remote metadata should be canonical |
| `atitus-educação` | yes | yes | yes | published | UI/UX Design, Desenvolvimento, Branding, Editorial | Unicode slug; static directory is decomposed form |
| `banrisul-app-redesign` | yes | yes | yes | published | UI/UX Design | remote metadata should be canonical |
| `blenduca` | yes | yes | yes | published | UI/UX Design, Desenvolvimento, Branding, Editorial | has external_url remotely |
| `bu1ld` | yes | yes | yes | published | UI/UX Design, Desenvolvimento | remote metadata should be canonical |
| `calendário-impresul-2023` | yes | yes | yes | published | Editorial | Unicode slug; static directory is decomposed form |
| `calendário-impresul-2024` | yes | yes | yes | published | Editorial | Unicode slug; static directory is decomposed form |
| `candy-dates` | yes | yes | yes | published | UI/UX Design, Desenvolvimento | featured |
| `capri-housing` | yes | yes | yes | published | UI/UX Design | remote metadata should be canonical |
| `click-impresso` | yes | yes | yes | published | Branding, Editorial | remote metadata should be canonical |
| `dark-star` | yes | yes | yes | published | UI/UX Design, Desenvolvimento, Branding, Editorial | has external_url remotely |
| `definna` | yes | yes | yes | published | UI/UX Design, Desenvolvimento | remote metadata should be canonical |
| `demip` | yes | yes | yes | published | Branding, Editorial | largest legacy gallery observed: 71 images |
| `digital-marketing` | yes | yes | yes | published | UI/UX Design | remote metadata should be canonical |
| `eric-clapton` | yes | yes | yes | published | UI/UX Design, Desenvolvimento | featured; has external_url remotely |
| `impresul` | yes | yes | yes | published | Branding, Editorial | featured |
| `jaq-h2` | yes | yes | yes | published | UI/UX Design, Desenvolvimento, Branding, Editorial | has external_url remotely |
| `leylaw` | yes | yes | yes | published | UI/UX Design | featured; visual reference case |
| `lisa-dossi` | yes | yes | yes | published | UI/UX Design | remote metadata should be canonical |
| `lumilab` | yes | yes | yes | published | UI/UX Design | remote metadata should be canonical |
| `magnus` | yes | yes | yes | published | UI/UX Design | remote metadata should be canonical |
| `morangos-mofados` | yes | yes | yes | published | Editorial | large gallery: 50 images |
| `nina` | yes | yes | yes | published | UI/UX Design | remote metadata should be canonical |
| `paula-and-domenick` | yes | yes | yes | published | UI/UX Design, Desenvolvimento, Branding | has external_url remotely |
| `plataforma-ead` | yes | yes | yes | published | UI/UX Design, Branding | remote metadata should be canonical |
| `polvilho` | yes | yes | yes | published | UI/UX Design, Desenvolvimento | has external_url remotely |
| `portal-do-aluno-ufrgs` | yes | yes | yes | published | UI/UX Design | large gallery: 51 images |
| `restiview` | yes | yes | yes | published | Branding, Editorial | remote metadata should be canonical |
| `tri-rs` | yes | yes | yes | published | UI/UX Design | featured; has external_url remotely |
| `vacinas-infográfico` | yes | yes | yes | published | Editorial | Unicode slug; static directory is decomposed form |
| `vallor` | yes | yes | yes | published | UI/UX Design, Desenvolvimento | featured; has external_url remotely |
| `valor-capital-group` | yes | yes | yes | published | UI/UX Design | featured |
| `vexo` | yes | yes | yes | published | UI/UX Design, Branding | featured; has external_url remotely; large gallery |
| `voce-marca` | yes | yes | yes | published | UI/UX Design | has external_url remotely |
| `workshop-de-mentor-ia` | yes | yes | yes | published | UI/UX Design, Branding | remote metadata should be canonical |

## Field Priority For Diff Resolution

For the dry-run migrator, compare per slug:

- presence: remote is canonical for the 40-row source set;
- title/status/categories/cover/images/external_url/featured/home_order/updated_at: remote is canonical unless static HTML proves a richer content-only value;
- formatted body/content: static HTML is canonical where semantic extraction succeeds;
- local JSON: fallback only when remote or static HTML lacks usable content.

## Known Limitations

The full raw remote JSON export was not materialized through the MCP channel because the payload was truncated. The diff above uses verified remote summaries plus local/static inventory. A byte-complete `public.cases` JSON export remains required before apply mode.

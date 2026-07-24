# Portfolio CMS v2 Migration Human Decisions

Date: 2026-07-11

The following legacy `public.cases` records were classified as test/draft records without preservation requirements in Portfolio CMS v2:

- `novo-case-1779977160261`
- `novo-case-1780068948570`
- `novo-case-1780074762889`
- `novo-case-1780960017640`

Decision:

- These four records will not be migrated into `public.portfolio_cases`.
- These four records will not create rows in `public.portfolio_case_media`.
- These four records will not be deleted or changed in `public.cases` during this migration.
- The 36 cases with static Framer HTML will be migrated into Portfolio CMS v2.

The following large galleries were reviewed and approved:

- `dark-star`
- `demip`
- `leylaw`
- `morangos-mofados`
- `portal-do-aluno-ufrgs`
- `vexo`

Decision:

- No approved image should be removed because of gallery size.
- The migration must preserve the dry-run media order and must not reduce, deduplicate, or reorganize these galleries beyond the already validated dry-run extraction rules.

# Portfolio CMS v2 Dry-Run

Generated at: 2026-07-11T00:00:00.000Z

Dry-run complete: yes
Apply allowed: false

## Counts

- source remote: 40
- source local JSON: 36
- source static HTML: 36
- proposed cases: 36
- excluded cases: 4
- proposed media: 561
- published: 36
- drafts: 0
- blocked: 0
- warnings: 0
- errors: 0

## Blocked Cases

None

## Important Divergences

- Remote full raw backup is available and validated.
- Four `novo-case-*` records are human-approved exclusions and remain only in `public.cases`.
- Large galleries for `dark-star`, `demip`, `leylaw`, `morangos-mofados`, `portal-do-aluno-ufrgs`, and `vexo` are approved as-is.
- Several static HTML directories use decomposed Unicode; slugs are normalized to NFC in the plan.

## Recommendation

Dry-run is complete and apply remains disabled in dry-run mode. Proceed only through the explicit guarded apply command.

# Portfolio CMS v2 Media Audit

Previous total: 564
Audited total: 561
Removed after audit: 3

## Suspicious Cases

- `dark-star`: 38 media
- `demip`: 71 media
- `leylaw`: 49 media
- `morangos-mofados`: 50 media
- `portal-do-aluno-ufrgs`: 51 media
- `vexo`: 47 media

## Reference Cases

- Leylaw: 49 media
- Atitus Educação: 5 media
- Largest gallery: `demip` (71)
- Smallest gallery: `a-primeira-segunda-feira` (1)

The HTML extractor now only uses `[data-framer-name="imagens-scroll"]` when present and deduplicates canonical media URLs. Remote `images` remains the primary gallery source.

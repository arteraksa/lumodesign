# Portfolio CMS v2 Post-migration Validation

Timestamp: 2026-07-11T20:17:47.373Z
Status: passed

## Counts
- public.cases: 40
- public.portfolio_cases: 36
- public.portfolio_case_media: 561
- public.portfolio_case_slug_history: 0
- novo-case-* in portfolio_cases: 0
- orphan media: 0

## UUID hashes
- case_id_hash: 078d23b3ca45d61932de6aa4fd5004c5
- expected_case_id_hash: 078d23b3ca45d61932de6aa4fd5004c5
- media_id_hash: 2e4314e7a539b13c65c83f3c8319d213
- expected_media_id_hash: 2e4314e7a539b13c65c83f3c8319d213

## Named case checks
- Atitus Educação (atitus-educação): id_match=true; media=5/5; content_html_length=4974/4974
- Dark Star (dark-star): id_match=true; media=38/38; content_html_length=6790/6790
- DEMIP (demip): id_match=true; media=71/71; content_html_length=3497/3497
- Leylaw (leylaw): id_match=true; media=49/49; content_html_length=7605/7605
- Morangos Mofados (morangos-mofados): id_match=true; media=50/50; content_html_length=6166/6166
- Portal do Aluno UFRGS (portal-do-aluno-ufrgs): id_match=true; media=51/51; content_html_length=10498/10498
- Vexo (vexo): id_match=true; media=47/47; content_html_length=6756/6756

## Smoke tests
- npm run portfolio:migrate:validate: passed
- remote post-apply readonly SQL checks: passed

Credentials were not printed or recorded.

# Portfolio CMS v2 Public Frontend Integration Report

## Arquitetura anterior

- O site publico e uma exportacao estatica do Framer servida por `scripts/serve.mjs`.
- A home esta em `index.html`; a listagem publica esta em `cases/index.html`.
- Os cases individuais legados continuam em `cases/<slug>/index.html`.
- O servidor local normaliza `/raksadesign` e faz fallback de `/cases/:slug` para `cases/index.html`, permitindo renderizacao dinamica em runtime.
- Os cards atuais sao anchors Framer com imagem; `scripts/raksa-routing.js` normaliza links internos e navegacao anterior/proximo.
- `scripts/raksa-public-content.js` ja era carregado na home e em `cases/index.html`, mas lia a tabela legada `public.cases`.
- A configuracao publica do Supabase vem de `admin/supabase-config.js`, usando apenas URL publica e publishable key.

## Arquitetura nova

- `scripts/raksa-public-content.js` usa `public.portfolio_cases` como fonte primaria.
- A tabela legada `public.cases` permanece como fallback temporario se a consulta ao CMS v2 falhar.
- A home, a listagem e a pagina dinamica por slug continuam preservando o HTML/CSS Framer existente.
- Os HTMLs estaticos existentes nao foram removidos.

## Queries publicas

- Listagem: `portfolio_cases`, colunas de card, `status=eq.published`, `order=portfolio_order.asc.nullslast,published_at.desc.nullslast,created_at.desc`.
- Detalhe: `portfolio_cases`, colunas de detalhe, `status=eq.published`, `slug=eq.<slug>`, `limit=1`.
- Midias do detalhe: `portfolio_case_media`, `case_id=eq.<id>`, `order=sort_order.asc,created_at.asc`.
- Home: usa a mesma lista publicada e filtra `featured_on_home=true`, ordenando por `home_order`.

## Listagem

- A listagem publica agora mostra apenas registros `status='published'` com slug valido.
- Cards existentes sao atualizados com `title`, `slug`, `cover_url`, `categories`, `excerpt` e `external_url`.
- Cards estaticos que nao existem na lista publicada do CMS v2 sao ocultados.
- Novos cases publicados sao clonados a partir do card Framer existente e aparecem sem edicao manual de HTML.

## Pagina individual

- `/raksadesign/cases/:slug/` agora e servido localmente por `cases/detail.html`, um shell de detalhe sem cards de listagem.
- O shell mostra skeleton de detalhe no primeiro frame e o script busca o case publicado por slug.
- Drafts, archived e slugs inexistentes renderizam uma tela 404 publica sem vazar conteudo.
- A galeria usa apenas midias ilustrativas do case atual, ordenadas por `sort_order`.
- Midias iguais a capa sao ocultadas do corpo por `cover_storage_bucket + cover_storage_path` primeiro e por URL normalizada depois.
- Anterior/proximo usam a ordem publica por `portfolio_order`.

## Home

- A home usa apenas cases publicados com `featured_on_home=true`.
- A ordem visual respeita `home_order`.
- Se nao houver destaques, o fallback segue a lista publicada.

## Renderer compartilhado

- O renderer React interno continua em `admin/portfolio/src/features/preview/CaseRenderer.tsx`.
- O frontend publico nao importa React/Vite; por isso a integracao reutiliza a mesma estrutura semantica e normalizacao: capa, categorias, `content_html` sanitizado, galeria ordenada e navegacao anterior/proximo.
- A fidelidade publica permanece baseada nos templates Framer existentes.

## SEO

- Paginas individuais atualizam `title`, `meta description`, canonical, Open Graph title, description, URL, type e imagem de capa.
- Fallbacks usam `title`, `excerpt` e capa quando os campos SEO estao vazios.

## Fallback legado

- Se `portfolio_cases` estiver indisponivel, o script volta para a tabela legada `cases`.
- Os HTMLs estaticos em `cases/<slug>/index.html` continuam no repositorio para comparacao e rollback.

## Testes

- `node --check scripts/raksa-public-content.js`
- Consulta anon a `portfolio_cases` confirmou 36 registros publicados.
- Validacoes finais locais devem rodar com `npm run portfolio:cms:lint`, `npm run portfolio:cms:test`, `npm run portfolio:cms:build`, `npm run verify` e servidor local.

## Limitacoes

- O teste controlado de criacao/publicacao/despublicacao exige sessao admin no CMS; nao usa service role nem segredo de banco.
- O servidor estatico retorna HTTP 200 para fallback HTML; o 404 de case inexistente e renderizado no cliente.
- A remocao dos HTMLs legados fica para uma etapa posterior.
- Os HTMLs legados continuam presentes; `?raksa-static-case-template=1` ainda permite buscar o template Framer estatico.

## Proximos passos

- Executar o fluxo controlado no CMS com o slug `test-cms-public-integration`.
- Comparar visualmente os 36 cases migrados contra os HTMLs legados mais importantes.
- Depois de estabilizado, decidir se os HTMLs individuais legados continuam como fallback ou serao removidos em uma migracao separada.

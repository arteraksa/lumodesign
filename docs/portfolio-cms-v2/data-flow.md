# Fluxo de dados atual dos cases

## Criacao

1. Admin entra em `#/cases`.
2. `createCase()` cria item local com slug `novo-case-<timestamp>`.
3. `persistCase(item)` tenta Supabase se houver cliente e sessao.
4. Sem Supabase/sessao, salva em `localStorage` (`raksa-admin-cases-v2`) e retorna sucesso.
5. Com Supabase, faz `upsert` em `public.cases` com conflito por `id`.
6. Apos sucesso, navega para `#/cases/<slug>`.

Campos criados: `id`, `slug`, `title`, `tags`, `description`, `cover`, `images`, `excerpt`, `published`, `featuredOnHome`, `homeOrder`, `contentBlocks`, `externalUrl`, `createdAt`, `updatedAt`.

## Edicao

Existem dois caminhos:

- Edicao inline na tabela: titulo, slug, status, tags e external URL usam debounce de 850 ms via `queueCaseSave`.
- Editor completo: formulario salva titulo, slug, tags, description, excerpt, published, featuredOnHome, homeOrder e externalUrl via botao `Salvar alteracoes`.

Ao mudar slug:

1. `slugify()` gera novo slug.
2. O item recebe `item.slug = newSlug` e `item.id = newSlug`.
3. O novo item e persistido.
4. Se mudou, `deleteRemoteCase(previousSlug)` apaga por coluna `slug`.

Risco: se o upsert e o delete ficarem parcialmente aplicados, pode haver duplicacao, perda de rota antiga ou quebra de referencias de projetos.

## Upload

1. `replaceCover()` ou `uploadCaseImages()` valida MIME contra `PNG`, `JPEG`, `WEBP`, `GIF`.
2. `uploadImageFile()` exige `supabase` e login.
3. Path gerado: `cases/<safeSlug>/<scope>-<timestamp>-<uuid>.<ext>`.
4. Upload para bucket publico `case-images`.
5. URL publica e gravada em `cover` ou `images`.
6. `persistCase()` salva item.
7. Ao trocar/remover, `deleteUploadedFileIfUnused()` remove objeto antigo somente se a URL pertence ao bucket gerenciado.

## Publicacao

Publicar/despublicar e apenas `published = true/false` no Supabase/local state. Nao ha build estatico automatico. O site publico busca dados em runtime:

1. `scripts/raksa-public-content.js` detecta rota.
2. Se Supabase configurado, faz REST em `public.cases` com `published=eq.true`.
3. Se falhar, usa `admin/data/cases.json`.
4. Cards e paginas sao patchados em cima do HTML Framer.

## Home

1. Admin usa `#/site-home`.
2. `homeDraft` guarda `featuredOnHome` e `homeOrder`.
3. Ao salvar, `persistCases(changed)` atualiza lote no Supabase.
4. No publico, `applyHomeCases()` pega cases com `featured_on_home`, ordena por `home_order` e limita a 9.
5. Se nenhum case estiver destacado, usa primeiros cases ordenados.
6. Cards do Framer sao reaproveitados, ocultados ou preenchidos.

## Pagina de cases

1. `cases/index.html` e HTML Framer estatico.
2. `enhanceCasesIndex()` localiza anchors dentro de `#main` que apontam para `/cases/<slug>/` e contem imagem.
3. `annotateCaseCard()` atualiza href, aria-label, capa, titulo e badges.
4. `ensureCaseIndexCards()` clona ultimo card quando ha case no CMS sem card estatico.
5. `enhanceCaseFilters()` tenta reaproveitar filtros Framer existentes; se incompletos, esconde e injeta `.raksa-case-filters`.

## Pagina individual

Dois modos coexistem:

- HTML estatico real: `cases/leylaw/index.html`, `cases/paula-and-domenick/index.html`, etc.
- Render dinamico sobre template: para rota sem HTML proprio ou fallback 404.

No modo dinamico, `raksa-public-content.js`:

1. Detecta slug pela URL.
2. Carrega cases.
3. Carrega template em `CASE_TEMPLATE_PATH = /raksadesign/cases/atitus-educação/`.
4. Opcionalmente carrega template de botao website em `/raksadesign/cases/paula-and-domenick/`.
5. Copia styles/SVGs do template.
6. Substitui `#main` atual pelo `#main` do template.
7. Patcha texto, badges, external link, galeria e navegacao.

## Anterior e proximo

`orderedCases()` filtra publicados e ordena por `home_order`, depois titulo. `neighborsForCase()` calcula anterior/proximo nesse array. `patchTemplateNavigation()` substitui blocos da area `Recomendação`, imagens e botoes do template.

Se nao existe anterior/proximo, o bloco e escondido. `scripts/raksa-routing.js` tambem esconde slots vazios quando encontra botoes `Anterior`/`Próximo` sem `href`.

## Rotas inexistentes e 404

No servidor local, `scripts/serve.mjs`:

- serve arquivo direto se existe;
- serve `index.html` de diretorio se existe;
- para `/cases/<slug>/` inexistente, retorna `cases/index.html`;
- para demais rotas, retorna `index.html`.

Em producao GitHub Pages, o comportamento equivalente depende de `404.html`: ele contem `#main`, carrega config Supabase, routing e public content. Assim, uma rota inexistente pode virar pagina dinamica se o script reconhecer slug de case; caso contrario deve ficar como fallback.

## Pontos de divergencia

- Admin carrega todos os cases; publico carrega somente publicados.
- JSON pode conter cases ou campos que nao existem no Supabase.
- HTML estatico pode mostrar conteudo antigo antes/depois do patch.
- Home do `index.html` contem dados Framer embutidos, mas tambem pode ser substituida por Supabase em runtime.
- Case estatico existente pode nao refletir Supabase se o script nao patchar todos os campos.

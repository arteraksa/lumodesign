# Auditoria da arquitetura atual de cases

Data da auditoria: 2026-07-10.

Escopo lido obrigatoriamente: `admin/app.js`, `admin/modules/cases.js`, `admin/modules/api.js`, `admin/modules/constants.js`, `admin/data/cases.json`, `scripts/raksa-public-content.js`, `scripts/raksa-routing.js`, `scripts/serve.mjs`, `scripts/generate-admin-cases.mjs`, `scripts/sync-supabase-cases-json.mjs`, `supabase/schema.sql`, `supabase/migrations/`, `cases/index.html`, `cases/leylaw/index.html`, `cases/atitus-educação/index.html`, `cases/paula-and-domenick/index.html`, `404.html`, `index.html`, `package.json`.

## Diagnostico

A arquitetura atual e hibrida: o site e um export estatico do Framer hospedado sob o base path `/raksadesign`, com uma camada JavaScript propria que corrige rotas, injeta dados de cases e tenta manter o HTML do Framer funcionando como template. O CMS administra dados em Supabase quando ha sessao e configuracao, mas ainda usa `admin/data/cases.json` e `localStorage` como base/fallback.

O maior risco para uma reconstrucao e tratar Supabase como unica fonte atual sem antes preservar os dados do JSON e os dados embutidos no HTML estatico. Existem fontes concorrentes e partes do render publico que dependem de seletores/classes/nomes gerados pelo Framer.

## Fontes de dados atuais

| Fonte | Onde aparece | Uso atual | Risco |
|---|---|---|---|
| Supabase `public.cases` | `admin/modules/api.js`, `scripts/raksa-public-content.js` | Fonte preferencial no admin e no site publico quando `window.RAKSA_SUPABASE` existe. | Schema local pode divergir do remoto; fallbacks silenciosos escondem coluna faltante. |
| Supabase Storage `case-images` | `admin/modules/cases.js`, `admin/modules/api.js`, `admin/data/cases.json` | Upload de capas/galeria e URLs publicas. | Bucket publico; remocao depende de `isManagedUpload`; imagens externas/Framer nao sao removidas. |
| `admin/data/cases.json` | `admin/modules/api.js`, `scripts/raksa-public-content.js`, scripts de sync | Seed/fallback local e snapshot de 36 cases. | Pode ficar desatualizado em relacao ao Supabase; contem URLs remotas de storage. |
| `localStorage` | `admin/modules/api.js` | Fallback quando nao ha Supabase ou sessao; chave `raksa-admin-cases-v2`. | Edicoes locais podem parecer salvas, mas nao publicam no site real. |
| HTML estatico do Framer | `index.html`, `cases/index.html`, `cases/*/index.html`, `404.html` | Render inicial, templates, dados de handover, assets e layout. | Conteudo e estrutura podem divergir do CMS; dependente de classes geradas. |
| Assets locais Framer | `framerusercontent.com/`, `vendor/`, `_DataURI/` | Fontes, scripts, imagens e modulos do export. | Caminhos assumem `/raksadesign`; mudanca de hosting/base path quebra assets. |
| Fallback 404 | `404.html` + `scripts/raksa-public-content.js` | Renderiza rotas inexistentes/cases dinamicos a partir de `/cases/index.html`/template. | Depende de servidor Pages devolver `404.html` para rotas sem arquivo. |

## Arquitetura atual

### Admin

`admin/app.js` inicializa Supabase a partir de `window.RAKSA_SUPABASE`, monta `state.cases`, exige login e roteia `#/cases`, `#/cases/<slug>` e `#/site-home`. `createCasesModule` recebe persistencia do modulo API e renderiza:

- listagem CMS com edicao inline de titulo, slug, status, tags, link, capa e galeria;
- editor detalhado;
- configuracao de cases em destaque da home;
- upload de capa e imagens para Supabase Storage.

`admin/modules/api.js` carrega `admin/data/cases.json`, tenta buscar `public.cases` no Supabase e salva uma copia em `localStorage`. Em caso de erro de schema, tenta `FULL_CASE_COLUMNS`, depois `EXTENDED_CASE_COLUMNS`, depois `BASIC_CASE_COLUMNS`.

### Publico

`index.html`, `cases/index.html` e `cases/<slug>/index.html` sao paginas Framer exportadas. `scripts/raksa-routing.js` normaliza links internos para `/raksadesign/`, `/raksadesign/cases/` e `/raksadesign/cases/<slug>/`. `scripts/raksa-public-content.js` roda sobre o HTML exportado para:

- buscar cases publicados no Supabase;
- cair para `admin/data/cases.json` se necessario;
- anotar cards de cases existentes;
- clonar cards quando faltam cases no index;
- aplicar filtros;
- trocar capas/titulos/badges;
- renderizar case dinamico por template quando a rota nao tem HTML estatico proprio;
- patchar botao de website, galeria e anterior/proximo.

### Hospedagem e rotas

Evidencias:

- `.nojekyll` existe na raiz.
- Todos os assets e scripts usam `/raksadesign/...`.
- `PAGE_BASE`/`BASE_PATH` sao `/raksadesign`.
- `package.json` nao tem build framework; o projeto serve arquivos estaticos.
- `scripts/serve.mjs` simula Pages: se `/cases/<slug>/` nao existe, retorna `cases/index.html`; se nada casa, retorna `index.html`.
- `404.html` carrega `raksa-routing.js`, `admin/supabase-config.js` e `raksa-public-content.js`.

Conclusao: a producao provavelmente esta em GitHub Pages com path de projeto `/raksadesign`. Rotas existentes funcionam por diretorio real `cases/<slug>/index.html`. Rotas inexistentes ou cases dinamicos dependem do fallback de Pages para `404.html` e da camada publica para remontar conteudo.

## Problemas encontrados

### Fontes de verdade concorrentes

- Supabase `cases`, `admin/data/cases.json`, HTML Framer e `localStorage` podem conter valores diferentes para mesmo slug.
- `index.html` tambem contem dados de handover de cases da home, independentes do JSON/Supabase.
- `scripts/generate-admin-cases.mjs` gera JSON a partir do HTML estatico, enquanto o CMS salva no Supabase. Isso inverte a direcao de verdade.
- `scripts/sync-supabase-cases-json.mjs` sincroniza apenas `cover` e `images` do remoto para o JSON, nao titulo, texto, tags, status, home, excerpt, content blocks ou external URL.

### Codigo morto ou legado

- `localStorage` e chave legada `raksa-admin-cases-v1` parecem existir apenas como fallback administrativo.
- Fallbacks de schema para colunas basicas/extendidas indicam suporte a bancos antigos.
- Migrations temporarias de upload manual de capas foram criadas e removidas; sao historico, nao arquitetura desejada.
- `renderCaseCard` em `admin/modules/cases.js` nao aparece como principal render da tabela atual.

### Dependencias frageis do Framer

- `scripts/raksa-public-content.js` depende de `#main`, `data-framer-name`, `data-framer-component-type`, `.ssr-variant`, classes `framer-*`, texto de botoes como `Acessar website`, `Anterior`, `Próximo` e nomes como `Recomendação`, `imagens-scroll`, `texto-scroll`, `badge`.
- O script clona componentes de `cases/atitus-educação/` e `cases/paula-and-domenick/` como templates hardcoded.
- O script injeta classes Framer especificas como `framer-1hjnzcb`, `framer-12pffjj`, `framer-154ku1h`, etc.
- Mudancas pequenas em novo export do Framer podem quebrar filtros, cards, galeria, navegacao e botoes.

### Slugs

- Ha normalizacao `NFC` em alguns pontos, mas tambem slugs com acento (`atitus-educação`) e diretorio no filesystem com forma Unicode sensivel.
- URLs usam `encodeURIComponent`, mas `scripts/raksa-routing.js` tambem reescreve caminhos decodificados.
- Storage usa `slugify(slug)` no upload, entao slug com acento pode virar path sem acento no storage.
- `deleteRemoteCase(slug)` apaga por `slug`, enquanto `upsert` usa conflito por `id`; renomear slug cria risco se `id`/`slug` ficarem inconsistentes.

### Perda de dados

- Quando nao ha Supabase ou sessao, `persistCase` salva apenas em `localStorage` e retorna sucesso.
- Edicao inline tem debounce; fechar a aba antes do flush pode perder alteracao.
- Renomear slug apaga o registro remoto antigo depois do upsert novo; falha parcial pode duplicar ou deixar referencia quebrada.
- `deleteUploadedFileIfUnused` remove storage apenas quando URL pertence ao bucket gerenciado; assets Framer/externos ficam orfaos ou intocados.
- `content_blocks` existe no schema, mas o editor atual nao edita blocos estruturados.

### Autenticacao e RLS

- `public.cases` tem select publico apenas para `published = true` ou admin.
- Insert/update/delete exigem `authenticated` e `public.is_admin()`.
- Storage `case-images` aceita insert/update/delete autenticado se existir registro em `public.admin_users`, nao pelo sistema novo de `profiles`.
- `isAdminUser()` no frontend aceita `admin_users`, super admin por email, ou perfil ativo nao sintetico; isso pode divergir da politica de storage.
- `metrics_events` aceita insert anonimo com checks, mas ainda e uma superficie publica.

### Schema local vs remoto

Nao houve verificacao remota nesta auditoria. Localmente, `schema.sql` contem `excerpt`, `published`, `featured_on_home`, `home_order`, `content_blocks`, `client_id`, `external_url` e indices. O codigo ainda tolera ausencia de `external_url` e ausencia de colunas extendidas, o que e evidencia de que o remoto ja divergiu ou pode divergir.

### Limitacoes da hospedagem atual

- Sem SSR/API propria no host estatico.
- Rotas dinamicas dependem de fallback 404 e JavaScript.
- SEO de cases dinamicos fica limitado, porque o HTML inicial pode ser `404.html` ou `cases/index.html`.
- Base path `/raksadesign` esta hardcoded em varios pontos.
- Nao ha etapa de build que gere paginas estaticas a partir de Supabase.

## Arquivos que precisarao ser substituidos ou descontinuados na fase nova

- `scripts/raksa-public-content.js`: substituir por renderizador deterministico ou build estatico.
- `scripts/raksa-routing.js`: reduzir a normalizacao de links quando as rotas forem reais.
- `admin/modules/cases.js`: trocar editor acoplado ao modelo antigo por CMS v2.
- `admin/modules/api.js`: separar API de cases de fallbacks/localStorage e definir fonte unica.
- `admin/data/cases.json`: manter como seed/export, nao como fonte concorrente.
- `scripts/generate-admin-cases.mjs`: descontinuar ou transformar em migrador unico HTML -> CMS.
- `scripts/sync-supabase-cases-json.mjs`: substituir por export completo e versionado.
- Templates hardcoded `cases/atitus-educação/index.html` e `cases/paula-and-domenick/index.html` como dependencia runtime.

## Arquivos que devem permanecer intactos na fase de migracao

- `cases/leylaw/index.html` e demais paginas de case atuais ate paridade visual validada.
- `index.html`, `cases/index.html`, `404.html` ate novo fallback/roteamento estar publicado.
- `framerusercontent.com/`, `vendor/`, `_DataURI/` enquanto paginas antigas ainda existirem.
- `supabase/schema.sql` e `supabase/migrations/` ate existir plano de schema separado e aprovado.
- `admin/data/cases.json` como snapshot de rollback.

## Estrategia de rollback

1. Manter todos os arquivos Framer atuais e scripts atuais em producao ate a virada.
2. Criar CMS v2 em arquivos/rotas paralelos.
3. Exportar snapshot completo de `public.cases` e `admin/data/cases.json` antes de qualquer migracao.
4. Publicar v2 atras de flag ou rota paralela.
5. Rollback imediato: reverter inclusao dos scripts/entrypoints v2 e voltar a carregar `raksa-public-content.js` + HTML atual.
6. Rollback de dados: restaurar snapshot Supabase ou apontar temporariamente para `admin/data/cases.json`.

## Recomendacoes para fase seguinte

- Definir uma fonte de verdade: Supabase para runtime/admin, com export JSON somente como backup versionado.
- Criar modelo estruturado de case antes de UI: metadata, hero, sidebar, CTA, body blocks, gallery, navigation.
- Migrar Leylaw primeiro como caso de referencia visual.
- Gerar renderer v2 isolado sem depender de classes `framer-*`.
- So trocar `/cases/<slug>/` depois de validar visual e rotas em todos os viewports.

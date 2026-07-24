# Plano minimo de migracao - Portfolio CMS v2

Este plano nao deve ser executado antes da aprovacao da fase seguinte. A auditoria parou antes de implementar.

## Principios

- Nao remover a implementacao atual ate haver paridade visual e dados migrados.
- Supabase deve virar fonte autoritativa, mas somente depois de snapshot completo.
- JSON deve virar backup/export, nao fonte concorrente.
- HTML Framer atual deve permanecer como rollback.
- Leylaw deve ser o case de paridade visual inicial.

## Sequencia recomendada

1. Congelar snapshot
   - Exportar `public.cases` completo.
   - Copiar `admin/data/cases.json`.
   - Registrar lista de diretorios `cases/*/index.html`.
   - Registrar assets usados por Leylaw.

2. Definir schema CMS v2 sem aplicar ainda
   - Separar campos: metadata, SEO, hero, sidebar, CTA, content sections, gallery, navigation settings.
   - Decidir se `content_blocks` atual sera reaproveitado ou substituido.
   - Planejar tabela/coluna para ordem global de cases separada de destaque da home, se necessario.

3. Criar migrador read-only
   - Entrada: Supabase + JSON + HTML Framer.
   - Saida: relatorio de diferencas por slug.
   - Marcar conflito quando titulo, capa, imagens, external URL, tags ou published divergem.

4. Implementar renderer v2 em paralelo
   - Nova rota ou flag, sem tocar em `/cases/<slug>/` atual.
   - Renderer sem dependencia de `.framer-*`.
   - CSS proprio com tokens minimos e breakpoints equivalentes.
   - Leylaw como fixture visual.

5. Implementar admin v2 em paralelo
   - Nao substituir `admin/modules/cases.js` de primeira.
   - Criar camada API de cases isolada.
   - Remover sucesso falso em `localStorage` na rota v2; fallback deve ser explicitamente read-only/offline.

6. Validar rotas
   - `/raksadesign/cases/`
   - `/raksadesign/cases/leylaw/`
   - slug com acento: `/raksadesign/cases/atitus-educação/`
   - slug inexistente.
   - 404 real fora de cases.

7. Virada controlada
   - Trocar entradas publicas somente depois da paridade.
   - Manter scripts antigos carregaveis por rollback.

## Arquivos candidatos a substituir

- `scripts/raksa-public-content.js`
- `scripts/raksa-routing.js`
- `admin/modules/cases.js`
- Partes de cases em `admin/modules/api.js`
- `scripts/generate-admin-cases.mjs`
- `scripts/sync-supabase-cases-json.mjs`

## Arquivos que devem ficar intactos ate a virada

- `index.html`
- `cases/index.html`
- `cases/leylaw/index.html`
- `cases/atitus-educação/index.html`
- `cases/paula-and-domenick/index.html`
- `404.html`
- `framerusercontent.com/`
- `vendor/`
- `_DataURI/`
- `supabase/schema.sql`
- `supabase/migrations/`

## Riscos a bloquear antes de migrar

- Divergencia entre Supabase remoto e `schema.sql`.
- Storage policy de `case-images` usa `admin_users`, enquanto admin novo pode depender de `profiles`.
- Slugs Unicode podem quebrar em filesystem, URL, storage path e delete remoto.
- Cases dinamicos podem perder SEO se dependerem apenas de JS em Pages.
- Dados textuais completos podem existir so no HTML Framer, nao em Supabase.
- Galeria Leylaw no HTML usa assets locais, enquanto JSON aponta para Supabase.

## Rollback

Rollback tecnico:

1. Reverter carregamento dos entrypoints v2.
2. Restaurar `raksa-public-content.js` e `raksa-routing.js` como scripts publicos principais.
3. Manter paginas Framer atuais em `cases/`.
4. Restaurar snapshot Supabase se houve escrita indevida.

Rollback de dados:

1. Reimportar export de `public.cases`.
2. Restaurar `admin/data/cases.json`.
3. Nao apagar objetos de storage durante a fase v2; marcar objetos novos com prefixo proprio para limpeza posterior.

## Criterios para seguir

- Leylaw visualmente equivalente nos quatro viewports auditados.
- Home e index de cases mostrando a mesma ordem esperada.
- Anterior/proximo deterministico e testado.
- Slug inexistente nao renderiza case errado.
- Admin nao salva localmente como se tivesse publicado.
- Documentacao clara da fonte de verdade final.

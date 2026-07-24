# Revisao tecnica do schema Portfolio CMS v2

Data: 2026-07-10.

Modelo avaliado, sem implementar:

- `portfolio_cases`
- `portfolio_case_media`
- `portfolio_case_slug_history`
- bucket `portfolio-media`

## Compatibilidade geral

### Conflitos de nomes

Nao existem remotamente, nesta verificacao:

- tabela `public.portfolio_cases`
- tabela `public.portfolio_case_media`
- tabela `public.portfolio_case_slug_history`
- bucket `portfolio-media`

Nomes nao conflitam com schema atual.

### Extensoes e UUID

Remoto tem:

- `pgcrypto`
- `uuid-ossp`

`gen_random_uuid()` esta disponivel e ja e usado em tabelas atuais. O schema v2 pode usar UUID PK com `default gen_random_uuid()`.

### Compatibilidade com `auth.users`

FKs para `auth.users(id)` ja existem em:

- `profiles.auth_user_id`
- `profiles.created_by`
- `profiles.updated_by`
- `budgets.created_by`
- `service_orders.created_by`
- `service_orders.updated_by`
- `activity_logs.user_id`

Logo, `portfolio_cases.created_by` e `updated_by` podem referenciar `auth.users(id) on delete set null`, desde que sejam nullable.

Risco:

- Se `created_by` for `not null`, imports de cases historicos ou execucoes com service role/importador podem falhar.
- Para migracao dos 36/40 cases, usar `created_by uuid null`.

## Avaliacao por tabela

### `portfolio_cases`

Recomendacoes:

- `id uuid primary key default gen_random_uuid()`.
- `legacy_case_id text` ou `legacy_slug text` para mapear `public.cases.id/slug` atual.
- `slug text not null unique`.
- Guardar slugs Unicode em NFC e preservar forma original.
- `status text not null` com check `draft/published/archived`.
- `published_at timestamptz null`.
- `featured_on_home boolean not null default false`.
- `home_order integer not null default 999`.
- `version integer not null default 1`.
- `created_by uuid null references auth.users(id) on delete set null`.
- `updated_by uuid null references auth.users(id) on delete set null`.
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.

RLS:

- Public SELECT somente `status='published'`.
- Admin SELECT/INSERT/UPDATE/DELETE por `can_manage_portfolio()`.
- Se drafts tiverem preview, criar policy separada autenticada/admin; nao expor por slug publico.

### `portfolio_case_media`

Recomendacoes:

- `id uuid primary key default gen_random_uuid()`.
- `case_id uuid not null references portfolio_cases(id) on delete cascade`.
- `role text not null` com check, por exemplo `cover/gallery/inline/seo`.
- `position integer not null default 0`.
- `storage_bucket text not null default 'portfolio-media'`.
- `storage_path text not null`.
- `public_url text` opcional, mas preferir derivar URL quando possivel.
- `alt text not null default ''`.
- `caption text not null default ''`.
- `metadata jsonb not null default '{}'`.
- Unique util: `(case_id, role, position)` ou `(storage_bucket, storage_path)`.

Risco:

- Se bucket for publico, midia de drafts fica acessivel por URL direta.
- Para impedir leitura publica de midia de drafts, o bucket `portfolio-media` deve ser privado e imagens devem ser servidas por signed URL ou endpoint que verifica status do case.
- Se o projeto precisa de SEO/imagens publicas para cases publicados, uma alternativa e separar paths:
  - `published/<case-id>/...` em bucket publico;
  - `drafts/<case-id>/...` em bucket privado.

### `portfolio_case_slug_history`

Recomendacoes:

- `id uuid primary key default gen_random_uuid()`.
- `case_id uuid not null references portfolio_cases(id) on delete cascade`.
- `old_slug text not null`.
- `new_slug text not null`.
- `changed_at timestamptz not null default now()`.
- `changed_by uuid null references auth.users(id) on delete set null`.
- Unique em `old_slug` se cada slug antigo deve redirecionar para apenas um case atual.

Evitar recursao em trigger:

- Trigger deve ser `AFTER UPDATE OF slug ON portfolio_cases`.
- Condicao `WHEN (old.slug IS DISTINCT FROM new.slug)`.
- Trigger deve inserir apenas em `portfolio_case_slug_history`, nunca atualizar `portfolio_cases`.
- Se precisar incrementar version no mesmo update, fazer em trigger `BEFORE UPDATE` na propria linha com `new.version = old.version + 1`; nao rodar `UPDATE portfolio_cases` dentro do trigger.

## Incremento seguro de `version`

Melhor padrao:

- Trigger `BEFORE UPDATE ON portfolio_cases`.
- Se campos versionaveis mudaram, `new.version = old.version + 1`.
- `new.updated_at = now()`.
- `new.updated_by = auth.uid()` quando disponivel, mas cuidado com imports/service role.

Evitar:

- `UPDATE portfolio_cases SET version = version + 1` dentro de trigger, pois causa recursao.
- Incrementar version no frontend, pois concorrencia pode sobrescrever.

## Storage `portfolio-media`

Nao existe remoto hoje.

Recomendacao para v2:

- Criar privado por padrao se houver drafts.
- Policies de `storage.objects` usando a mesma funcao administrativa do CMS v2.
- Public read apenas se o objeto estiver associado a case publicado. Como policies de storage nao fazem join barato/seguro por path sem convencao, usar uma dessas abordagens:
  1. bucket privado + signed URLs para admin/preview e copiar/promover assets publicados para caminho publico;
  2. bucket publico apenas para assets de cases publicados, e bucket privado para drafts;
  3. endpoint/Edge Function de media com autorizacao e cache.

Se usar bucket publico unico, nao ha como impedir acesso direto a imagens de draft conhecendo a URL.

## Preservacao dos cases atuais

Ha duas bases a preservar:

- `admin/data/cases.json`: 36 cases.
- Supabase remoto `public.cases`: 40 cases.

Antes de qualquer migration v2:

1. Exportar `public.cases` completo.
2. Exportar `storage.objects` do bucket `case-images` pelo menos com `name`, `bucket_id`, `metadata`, `created_at`, `updated_at`.
3. Preservar `admin/data/cases.json`.
4. Gerar relatorio de diferencas por slug.
5. Tratar os quatro `novo-case-*` remotos manualmente: decidir se sao lixo, drafts reais ou cases incompletos a arquivar.

## Slugs Unicode

Slugs atuais com acento:

- `atitus-educação`
- `calendário-impresul-2023`
- `calendário-impresul-2024`
- `vacinas-infográfico`

Recomendacoes:

- Normalizar para NFC no banco e no frontend.
- Manter slug exibido/canonico atual para nao quebrar URLs existentes.
- Para storage paths, usar ID UUID ou slug ASCII separado; nao depender de slug Unicode no path de arquivo.
- Criar `slug_history` para qualquer futura transliteracao.
- Garantir redirects/rewrites para slugs antigos.

## Ajustes necessarios no Prompt 2 de implementacao

1. Incluir criacao de `can_manage_portfolio()` ou decidir reutilizar `public.is_admin()` de forma explicita.
2. Usar a mesma regra administrativa em tabelas e Storage.
3. Nao criar bucket publico para drafts; definir estrategia de midia privada/publicada antes.
4. Incluir `legacy_slug`/`legacy_case_id` para preservar `public.cases`.
5. Incluir migrador/read model que considera 40 cases remotos, nao apenas 36 do JSON.
6. Definir trigger de `version` como `BEFORE UPDATE`, sem update recursivo.
7. Definir trigger de slug history como `AFTER UPDATE OF slug ... WHEN old.slug IS DISTINCT FROM new.slug`.
8. FKs `created_by`/`updated_by` devem ser nullable `on delete set null`.
9. Incluir indices:
   - `portfolio_cases(status, featured_on_home, home_order, title)`.
   - `portfolio_cases(slug) unique`.
   - `portfolio_case_media(case_id, role, position)`.
   - `portfolio_case_slug_history(old_slug)`.
10. Incluir plano de backfill separado, sem apagar `public.cases`.

## Recomendacao final

O modelo v2 e compativel com a infraestrutura atual, mas deve ser implementado como paralelo e conservador:

- tabelas novas;
- bucket novo privado ou estrategia split public/private;
- nenhuma substituicao imediata de `public.cases`;
- export completo antes de qualquer escrita;
- autorizacao unificada no banco.

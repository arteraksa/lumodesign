# Comparacao do schema remoto Supabase

Data: 2026-07-10.

Modo: somente leitura via conector Supabase MCP e consultas `SELECT` em catalogos. Nao foi executado DDL, DML de escrita, migration, criacao de bucket ou policy.

## Projeto remoto confirmado

- Project ref/id: `yzivkrotylwyglavtnho`
- Nome: `raksadesign`
- Regiao: `us-west-1`
- Status: `ACTIVE_HEALTHY`
- Postgres: `17.6.1.121`, engine `17`
- URL configurada no frontend: `https://yzivkrotylwyglavtnho.supabase.co`
- Edge Function ativa: `create-user`, `verify_jwt=true`

## Configuracao local Supabase

Arquivo: `admin/supabase-config.js`.

- Define `window.RAKSA_SUPABASE`.
- Carrega `url` e `anonKey`/publishable key diretamente em arquivo frontend.
- A chave observada e uma publishable/anon key (`sb_publishable_...`), aceitavel para frontend.
- Nao foi encontrada service role key versionada em arquivos do projeto lidos.
- `README.md` instrui explicitamente a nao colocar `service_role`, senha de banco, API secret ou token privado em frontend.

Arquivos que referenciam Supabase/projeto:

- `admin/supabase-config.js`
- `admin/app.js`
- `admin/modules/api.js`
- `admin/modules/cases.js`
- `scripts/raksa-public-content.js`
- `scripts/sync-supabase-cases-json.mjs`
- `scripts/sync-framer-case-covers.mjs`
- `supabase/functions/create-user/index.ts`
- `README.md`

## Tabelas remotas principais

### `public.cases`

Remoto:

- RLS: habilitado.
- Linhas: 40.
- Colunas:
  - `id text not null`, PK.
  - `slug text not null`, unique.
  - `title text not null`.
  - `tags text[] not null default '{}'`.
  - `description text not null default ''`.
  - `cover text not null default ''`.
  - `images text[] not null default '{}'`.
  - `updated_at timestamptz not null default now()`.
  - `created_at timestamptz not null default now()`.
  - `excerpt text not null default ''`.
  - `published boolean not null default true`.
  - `featured_on_home boolean not null default false`.
  - `home_order integer not null default 999`.
  - `content_blocks jsonb not null default '[]'`.
  - `client_id uuid null`, FK `public.clients(id) on delete set null`.
  - `external_url text not null default ''`.

Constraints e indices:

- PK: `cases_pkey (id)`.
- Unique: `cases_slug_key (slug)`.
- FK: `cases_client_id_fkey`.
- Index: `cases_client_id_idx`.
- Index: `cases_public_home_idx (published, featured_on_home, home_order, title)`.

Comparacao local:

- Bate com `supabase/schema.sql` para colunas principais, PK, unique, FK e indice publico de home.
- O remoto tem 40 rows; `admin/data/cases.json` tem 36.
- Slugs remotos extras, ausentes no JSON local:
  - `novo-case-1779977160261` (draft)
  - `novo-case-1780068948570`
  - `novo-case-1780074762889`
  - `novo-case-1780960017640`
- Nao ha slugs locais ausentes no remoto.

Resumo remoto de cases:

- Total: 40.
- Published: 39.
- Drafts: 1.
- Featured on home: 9.

### `public.admin_users`

Remoto:

- RLS: habilitado.
- Linhas: 1.
- Colunas:
  - `user_id uuid not null`, PK, FK `auth.users(id) on delete cascade`.
  - `created_at timestamptz not null default now()`.

Comparacao local:

- Bate com `supabase/schema.sql`.
- E usado diretamente pelas policies de Storage, o que cria divergencia com o modelo novo baseado em `profiles`.

### `public.profiles`

Remoto:

- RLS: habilitado.
- Linhas: 2.
- PK: `id uuid default gen_random_uuid()`.
- `auth_user_id uuid unique references auth.users(id) on delete cascade`.
- Campos de perfil, cargo, hierarquia, custos internos, status, preferencias.
- Checks:
  - `role` em `super_admin/admin/manager/finance/commercial/production/designer/viewer`.
  - `access_level` no mesmo conjunto.
  - `status` em `active/inactive/suspended/pending`.
  - `hierarchy_level` entre 0 e 100.
  - custos/horas nao negativos.
  - `preferences` precisa ser objeto JSON.
- FKs:
  - `created_by` e `updated_by` para `auth.users(id) on delete set null`.
  - `supervisor_id` para `profiles(id) on delete set null`.

Comparacao local:

- Bate com as migrations finais locais, incluindo `suspended`, `preferences`, `internal_notes`, `can_manage_users` e bloqueio de deletes fisicos.

### `public.metrics_events`

Remoto:

- RLS: habilitado.
- Linhas: 480.
- Colunas:
  - `id bigint identity`.
  - `event_name text not null`.
  - `path text null`.
  - `metadata jsonb not null default '{}'`.
  - `created_at timestamptz not null default now()`.
- Checks:
  - `event_name` em `page_view`, `whatsapp_click`, `case_click`, `form_submit`.
  - `path` ate 500 caracteres.
  - `metadata` objeto JSON com tamanho maximo via `pg_column_size(metadata) <= 4096`.

Comparacao local:

- Bate com `schema.sql`.

### Outras tabelas relacionadas ao admin/portfolio

Confirmadas remotamente com RLS habilitado:

- `clients`
- `contacts`
- `projects`
- `budgets`
- `service_orders`
- `service_order_items`
- `time_entries`
- `site_settings`
- `financial_settings`
- `products`
- `substrates`
- `product_substrates`
- `activity_logs`

Ponto de atencao:

- `public.clients` remoto tem 15 colunas, enquanto o `supabase/schema.sql` atual contem campos fiscais/endereco adicionais (`state_registration`, `municipal_registration`, endereco separado, billing address etc.). Isso sugere divergencia entre `schema.sql` consolidado e remoto, ou uma introspeccao compacta do conector que nao listou todos os campos. Antes de migrations v2, rodar uma comparacao completa de `information_schema.columns` para todas as tabelas admin.

## RLS e policies remotas principais

### `public.cases`

- SELECT, roles `{public}`:
  - `published = true OR is_admin()`
- INSERT, roles `{authenticated}`:
  - `WITH CHECK is_admin()`
- UPDATE, roles `{authenticated}`:
  - `USING is_admin()`
  - `WITH CHECK is_admin()`
- DELETE, roles `{authenticated}`:
  - `USING is_admin()`

### `public.admin_users`

- SELECT, roles `{authenticated}`:
  - usuario so le sua propria linha: `auth.uid() = user_id`.

### `public.profiles`

- SELECT, roles `{authenticated}`:
  - proprio perfil ou `can_manage_users()`.
- INSERT, roles `{authenticated}`:
  - `WITH CHECK can_manage_users()`.
- UPDATE, roles `{authenticated}`:
  - proprio perfil ou `can_manage_users()`.
  - trigger `guard_profile_self_update()` limita alteracoes sensiveis para usuario comum.
- DELETE:
  - sem policy final; `DELETE` revogado de `authenticated`.

### `public.metrics_events`

- INSERT, roles `{public}`:
  - evento em lista permitida, path curto, metadata objeto pequeno, created_at dentro de janela de 5 minutos.
- SELECT, roles `{authenticated}`:
  - `is_admin()`.

### `storage.objects`

Policies remotas para `case-images`:

- INSERT, roles `{authenticated}`:
  - bucket `case-images`;
  - extensao `png/jpg/jpeg/webp/gif`;
  - existe linha em `public.admin_users` para `auth.uid()`.
- UPDATE, roles `{authenticated}`:
  - `USING`: bucket `case-images` e usuario em `admin_users`;
  - `WITH CHECK`: bucket, extensao permitida e usuario em `admin_users`.
- DELETE, roles `{authenticated}`:
  - bucket `case-images` e usuario em `admin_users`.

Ponto de seguranca:

- Storage usa `admin_users`, nao `profiles` nem `is_admin()`.
- Bucket e publico, entao qualquer objeto enviado para `case-images` tem URL publica; drafts nao ficam protegidos se a midia estiver nesse bucket.

## Funcoes e triggers

Funcoes remotas relevantes:

- `public.is_admin()`: `security invoker`, usa:
  - `public.is_super_admin()`;
  - existencia em `public.admin_users`;
  - `profiles` ativo com `role='admin'` ou `access_level='admin'` ou `hierarchy_level >= 90`.
- `public.is_super_admin()`: wrapper invoker para `private.is_super_admin()`.
- `private.is_super_admin()`: `security definer`, usa emails hardcoded e perfil super admin/hierarquia >= 100.
- `public.can_manage_users()`: wrapper invoker para `private.can_manage_users()`.
- `private.can_manage_users()`: `security definer`, aceita super admin ou perfil ativo admin/hierarquia >= 90.
- `public.guard_profile_self_update()`: trigger function que bloqueia alteracoes sensiveis por usuario comum e protege emails raiz contra manager nao-super-admin.
- `touch_*_updated_at()` para `profiles`, `financial_settings`, `products`, `product_substrates`, `substrates`, `service_order_items`.

Triggers remotos relevantes:

- `profiles_touch_updated_at`, BEFORE UPDATE.
- `profiles_guard_self_update`, BEFORE UPDATE.
- `financial_settings_touch_updated_at`, BEFORE UPDATE.
- `products_touch_updated_at`, BEFORE UPDATE.
- `product_substrates_touch_updated_at`, BEFORE UPDATE.
- `substrates_touch_updated_at`, BEFORE UPDATE.
- `service_order_items_touch_updated_at`, BEFORE UPDATE.

Nao ha trigger remoto em `public.cases` para `updated_at`.

## Storage

Buckets remotos:

- `case-images`
  - public: `true`
  - file size limit: `20971520`
  - MIME types: `image/png`, `image/jpeg`, `image/webp`, `image/gif`

Nao existe bucket `portfolio-media` remoto nesta verificacao.

## Extensoes

Extensoes remotas:

- `pgcrypto`
- `uuid-ossp`

`gen_random_uuid()` esta disponivel.

## Divergencias local x remoto confirmadas

1. Conteudo de cases:
   - Remoto: 40 cases.
   - JSON local: 36 cases.
   - 4 slugs `novo-case-*` existem apenas no remoto.

2. Fonte de autorizacao:
   - Tabelas usam `is_admin()` com `admin_users` + `profiles`.
   - Storage usa somente `admin_users`.
   - Frontend tambem contem fallback por emails super admin.

3. Possivel divergencia de schema CRM:
   - A introspeccao remota de `clients` retornou menos colunas do que `schema.sql`.
   - Precisa de diff completo antes de aplicar qualquer migration v2.

## Comandos somente leitura para repetir

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, policyname;

select table_schema, table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

select count(*) total,
       count(*) filter (where published) published,
       count(*) filter (where not published) drafts,
       count(*) filter (where featured_on_home) featured
from public.cases;
```

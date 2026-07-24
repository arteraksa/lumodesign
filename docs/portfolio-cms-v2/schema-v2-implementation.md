# Portfolio CMS v2 - Implementacao da Camada de Banco

## Escopo

Esta fase cria a camada de banco do Portfolio CMS v2 em paralelo ao sistema atual. A migration nao migra dados, nao altera `public.cases`, nao altera `case-images`, nao remove `public.is_admin()` e nao modifica o CMS legado ou paginas publicas.

Migration corrigida: `supabase/migrations/20260710192407_portfolio_cms_v2.sql`.

## Idempotencia

Esta migration nao e declarada idempotente. Ela foi ajustada para falhar claramente se objetos v2 ja existirem parcialmente.

Motivo: `CREATE TABLE IF NOT EXISTS` poderia continuar em um estado incompleto caso uma tabela existisse sem colunas, constraints, triggers ou policies novas. Como a migration ainda nao foi aplicada, a estrategia correta e exigir um estado inicial limpo para os objetos v2.

## Objetos Criados

Tabelas:

- `public.portfolio_cases`
- `public.portfolio_case_media`
- `public.portfolio_case_slug_history`

Funcao administrativa:

- `public.can_manage_portfolio()`

Buckets declarados pela migration:

- `portfolio-drafts`, privado.
- `portfolio-media`, publico.

Tipos TypeScript:

- `admin/types/portfolio-cms-v2.ts`

Os enums SQL documentais foram removidos. As colunas permanecem `text` com check constraints, e os unions permanecem apenas no TypeScript.

## Modelo de Autorizacao

A funcao unica do CMS v2 e:

```sql
public.can_manage_portfolio()
```

Definicao final:

- `SECURITY DEFINER`
- `STABLE`
- `search_path = pg_catalog, public, auth`
- usa `auth.uid()`
- `REVOKE ALL FROM PUBLIC`
- `GRANT EXECUTE` apenas para `authenticated`

Regra principal em `public.profiles`:

- `profiles.auth_user_id = auth.uid()`
- `profiles.status = 'active'`
- `profiles.role in ('admin', 'super_admin')` ou `profiles.access_level in ('admin', 'super_admin')`

`public.admin_users` permanece apenas como fallback/bootstrap temporario.

Foram removidos da regra v2 por ambiguidade:

- `role = 'manager'`
- `role = 'director'`
- `access_level = 'manager'`
- `access_level = 'full'`
- qualquer criterio baseado somente em `hierarchy_level`

Os relatorios confirmaram valores remotos de `role/access_level` como `super_admin`, `admin`, `manager`, `finance`, `commercial`, `production`, `designer`, `viewer`. A regra v2 usa apenas os valores explicitamente administrativos observados: `admin` e `super_admin`.

Verificacao remota somente leitura em 2026-07-10 confirmou:

- `anon`, `authenticated` e `public` ja possuem `USAGE` no schema `public`;
- `anon` nao tem `CREATE` no schema `public`;
- `authenticated` nao tem `CREATE` no schema `public`;
- `public` nao tem `CREATE` no schema `public`.

Mesmo assim, `SECURITY DEFINER` continua sendo tratado como superficie sensivel: a funcao exige `auth.uid()`, nao usa entrada do frontend e tem grants restritos.

A migration nao altera permissoes globais do schema `public`; ela concede apenas privilegios nas tabelas v2.

`public.is_admin()` permanece intacta e nao e usada pelas novas policies.

## Modelo da Capa

`public.portfolio_cases` agora possui:

- `cover_url text not null default ''`
- `cover_storage_bucket text`
- `cover_storage_path text`

Semantica:

- `cover_storage_bucket` contem somente o bucket: `portfolio-drafts`, `portfolio-media`, `case-images` ou `null`.
- `cover_storage_path` contem somente o caminho do objeto dentro do bucket.
- O bucket nunca deve ser incluido em `cover_storage_path`.

Constraints e validacoes:

- `cover_storage_bucket` limitado a `portfolio-drafts`, `portfolio-media`, `case-images` ou `null`.
- `cover_storage_path` exige `cover_storage_bucket`.
- `cover_storage_path` nao pode iniciar com `portfolio-drafts/`, `portfolio-media/` ou `case-images/`.
- Drafts podem usar `portfolio-drafts`.
- Published nao pode usar `portfolio-drafts`.
- Published exige capa valida: `portfolio-media`, `case-images` legado ou `cover_url` HTTP/HTTPS.
- Draft nao exige capa.
- `cover_url` com protocolo invalido falha ao publicar.

## Midia Externa

`portfolio_case_media.source_url` e permitido para midia externa HTTP/HTTPS. Protocolos diferentes sao rejeitados por constraint quando `source_url` estiver preenchido.

A policy publica de midia permite `SELECT` somente quando o case relacionado esta `published` e uma destas condicoes e verdadeira:

1. `storage_bucket = 'portfolio-media'`;
2. `storage_bucket = 'case-images'`;
3. `storage_bucket is null`, `storage_path is null` e `source_url` e HTTP/HTTPS valida.

Nao ficam publicos:

- midias de draft;
- midias de archived;
- `portfolio-drafts`;
- `source_url` vazia;
- protocolos diferentes de HTTP/HTTPS.

## Constraints Principais

`portfolio_cases`:

- `slug` unico, nao vazio e sem whitespace, slash, query ou hash.
- Slug Unicode e permitido, incluindo `atitus-educação`.
- PostgreSQL nao normaliza Unicode automaticamente; a aplicacao deve gravar slugs em NFC.
- `status` limitado a `draft`, `published`, `archived`.
- `categories` limitado aos valores reais encontrados nos 40 cases remotos: `Branding`, `Desenvolvimento`, `Editorial`, `UI/UX Design`.
- `content_json` precisa ser objeto JSONB e tem default Tiptap valido: `{"type":"doc","content":[]}`.
- `external_url` deve ser vazio ou HTTP/HTTPS.
- `published` exige `published_at`.
- `home_order`, `portfolio_order` e `version` validam valores positivos.

`portfolio_case_media`:

- Relaciona por `case_id`, nunca por slug.
- `media_type` limitado a `image` ou `video`.
- `storage_bucket` limitado a `portfolio-drafts`, `portfolio-media`, `case-images` ou `null`.
- `storage_path` exige `storage_bucket`.
- `storage_path` nao inclui prefixo de bucket.
- `source_url` vazia ou HTTP/HTTPS.
- Nao ha unique em `(case_id, sort_order)` para nao quebrar reorder em lote.

`portfolio_case_slug_history`:

- `old_slug` unico e nao vazio.
- Trigger impede colisao entre historico e slugs atuais.

## Slug History

O fluxo normal de mudanca de slug continua transacional:

1. Antes de inserir ou alterar `portfolio_cases.slug`, a trigger falha se o novo slug ja existir em `portfolio_case_slug_history.old_slug`.
2. Depois de uma mudanca real de slug, a trigger registra `OLD.slug`.
3. Ao registrar historico, a trigger falha se `OLD.slug` estiver sendo usado como slug atual por outro case.
4. Ao registrar historico, a trigger falha se `OLD.slug` ja pertencer ao historico de outro case.
5. Duplicata para o mesmo case nao cria nova linha.
6. `ON CONFLICT DO NOTHING` foi removido para nao esconder colisao.

Se uma colisao ocorrer no meio de um update, a operacao inteira e abortada.

## Triggers

`portfolio_cases`:

- `portfolio_cases_10_validate_slug`
- `portfolio_cases_20_audit_fields`
- `portfolio_cases_30_touch_updated_at`
- `portfolio_cases_40_increment_version`
- `portfolio_cases_50_sync_published_at`
- `portfolio_cases_60_validate_publication`
- `portfolio_cases_70_record_slug_history`

`portfolio_case_media`:

- `portfolio_case_media_10_touch_updated_at`
- `portfolio_case_media_20_validate_publication`

`portfolio_case_slug_history`:

- `portfolio_case_slug_history_10_validate`

## RLS e Policies

RLS e ativado em todas as tabelas v2.

`portfolio_cases`:

- anon/authenticated: `SELECT` apenas `status = 'published'`.
- admin: `SELECT`, `INSERT`, `UPDATE`, `DELETE` com `can_manage_portfolio()`.

`portfolio_case_media`:

- anon/authenticated: `SELECT` apenas quando o case relacionado esta published e a midia e `portfolio-media`, `case-images` ou URL externa HTTP/HTTPS sem bucket/path.
- admin: CRUD completo com `can_manage_portfolio()`.

`portfolio_case_slug_history`:

- anon/authenticated: `SELECT` apenas quando o case relacionado esta published.
- admin: CRUD completo com `can_manage_portfolio()`.

Storage:

- `portfolio-drafts`: privado; SELECT/INSERT/UPDATE/DELETE apenas para `can_manage_portfolio()`.
- `portfolio-media`: publico para leitura; escrita apenas para `can_manage_portfolio()`.
- Policies de escrita exigem paths no formato `<case_uuid>/<arquivo>`.

## Estrategia Drafts e Publicados

Drafts devem usar `portfolio-drafts`.

Publicados devem usar `portfolio-media`, `case-images` legado durante a migracao ou URLs externas HTTP/HTTPS. A migration nao copia arquivos entre buckets. A futura acao de publicar deve copiar ou mover arquivos de `portfolio-drafts` para `portfolio-media` antes de mudar o status para `published`.

RLS de `portfolio_case_media` protege consultas de metadados, mas nao protege uma URL publica de Storage. Portanto, drafts nunca podem usar `portfolio-media`.

## Testes

Arquivo:

```bash
supabase/tests/portfolio_cms_v2.sql
```

Coberturas adicionadas:

- capa draft em `portfolio-drafts` aceita;
- publicacao com capa em `portfolio-drafts` falha;
- publicacao com capa em `portfolio-media` funciona;
- publicacao com capa em `case-images` funciona;
- publicacao com `cover_url` HTTP/HTTPS externa funciona;
- `cover_url` com protocolo invalido falha ao publicar;
- midia externa HTTP/HTTPS de case published e visivel ao anon;
- midia externa de draft nao e visivel;
- midia de `portfolio-drafts` nao e publica;
- slug atual nao reutiliza historico;
- historico nao colide com slug atual de outro case;
- mudanca legitima de slug registra historico;
- segunda mudanca registra o segundo historico;
- colisao aborta toda a operacao;
- usuario comum nao ganha acesso por cargo `manager`;
- usuario comum nao ganha acesso por `hierarchy_level` alto;
- admin explicito continua autorizado;
- fallback `admin_users` continua funcionando;
- insert administrativo sem JWT mantem `created_by` e `updated_by` nulos;
- `public.cases` e `case-images` continuam intactos.

Os fixtures usam usuarios sintéticos em `auth.users`, `profiles`, `admin_users` e objetos sintéticos em `storage.objects`. Se o schema local de `auth.users` ou `storage.objects` divergir do remoto confirmado, ajustar somente os fixtures do teste, nao a regra de producao.

## Como Testar

Validacao local desta fase, executada em 2026-07-10:

```bash
scripts/test-portfolio-cms-v2-local.sh
```

O metodo real usado nesta fase foi:

1. Supabase local ja rodando em `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.
2. Schema legado aplicado previamente via `supabase/schema.sql`.
3. Migration v2 aplicada via `psql`.
4. Testes SQL executados via `psql`.
5. Verificacoes manuais de objetos, policies, RLS, triggers, indices, seguranca, integridade e legado.

Comandos principais usados:

```bash
/opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260710192407_portfolio_cms_v2.sql

/opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/tests/portfolio_cms_v2.sql
```

Os testes concluem com `ROLLBACK`, sem `ERROR` e sem fixtures persistidos.

Nao foi usado `supabase db reset` porque o historico legado de migrations nao reconstrói o banco desde zero neste repositorio. A validacao local desta fase usa `supabase/schema.sql` como baseline legado, depois aplica somente a migration v2 e os testes SQL.

### Falha Corrigida Durante a Validacao

A primeira aplicacao local falhou no final com:

```text
ERROR: must be owner of relation objects
```

Causa: `COMMENT ON POLICY` em policies de `storage.objects`. Esses objetos pertencem ao schema `storage` e podem exigir ownership que a migration da aplicacao nao possui.

Correcao aplicada: removidos os `COMMENT ON POLICY` da migration. A explicacao equivalente permanece nesta documentacao.

O script local tambem evita `DELETE` direto em Storage sem liberar explicitamente a protecao local: ele usa `set_config('storage.allow_delete_query', 'true', true)` somente dentro da transacao de limpeza dos buckets v2.

Resultado final validado:

- migration aplicada localmente com `COMMIT`;
- testes SQL concluidos com `ROLLBACK`;
- 3 tabelas v2 existem com RLS habilitado;
- `can_manage_portfolio()` existe como `SECURITY DEFINER` e `STABLE`;
- buckets `portfolio-drafts` e `portfolio-media` existem;
- `case-images`, `public.cases` e `public.is_admin()` permanecem;
- fixtures dos testes nao persistiram.

## Aplicacao Remota

Aplicacao remota executada em 2026-07-11 no projeto Supabase `raksadesign` (`yzivkrotylwyglavtnho`).

Metodo usado:

- Supabase MCP `apply_migration`;
- migration aplicada: conteudo de `supabase/migrations/20260710192407_portfolio_cms_v2.sql`;
- nome registrado no historico remoto: `portfolio_cms_v2`;
- versao registrada no historico remoto: `20260711001821`.

Nao foi usado `supabase db push`, `db reset`, migrations antigas, deploy, migrador de conteudo, upload de Storage ou alteracao do sistema legado.

Resultado:

- migration aplicada com sucesso;
- objetos v2 criados;
- smoke tests remotos executados dentro de transacao com `ROLLBACK`;
- tabelas v2 permaneceram vazias;
- `public.cases` permaneceu com 40 registros;
- `case-images` permaneceu intacto.

Relatorio detalhado:

```text
docs/portfolio-cms-v2/remote-application-report.md
```

Observacao de seguranca encontrada no remoto: `PUBLIC` nao tem execute em `public.can_manage_portfolio()`, mas o ACL remoto gerado pelo ambiente Supabase inclui execute explicito para `anon`. A funcao retorna false para anon e os smoke tests confirmaram ausencia de escrita anon, mas uma futura migration de hardening deve revogar explicitamente execute de `anon` se a regra operacional exigir somente `authenticated`.

## Rollback Futuro

Uma migration de rollback deve:

1. Remover policies de Storage criadas para `portfolio-drafts` e `portfolio-media`.
2. Remover buckets `portfolio-drafts` e `portfolio-media` apenas depois de esvaziados.
3. Desativar/remover policies RLS das tabelas v2.
4. Remover triggers e funcoes `portfolio_*`.
5. Remover tabelas `portfolio_case_slug_history`, `portfolio_case_media`, `portfolio_cases`.
6. Remover `public.can_manage_portfolio()`.

Nao remover `public.cases`, `public.admin_users`, `public.is_admin()` ou `case-images`.

## Pontos para a Fase de Migracao

- Migrar os 40 registros remotos de `public.cases`, preservando os quatro `novo-case-*`.
- Preservar slugs Unicode e normalizar para NFC na aplicacao.
- Mapear `cover` para `cover_storage_bucket`, `cover_storage_path` e/ou `cover_url`.
- Mapear `images` para `portfolio_case_media`.
- Copiar assets publicados para `portfolio-media` quando a origem nao puder continuar em `case-images`.
- Implementar publicacao que move/copia de `portfolio-drafts` para `portfolio-media`.
- Atualizar CMS frontend e renderer publico apenas depois de validar a camada de banco.

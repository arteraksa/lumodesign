# Portfolio CMS v2 - Relatorio de Validacao Local

Data: 2026-07-10.

Ambiente:

- Projeto local: `/Volumes/WD Green SSD/Vibecoding/lumodesign-oficial`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- OrbStack: `2.2.1`
- Docker: client/server `29.4.0`
- PostgreSQL servidor local: `17.6`
- `psql`: `18.4`, em `/opt/homebrew/opt/libpq/bin/psql`
- Supabase CLI: nao disponivel no PATH deste shell (`supabase: command not found`)

## Etapas Executadas

1. Confirmado que os objetos v2 nao existiam antes da reaplicacao inicial:
   - `public.portfolio_cases`: ausente
   - `public.portfolio_case_media`: ausente
   - `public.portfolio_case_slug_history`: ausente
   - `public.can_manage_portfolio()`: ausente
2. Removidos `COMMENT ON POLICY` em policies de `storage.objects` na migration v2.
3. Aplicada a migration v2 localmente via `psql`.
4. Executado `supabase/tests/portfolio_cms_v2.sql`.
5. Corrigido o teste final de legado para consultar `storage.buckets` fora do contexto RLS `authenticated`.
6. Executadas verificacoes manuais transacionais de seguranca e integridade.
7. Restauradas as migrations antigas para `supabase/migrations/`.
8. Criado e executado `scripts/test-portfolio-cms-v2-local.sh`.

## Falhas Encontradas e Correcoes

### `COMMENT ON POLICY` em `storage.objects`

Erro:

```text
ERROR: must be owner of relation objects
```

Causa: comentarios em policies de `storage.objects`, objeto externo ao schema `public`.

Correcao: removidos os comandos `COMMENT ON POLICY` da migration. As policies foram preservadas.

### Teste de `case-images`

Erro:

```text
assertion failed: legacy case-images bucket remains
```

Causa: a assercao rodava sob role `authenticated`, que nao le `storage.buckets` livremente.

Correcao: o teste faz `reset role` antes das verificacoes finais de legado.

### Script de limpeza local

Erro:

```text
Direct deletion from storage tables is not allowed. Use the Storage API instead.
```

Causa: Supabase local protege delecoes diretas em tabelas de Storage.

Correcao: o script usa `set_config('storage.allow_delete_query', 'true', true)` somente dentro da transacao de limpeza v2.

### Checagem de IP do script

Erro:

```text
Refusing to run: database connection is not from 127.0.0.1.
```

Causa: dentro do container, `inet_client_addr()` enxerga o IP de bridge do Docker/OrbStack.

Correcao: o script valida a URL antes de conectar e exige `127.0.0.1:54322`.

## Resultado da Migration

Comando executado:

```bash
/opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260710192407_portfolio_cms_v2.sql
```

Resultado final: `COMMIT`.

## Resultado dos Testes

Comando executado:

```bash
/opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/tests/portfolio_cms_v2.sql
```

Resultado final: `ROLLBACK`, sem `ERROR` e sem `assertion failed`.

O script repetivel tambem foi executado com sucesso:

```bash
scripts/test-portfolio-cms-v2-local.sh
```

Resultado final:

```text
Portfolio CMS v2 local validation passed.
```

## Verificacoes Manuais

Objetos:

- `public.portfolio_cases`, `public.portfolio_case_media` e `public.portfolio_case_slug_history` existem.
- RLS habilitado nas 3 tabelas.
- `public.can_manage_portfolio()` existe, `SECURITY DEFINER`, `STABLE`.
- Buckets locais existentes: `case-images`, `portfolio-drafts`, `portfolio-media`.
- 15 policies v2 em tabelas `public`.
- 8 policies v2 em `storage.objects`.
- 16 triggers v2.
- 16 indices v2.

Seguranca:

- anon le published.
- anon nao le draft.
- authenticated comum nao gerencia.
- admin explicito gerencia.
- fallback `admin_users` gerencia.
- `manager` nao gerencia.
- `hierarchy_level` alto sozinho nao gerencia.
- `portfolio-drafts` nao tem leitura publica.
- `portfolio-media` tem leitura publica.
- published nao pode referenciar `portfolio-drafts`.

Integridade:

- `version` incrementa uma vez por update.
- `updated_at` atualiza.
- `published_at` preenche ao publicar e limpa ao despublicar.
- slug history registra mudancas legitimas.
- colisões de slug falham.
- slug Unicode funciona.
- midia externa HTTP/HTTPS funciona.
- protocolo invalido e rejeitado.
- `cover_storage_bucket` e `cover_storage_path` ficam separados.

Legado:

- `public.cases` continua existindo.
- bucket `case-images` continua existindo no ambiente local.
- `public.is_admin()` continua existindo.
- Tabelas CRM principais continuam existindo: `clients`, `projects`, `budgets`, `service_orders`, `products`.

## Objetos Criados pela Migration

- `public.portfolio_cases`
- `public.portfolio_case_media`
- `public.portfolio_case_slug_history`
- `public.can_manage_portfolio()`
- Funcoes trigger `public.portfolio_*`
- Policies RLS das 3 tabelas v2
- Policies Storage para `portfolio-drafts` e `portfolio-media`
- Buckets `portfolio-drafts` e `portfolio-media`
- Indices v2

## Rollback dos Fixtures

Confirmado apos testes e verificacoes transacionais:

- usuarios sintéticos de teste: `0`
- cases de teste em `portfolio_cases`: `0`
- midias de teste em `portfolio_case_media`: `0`
- historico de slug de teste: `0`

## Organizacao das Migrations

- Migrations antigas restauradas para `supabase/migrations/`.
- Migration v2 corrigida em `supabase/migrations/20260710192407_portfolio_cms_v2.sql`.
- Diretório `supabase/migrations-disabled/` removido.

Nao executar `supabase db reset` com todas as migrations ativas neste repositorio: o historico legado nao reconstrói o banco desde zero. O metodo validado usa `supabase/schema.sql` como baseline local, depois a migration v2 e os testes SQL.

## Riscos Restantes

- Os testes locais dependem do schema local Supabase/Auth/Storage entregue pela stack local. Se a versao da stack mudar, fixtures em `auth.users` ou `storage.objects` podem precisar de ajuste.
- A aplicacao remota futura ainda deve ser feita com revisao e backup, porque criara tabelas, policies e buckets no projeto real.
- A fase de migracao de dados ainda nao foi implementada.

## Recomendacao

A camada de banco do Portfolio CMS v2 esta pronta para revisao de aplicacao remota futura. Nao houve aplicacao remota nesta fase.

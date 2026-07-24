# Auditoria da migration remota Next.js

Migration: `20260717140934_nextjs_platform_case_fields.sql`  
Projeto alvo: projeto Supabase existente da RAKSA  
Data: 17 de julho de 2026

## Impacto objetivo

A migration é incremental e depende de `portfolio_cms_v2`. Ela altera somente `public.portfolio_cases`:

- adiciona `client_name text not null default ''`;
- adiciona `archived_at timestamptz`, inicialmente nulo;
- cria índice parcial para `archived_at is not null`;
- cria uma função `SECURITY INVOKER` e um trigger `BEFORE` para manter `archived_at` consistente com `status`.

Ela não cria tabelas, foreign keys, buckets ou políticas RLS/Storage. Esses objetos continuam sob responsabilidade das migrations Portfolio CMS v2 anteriores. Não toca em `public.cases`, `portfolio_case_media`, `portfolio_case_slug_history`, objetos de Storage ou arquivos.

## Estado remoto anterior

- 39 cases v2: 36 publicados, 3 rascunhos e 0 arquivados;
- 567 registros de mídia;
- 2 registros no histórico de slugs;
- 40 cases na tabela legada;
- 0 mídias órfãs;
- 0 mídias de rascunho associadas a cases publicados;
- 24 objetos nos buckets `portfolio-drafts` e `portfolio-media`;
- migration incremental ainda ausente do histórico remoto.

Fingerprints agregados foram registrados antes da aplicação para detectar qualquer alteração involuntária nos cases, mídias e histórico de slugs.

## Riscos encontrados e correções

1. **Reexecução falhava:** `ADD COLUMN`, `CREATE INDEX`, `CREATE FUNCTION` e `CREATE TRIGGER` não eram repetíveis. Foram substituídos por operações idempotentes e recriação controlada do trigger.
2. **Schema parcialmente aplicado:** uma coluna preexistente com tipo incompatível poderia produzir um resultado ambíguo. Um preflight agora interrompe a transação com erro explícito.
3. **Arquivados anteriores:** a versão original não preenchia `archived_at` em linhas já arquivadas. Foi incluído backfill usando `updated_at` como aproximação histórica.
4. **Alteração direta de `archived_at`:** o trigger original reagia apenas à mudança de `status`. Ele agora também normaliza atualizações diretas de `archived_at`.
5. **Rollback destrutivo:** remover `client_name` depois de começar a usá-lo destruiria metadados. O rollback recomendado é em duas fases.
6. **Triggers de auditoria durante backfill:** a primeira aplicação auditada adicionava `client_name` como anulável e depois atualizava as 39 linhas, incrementando `version` e `updated_at`. A coluna agora é criada diretamente com `NOT NULL DEFAULT ''`; o `UPDATE` fica restrito a schemas parcialmente aplicados. O remoto foi reparado a partir do snapshot pré-migration.

## Compatibilidade e dados

O default vazio preserva todos os cases existentes e satisfaz o `NOT NULL`. Não há conversão de slug, status, conteúdo, mídia, ordem, SEO ou timestamps existentes. Como o remoto não possui cases arquivados, os updates de normalização não alteram nenhuma linha no estado atual.

A transação cobre toda a migration. Qualquer falha de preflight, DDL, função ou trigger causa rollback integral.

## Rollback

Rollback operacional e não destrutivo:

```sql
begin;
drop trigger if exists portfolio_cases_15_sync_archived_at on public.portfolio_cases;
drop function if exists public.portfolio_sync_case_archived_at();
drop index if exists public.portfolio_cases_archived_at_idx;
commit;
```

As colunas devem ser mantidas nesse rollback para preservar dados. A remoção física só deve ocorrer após exportar `client_name` e confirmar que nenhuma aplicação depende das colunas:

```sql
alter table public.portfolio_cases
  drop column if exists archived_at,
  drop column if exists client_name;
```

## Resultado da auditoria

Após as correções, a migration é compatível com os 36 cases publicados e os 3 rascunhos existentes, não contém operação de exclusão e pode ser aplicada repetidamente. A validação remota antes/depois ainda deve confirmar contagens, fingerprints, ACLs, policies, buckets, índice, função e trigger.

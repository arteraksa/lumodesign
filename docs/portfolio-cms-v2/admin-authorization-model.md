# Modelo atual de autorizacao administrativa

Data: 2026-07-10.

Modo: somente leitura.

## Fontes atuais de autorizacao

### 1. `public.admin_users`

Tabela remota:

- `user_id uuid primary key references auth.users(id) on delete cascade`
- 1 linha remota
- RLS habilitado

Uso:

- `public.is_admin()` considera usuario admin se existir em `admin_users`.
- Storage `case-images` permite upload/update/delete somente se existir linha em `admin_users`.
- Frontend `isAdminUser()` tambem consulta `admin_users`.

### 2. `public.profiles`

Tabela remota:

- 2 linhas remotas.
- Campos administrativos: `role`, `access_level`, `hierarchy_level`, `status`.

Uso:

- `public.is_admin()` considera admin se perfil ativo tiver:
  - `role = 'admin'`, ou
  - `access_level = 'admin'`, ou
  - `hierarchy_level >= 90`.
- `private.can_manage_users()` usa regra similar.
- `public.is_super_admin()` considera super admin se perfil ativo tiver:
  - `role = 'super_admin'`, ou
  - `access_level = 'super_admin'`, ou
  - `hierarchy_level >= 100`.

### 3. Emails hardcoded

Emails hardcoded aparecem em:

- `admin/modules/api.js`: `PROTECTED_SUPER_ADMIN_EMAILS`.
- `admin/modules/constants.js`: `SUPER_ADMIN_EMAILS`.
- `supabase/schema.sql` e migrations em `private.is_super_admin()`.
- Remoto em `private.is_super_admin()` e `guard_profile_self_update()`.

Uso:

- Super admin raiz por email.
- Protecao contra rebaixamento de usuarios raiz.

### 4. Frontend

`admin/modules/api.js`:

- `loadSession()` faz `supabase.auth.getSession()`.
- Se ha sessao e `isAdminUser()` falha, faz sign out.
- `isAdminUser()`:
  - preenche fallback profile;
  - aceita super admin por email/fallback;
  - consulta `admin_users`;
  - senao consulta/cria `profiles`;
  - aceita `isSuperAdmin(state)` ou perfil ativo nao sintetico.

Risco:

- O frontend aceita caminhos mais amplos/complexos que Storage.
- Qualquer validacao frontend e apenas UX; a autorizacao real precisa estar em RLS/policies.

## Divergencias entre camadas

| Camada | Regra atual | Divergencia |
|---|---|---|
| Tabela `cases` | `public.is_admin()` | Aceita `admin_users`, perfil admin e super admin por email/perfil. |
| Storage `case-images` | existencia em `public.admin_users` | Nao aceita admin apenas por `profiles`; pode bloquear usuario que consegue editar `cases`. |
| Frontend admin | `isAdminUser()` + fallback super admin + perfil ativo | Pode permitir entrada na UI para usuario que ainda nao consegue upload no Storage. |
| User management | `can_manage_users()` / `profiles` | Nao e a mesma regra usada pelo Storage. |
| Super admin | emails hardcoded + profile role/access/hierarchy | Emails estao duplicados entre frontend e DB. |

## Riscos

1. Admin por `profiles` pode editar metadata de case mas falhar em upload de imagem.
2. Admin por `admin_users` pode operar storage mesmo se o perfil estiver incompleto.
3. Emails hardcoded estao replicados em frontend e funcoes SQL, aumentando risco de drift.
4. `public.is_super_admin()` depende de funcao `SECURITY DEFINER` em schema `private`; e aceitavel para ler `auth.users`, mas precisa continuar com grants restritos.
5. Bucket publico torna impossivel proteger midia de drafts apenas com RLS de tabela.

## Regra administrativa recomendada para CMS v2

Recomendacao: usar uma unica funcao de banco para todas as policies do CMS v2:

- `public.is_admin()` ou uma nova `public.can_manage_portfolio()`.
- A regra deve aceitar apenas usuarios autenticados com perfil ativo e permissao administrativa definida em `profiles`.
- `admin_users` deve ser legado/ponte temporaria ou fonte apenas para bootstrap, nao regra primaria v2.
- Storage v2 deve usar a mesma funcao (`can_manage_portfolio()`), nao `admin_users` direto.
- Emails hardcoded devem ser reduzidos a bootstrap/super-admin emergencial no banco, nao no frontend.

Modelo sugerido:

- `profiles.status = 'active'`
- e um destes:
  - `role in ('super_admin','admin','manager')`, ou
  - `access_level in ('super_admin','admin','manager')`, ou
  - `hierarchy_level >= 90`

Para menor ambiguidade no CMS v2:

- criar permissao semantica explicita, como `can_manage_portfolio`, em `profiles.preferences` nao e ideal; melhor coluna/role dedicada se o escopo crescer.
- enquanto nao houver matriz fina, `can_manage_portfolio()` deve ser o unico predicado usado por:
  - `portfolio_cases`
  - `portfolio_case_media`
  - `portfolio_case_slug_history`
  - policies do bucket `portfolio-media`
  - Edge Functions de admin, se houver.

## O que nao implementar ainda

- Nao alterar `public.is_admin()`.
- Nao migrar policies de Storage.
- Nao remover `admin_users`.
- Nao remover emails hardcoded antes de plano de bootstrap.

## Checklist para Prompt 2

- Definir `can_manage_portfolio()` antes de criar policies v2.
- Usar a mesma funcao em tabelas e storage.
- Manter compatibilidade temporaria com `admin_users` se o usuario atual depende disso.
- Documentar caminho de migração de admins legados para `profiles`.
- Nao confiar em flags do frontend para autorizacao.

# Auditoria de seguranca Supabase/RLS

Data: 2026-07-05  
Escopo: auditoria estatica local do admin em `/admin/`, `supabase/schema.sql`, migrations em `supabase/migrations/` e Edge Functions em `supabase/functions/`.

## Resumo executivo

O admin usa Supabase diretamente no frontend com a publishable/anon key de `admin/supabase-config.js`. Esse modelo e aceitavel para um export estatico desde que as tabelas expostas tenham RLS correta, porque a chave publica nao deve ser tratada como segredo.

A auditoria local nao encontrou service role key versionada. A unica service role referenciada esta em `supabase/functions/create-user/index.ts` via `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`, que e o padrao correto para uso backend/Edge Function.

Nao foi criada migration nesta etapa. As policies locais protegem dados administrativos com `public.is_admin()` e `public.can_manage_users()`. Os riscos encontrados sao principalmente de endurecimento, consistencia operacional e validacao remota.

## Limite da validacao

Esta auditoria foi feita contra arquivos versionados. Sem acesso ao projeto Supabase remoto ou dump atual de policies, nao e possivel provar que o ambiente publicado esta identico ao `supabase/schema.sql` e as migrations locais.

Tambem ha mudanca recente de plataforma a considerar: Supabase passou a exigir exposicao explicita de tabelas na Data API em novos projetos. Isso nao substitui RLS; GRANT/exposicao de API e RLS continuam sendo controles diferentes.

## Uso do Supabase no admin

### Autenticacao

- `admin/app.js`
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.signOut()`
- `admin/modules/api.js`
  - `auth.getSession()`
  - `auth.signOut()`
  - `auth.updateUser({ password })`

### Edge Functions

- `admin/modules/api.js`
  - `client.functions.invoke("create-user", { body })`

### Storage

- Bucket: `case-images`
- `admin/modules/cases.js`
  - upload de imagens de cases
  - leitura de URL publica via `getPublicUrl`
- `admin/modules/api.js`
  - remocao de imagens do bucket

### Tabelas lidas pelo admin

- `admin_users`
- `profiles`
- `activity_logs`
- `cases`
- `clients`
- `contacts`
- `projects`
- `products`
- `product_substrates`
- `substrates`
- `budgets`
- `service_orders`
- `service_order_items`
- `time_entries`
- `metrics_events`
- `financial_settings`

### Tabelas criadas/atualizadas/removidas pelo admin

- `profiles`: criacao/atualizacao de usuarios administrativos e perfis
- `activity_logs`: registro de atividade
- `cases`: CRUD de cases e status de publicacao/destaque
- `clients`: CRUD de clientes
- `contacts`: CRUD de contatos
- `projects`: CRUD de projetos
- `products`: CRUD de produtos
- `product_substrates`: CRUD de vinculos produto/substrato
- `substrates`: CRUD de substratos/custos
- `budgets`: criacao/alteracao/remocao de orcamentos
- `service_orders`: criacao/alteracao/remocao de OS
- `service_order_items`: criacao/alteracao/remocao de itens de OS
- `time_entries`: CRUD de apontamentos de tempo
- `financial_settings`: leitura e escrita das configuracoes financeiras globais

### Fluxos sensiveis

- Login administrativo.
- Identificacao de administrador via `admin_users`, `profiles`, `public.is_admin()` e `public.can_manage_users()`.
- Criacao de usuario por Edge Function com invite do Supabase Auth.
- Edicao de clientes, contatos, projetos, cases, precos, substratos, orcamentos, OS e configuracoes financeiras.
- Eventos de metricas publicas com insert anonimo intencional.

## Schema e policies locais

### Conteudo publico

#### `cases`

- Colunas principais: `slug`, `title`, `tags`, `description`, `cover`, `images`, `published`, `featured_on_home`, `home_order`, `excerpt`, `content_blocks`, `external_url`.
- RLS: ativado.
- Leitura: publico pode ler apenas `published = true`; admins tambem leem unpublished via `public.is_admin()`.
- Escrita: insert/update/delete apenas `authenticated` com `public.is_admin()`.
- Risco: baixo. Conteudo publicado fica integralmente legivel, como esperado para site publico.

#### `site_settings`

- Colunas principais: `key`, `value`, `updated_at`.
- RLS: ativado.
- Leitura: publica.
- Escrita: `authenticated` com `public.is_admin()`.
- Risco: medio se valores privados forem gravados nesta tabela. Recomendacao: tratar `site_settings` como conteudo publico e nunca armazenar secrets.

#### `metrics_events`

- Colunas principais: `event_name`, `path`, `metadata`, `created_at`.
- RLS: ativado.
- Insert: anonimo e autenticado, com constraints para nomes de evento permitidos, tamanho de `path`, JSON object em `metadata`, limite de tamanho e janela de horario.
- Select: `authenticated` com `public.is_admin()`.
- Risco: medio/baixo. Insert publico e intencional para analytics, mas pode receber spam. Recomendacao: considerar rate limit ou Edge Function se volume/abuso virar problema.

### Administracao e CRM

#### `admin_users`

- Colunas principais: `user_id`, `email`, `created_at`.
- RLS: ativado.
- Select: `authenticated` apenas para o proprio `user_id`.
- Insert/update/delete: sem grants/policies publicas no schema final.
- Uso em helpers: `public.is_admin()` consulta `admin_users`.
- Diagnostico: bom como lista minima de administradores diretos. A tabela nao deve ser editavel pelo browser.
- Risco: baixo. Existe `grant select` tambem para `anon`, mas a policy e `to authenticated`; anon nao deve receber linhas.

#### `profiles`

- Colunas principais: `auth_user_id`, `email`, `full_name`, `role`, `access_level`, `status`, `department`, `hierarchy_level`, dados de contato, custo interno, preferencias e metadados de auditoria.
- RLS: ativado.
- Select: usuario le o proprio perfil; managers/super admins leem todos via `public.can_manage_users()`.
- Insert: apenas managers/super admins via `public.can_manage_users()`.
- Update: usuario pode atualizar o proprio perfil; managers/super admins podem atualizar perfis. Trigger `public.guard_profile_self_update()` bloqueia alteracao propria de campos sensiveis por nao-manager.
- Delete: revogado no schema final.
- Risco: medio/baixo. A policy depende corretamente de helper de permissao e trigger de protecao. Pendente validar se o banco remoto esta alinhado com a migration final.

#### `activity_logs`

- Colunas principais: `user_id`, `action`, `module`, `entity_type`, `entity_id`, `entity_label`, `old_data`, `new_data`, `metadata`, `ip_address`, `user_agent`.
- RLS: ativado.
- Select: proprio usuario ou managers.
- Insert: proprio usuario ou managers.
- Update/delete: sem grant final.
- Risco: baixo/medio. Pode conter metadados sensiveis se o frontend enviar payloads excessivos. Recomendacao: continuar evitando secrets em logs.

#### `clients`, `contacts`, `projects`

- Colunas principais: dados comerciais, contato, endereco, fiscal, relacionamento e status.
- RLS: ativado.
- CRUD: `authenticated` com `public.is_admin()`.
- Risco: baixo no schema local. Dados pessoais/comerciais nao sao legiveis por anon nem por autenticado nao-admin.

#### `products`, `substrates`, `product_substrates`

- Colunas principais: precificacao, custo, regra de aquisicao, vinculos produto/substrato.
- RLS: ativado.
- CRUD: `authenticated` com `public.is_admin()`.
- Risco: baixo no schema local. Configuracoes de preco/custo ficam protegidas de anon e nao-admin.

#### `budgets`

- Colunas principais: numero, cliente/contato/projeto, status, totais, snapshots de precificacao, payload, criador.
- RLS: ativado.
- CRUD: `authenticated` com `public.is_admin()`.
- Risco: baixo no schema local. Orcamentos e snapshots nao sao publicos.

#### `service_orders`, `service_order_items`

- Colunas principais: numero de OS, cliente/projeto/orcamento de origem, status, datas, itens, snapshots e metadados.
- RLS: ativado.
- CRUD: `authenticated` com `public.is_admin()`.
- Risco: baixo no schema local.

#### `time_entries`

- Colunas principais: projeto/OS/usuario, data, minutos, taxa horaria, descricao.
- RLS: ativado.
- CRUD: `authenticated` com `public.is_admin()`.
- Risco: baixo no schema local.

#### `financial_settings`

- Colunas principais: singleton de configuracoes financeiras globais, parametros de margem, impostos, hora e recorrencia.
- RLS: ativado.
- CRUD: `authenticated` com `public.is_admin()`.
- Risco: baixo no schema local, alto impacto de negocio se policy remota estiver divergente.

## Helpers de permissao

- `public.is_admin()`
  - Retorna verdadeiro para `admin_users`, super admins e perfis ativos com papel/acesso administrativo ou hierarquia alta.
  - Usado nas policies das tabelas administrativas.
- `private.is_super_admin()` e wrapper `public.is_super_admin()`
  - Helper para emails raiz e perfis super admin.
  - Funcoes privadas revogadas de `public`/`anon` e concedidas a `authenticated`.
- `private.can_manage_users()` e wrapper `public.can_manage_users()`
  - Autoriza gestao de usuarios para super admins/admins/hierarquia alta.
  - Usado em `profiles` e `activity_logs`.

Risco: baixo/medio. A estrutura esta adequada, mas helpers `security definer` sempre merecem validacao remota e revisao cuidadosa de `search_path`. No schema local as referencias criticas estao qualificadas.

## Storage

Bucket: `case-images`.

- Upload/update/delete em `storage.objects`: exige usuario em `public.admin_users`.
- Leitura publica: o frontend usa `getPublicUrl`, e o bucket e tratado como publico para imagens de cases.

Risco: medio/baixo. A escrita esta restrita, mas usa apenas `admin_users`, enquanto outras areas aceitam tambem admins por `profiles`/hierarquia. Isso pode gerar inconsistencia operacional: um admin valido por `profiles` pode conseguir editar dados mas nao subir imagem se nao existir em `admin_users`.

Recomendacao: alinhar policies de storage a `public.is_admin()` ou documentar `admin_users` como fonte obrigatoria para permissoes de upload.

## Edge Function `create-user`

Arquivo: `supabase/functions/create-user/index.ts`

Pontos positivos:

- Exige metodo `POST`.
- Exige header `Authorization: Bearer`.
- Valida o usuario solicitante com `userClient.auth.getUser()`.
- Usa service role apenas dentro da Edge Function via variavel de ambiente.
- Confere permissao por email protegido ou perfil ativo com role/acesso administrativo/hierarquia alta.
- Cria convite pelo Supabase Auth Admin API e grava `profiles` com service role.
- Nao ha service role key versionada.

Pontos de atencao:

- CORS usa `Access-Control-Allow-Origin: *`. Como a funcao exige Bearer token, isso nao e por si so vazamento de credencial, mas permite chamadas de qualquer origem que consiga obter um token valido.
- Algumas respostas de erro repassam `error.message` de Supabase. Isso pode expor detalhes internos de schema/constraints.
- A validacao de input e basica. Ha normalizacao de email e obrigatoriedade de nome, mas roles/status/access_level dependem das constraints do banco.

Risco: medio. Nao ha indicio de service role exposta, mas vale endurecer CORS e respostas de erro antes de abrir o admin para mais usuarios.

## Auditoria do frontend admin

O admin nao depende apenas de esconder elementos pela UI para proteger dados: as tabelas sensiveis tem RLS no banco. Mesmo que alguem abra o console e use a publishable key diretamente, as operacoes administrativas dependem das policies.

Ponto de atencao: `isAdminUser()` no frontend tambem aceita perfil ativo em alguns caminhos de fallback. Se esse perfil nao for admin no banco, a UI pode liberar a casca do admin, mas as consultas administrativas devem falhar por RLS. Isso e mais um risco de UX/consistencia do que de vazamento, desde que o banco remoto esteja alinhado ao schema local.

Recomendacao: numa etapa futura, alinhar o gate visual do frontend exatamente ao mesmo criterio de autorizacao usado por `public.is_admin()`/`public.can_manage_users()`.

## Riscos por severidade

### Critica

- Nenhum risco critico encontrado nos arquivos locais.

### Alta

- Nenhum risco alto confirmado localmente.
- Risco condicional: se o Supabase remoto estiver divergente e sem RLS equivalente nas tabelas administrativas, a publishable key versionada permitiria acesso indevido. Validar remoto e prioridade antes de publicar mudancas sensiveis.

### Media

- `create-user` tem CORS amplo e respostas de erro com mensagens internas.
- `metrics_events` aceita insert anonimo intencional e pode receber spam.
- `site_settings` e publico; qualquer dado sensivel gravado ali fica exposto.
- Storage usa `admin_users` enquanto parte do admin usa `profiles`/hierarquia para permissao, criando possivel divergencia operacional.
- Gate visual do admin pode aceitar perfil ativo antes de a RLS confirmar permissao administrativa.

### Baixa

- `grant select` em `admin_users` tambem inclui `anon`, mas a policy final e `to authenticated` e restringe ao proprio usuario.
- Helpers `security definer` exigem revisao continua, embora estejam razoavelmente protegidos no schema local.

## Recomendacoes

1. Manter a publishable/anon key no frontend somente se o ambiente remoto estiver comprovadamente com as mesmas RLS/policies.
2. Rodar uma validacao remota das policies com Supabase CLI/MCP ou SQL controlado:
   - anon nao deve ler tabelas administrativas.
   - authenticated nao-admin nao deve ler/escrever CRM, precos, orcamentos, OS, financeiros ou metricas.
   - admin deve conseguir CRUD esperado.
3. Endurecer `create-user`:
   - restringir CORS ao dominio de producao/admin quando houver dominio final.
   - trocar mensagens internas por erros genericos no response e registrar detalhes apenas em logs.
   - validar enums de `role`, `status`, `access_level` e limites de campos antes de inserir.
4. Alinhar storage a `public.is_admin()` ou documentar `admin_users` como requisito tambem para upload de imagens.
5. Alinhar o gate visual do admin ao mesmo criterio do banco.
6. Tratar `site_settings` como conteudo publico por contrato.
7. Considerar rate limiting para `metrics_events` se houver abuso.

## Acoes aplicadas nesta etapa

- Criado este relatorio em `docs/supabase-security-audit.md`.
- Nenhuma migration foi criada.
- Nenhuma policy foi alterada.
- Nenhuma mudanca visual foi feita.

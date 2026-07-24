# Portfolio CMS v2 live UX debug and stability report

Date: 2026-07-14

## Status

Auditoria Playwright configurada, mas o fluxo real autenticado ainda nao foi concluido nesta sessao porque as variaveis temporarias de credenciais nao estavam presentes no ambiente:

- `PORTFOLIO_TEST_ADMIN_EMAIL`: ausente
- `PORTFOLIO_TEST_ADMIN_PASSWORD`: ausente

O teste falha antes de abrir ou gravar a sessao quando essas variaveis nao existem. Nenhum email, senha ou token foi impresso.

Comando seguro para executar no Terminal local, substituindo os valores sem colar credenciais em logs compartilhados:

```bash
PORTFOLIO_TEST_ADMIN_EMAIL='email-admin' PORTFOLIO_TEST_ADMIN_PASSWORD='senha-admin' npm run portfolio:cms:e2e
```

## 1. Configuracao Playwright

- Dependencia instalada apenas em `devDependencies`: `@playwright/test`.
- Config isolada: `admin/portfolio/playwright.config.ts`.
- Testes isolados: `admin/portfolio/e2e/`.
- Comando adicionado: `npm run portfolio:cms:e2e`.
- Navegador configurado: Google Chrome instalado no macOS via `channel: "chrome"`.
- Chromium nao foi baixado manualmente.
- Servidores usados pela suite:
  - CMS: `http://localhost:5174/admin/portfolio/`
  - Publico: `http://localhost:4174/raksadesign/cases/`

## 2. Autenticacao

`admin/portfolio/e2e/global-setup.ts` executa:

1. abre `/admin/portfolio/login`;
2. preenche email e senha vindos de `PORTFOLIO_TEST_ADMIN_EMAIL` e `PORTFOLIO_TEST_ADMIN_PASSWORD`;
3. autentica no Supabase;
4. confirma `public.can_manage_portfolio()` via RPC com o token da sessao;
5. salva somente `admin/portfolio/.auth/admin.json`;
6. reutiliza o storageState nos testes seguintes.

O storageState contem tokens de sessao do navegador, nao a senha.

Arquivos ignorados no Git:

- `admin/portfolio/.auth/`
- `admin/portfolio/test-results/`
- `admin/portfolio/playwright-report/`

## 3. Captura de rede e console

A suite registra em `admin/portfolio/test-results/telemetry/*.json`:

- erros de console;
- warnings nao ignorados;
- requests Supabase;
- requests `PATCH` em `portfolio_cases`;
- requests de publicacao/update com `status: "published"`;
- requests de Storage;
- respostas 4xx/5xx;
- requests repetidas;
- duracao das operacoes.

Falhas configuradas:

- erro de console ou `pageerror`;
- resposta 4xx/5xx;
- requests repetidas acima do limite de ruido;
- update em loop;
- publicacao/update duplicado;
- overlay/modal persistente apos cada fluxo.

Warning ignorado documentado: sugestao do React DevTools em desenvolvimento.

## 4. Fluxos reais cobertos pela suite

Arquivo: `admin/portfolio/e2e/portfolio-cms-real.spec.ts`.

Fluxos preparados:

- cria case descartavel com slug `test-cms-e2e-*`;
- preenche campos minimos;
- digita continuamente no titulo por pelo menos 10 segundos;
- conta requests de update durante e depois do debounce;
- valida single-flight de autosave;
- confirma que abrir galeria/preview nao dispara update;
- adiciona capa e imagem de galeria;
- publica com clique duplicado;
- confirma uma unica operacao de publicacao no backend;
- edita publicado e valida "Alteracoes nao publicadas";
- confirma ausencia de autosave em `published`;
- atualiza publicacao com clique duplicado;
- confirma `published_at` preservado e `version` incrementada;
- abre o frontend publico em 390, 810 e 1440 px;
- simula resposta incerta via Playwright routing;
- valida que estados "Publicando", "Atualizando", "Salvando" e "Reconciliando" nao ficam presos;
- testa dialog nativo de arquivamento;
- arquiva o case descartavel no final.

## 5. Requests observadas

Sem credenciais temporarias, a execucao real parou no global setup. Portanto nao ha contagem real autenticada de:

- requests durante digitacao;
- requests durante publicacao;
- requests de Storage;
- reconciliacao apos falha simulada.

A estrutura de telemetria esta pronta para registrar esses numeros na primeira execucao autenticada.

## 6. Problemas encontrados e correcoes aplicadas

Problema: Vitest tentava executar arquivos Playwright dentro de `admin/portfolio/e2e`.

Correcao:

- `admin/portfolio/vitest.config.ts` agora restringe os unit tests a `admin/portfolio/src/tests/**/*.{test,spec}.{ts,tsx}`.

Problema: a UI nao tinha seletores estaveis suficientes para auditoria E2E robusta.

Correcao:

- adicionados `data-testid` e atributos de estado no editor/lista;
- `RichTextEditor` recebeu `data-testid="case-content-editor"`.

## 7. Estado de modais e toasts

Nao validado em fluxo autenticado nesta sessao por ausencia das credenciais temporarias.

O teste cobre:

- ausencia de overlay/modal persistente apos cada teste;
- dialog de arquivamento com cancelamento e confirmacao;
- toast unico de publicacao;
- toast unico de atualizacao;
- ausencia de toast duplicado em clique repetido.

## 8. Resultado de clique duplicado

Nao validado em backend real nesta sessao por ausencia das credenciais temporarias.

A suite espera:

- botao de publicar desabilitado imediatamente;
- uma unica request de publicacao;
- botao de atualizar desabilitado imediatamente;
- uma unica request de atualizacao.

## 9. Resultado da reconciliacao

Nao validado em backend real nesta sessao por ausencia das credenciais temporarias.

A suite simula falha de rede em um `PATCH` de publicacao/update e verifica:

- mensagem explicita ao usuario;
- ausencia de estado infinito;
- reload do case;
- UI alinhada ao estado real do banco.

## 10. Erros de console

Nenhuma execucao autenticada real foi concluida. A suite falhara em erro de console ou `pageerror` nao tratado.

## 11. Testes executados

Executados nesta sessao:

```bash
npm run portfolio:cms:lint
npm run portfolio:cms:test
npx playwright test --config admin/portfolio/playwright.config.ts --list
npm run portfolio:cms:e2e
npm run portfolio:cms:build
npm run verify
```

Resultados:

- `portfolio:cms:lint`: passou.
- `portfolio:cms:test`: passou, 6 arquivos e 28 testes.
- `playwright --list`: passou, 4 testes E2E listados.
- `portfolio:cms:e2e`: falhou corretamente no guard de credenciais ausentes.
- `portfolio:cms:build`: passou com o warning existente de chunk inicial acima de 500 kB.
- `verify`: passou.

## 12. Testes que falharam

`npm run portfolio:cms:e2e` falhou antes da automacao real:

```text
Credenciais de teste ausentes.
Execute sem expor os valores no log:
PORTFOLIO_TEST_ADMIN_EMAIL='email-admin' PORTFOLIO_TEST_ADMIN_PASSWORD='senha-admin' npm run portfolio:cms:e2e
```

## 13. Limitacoes restantes

- O fluxo real autenticado em Google Chrome por Playwright precisa ser executado com as variaveis temporarias.
- As contagens reais de autosave, publicacao, Storage, toasts, modais e reconciliacao ainda dependem dessa execucao.
- A suite cobre um subconjunto pratico dos modais relevantes; conflito e erro critico dependem de estados reais/simulados adicionais apos a primeira rodada autenticada.
- O build ainda emite o warning ja conhecido de chunk grande.

## 14. Arquivos alterados

- `.gitignore`
- `package.json`
- `package-lock.json`
- `admin/portfolio/playwright.config.ts`
- `admin/portfolio/e2e/global-setup.ts`
- `admin/portfolio/e2e/portfolio-cms-real.spec.ts`
- `admin/portfolio/vitest.config.ts`
- `admin/portfolio/src/features/cases/CaseList.tsx`
- `admin/portfolio/src/features/cases/CaseEditor.tsx`
- `admin/portfolio/src/features/editor/RichTextEditor.tsx`
- `docs/portfolio-cms-v2/live-ux-debug-and-stability-report.md`

## 15. Confirmacoes

- Nenhum deploy foi feito.
- Nenhum schema foi alterado.
- Nenhuma migration foi aplicada.
- Nenhuma dependencia de producao foi adicionada.
- Nenhum case real foi alterado destrutivamente nesta sessao.
- Nenhuma limpeza destrutiva de Storage foi executada.
- A auditoria nao deve ser considerada concluida ate `npm run portfolio:cms:e2e` passar com sessao administrativa real no Google Chrome.

## 16. Diagnostico de autorizacao administrativa

Data: 2026-07-14

Erro investigado:

- login com sucesso;
- `public.can_manage_portfolio()` reportado como `false` no `global-setup.ts`;
- conta: `om***@gmail.com`.

Causa exata:

- o banco remoto ja autorizava a conta pelo mecanismo existente;
- a conta tem `public.profiles` ativo com `role = super_admin` e `access_level = super_admin`;
- a conta tambem possui vinculo em `public.admin_users`;
- com o UUID autenticado da conta, `public.can_manage_portfolio()` retorna `true`;
- o falso negativo vinha do E2E: o `global-setup.ts` tentava chamar a RPC usando `window.RAKSA_SUPABASE`, mas o CMS Vite usa fallback/import env interno e nao garante esse objeto global.

Mecanismo administrativo existente:

- origem primaria: `public.profiles.auth_user_id = auth.uid()`, `status = active`, com `role` ou `access_level` em `admin`/`super_admin`;
- fallback de bootstrap: `public.admin_users.user_id = auth.uid()`;
- policies do Portfolio CMS v2 e do Storage continuam usando `public.can_manage_portfolio()`.

Alteracao minima realizada:

- nenhum registro do banco foi alterado;
- `admin/portfolio/e2e/global-setup.ts` passou a confiar no resultado real da UI apos login:
  - se o botao `Novo case` aparece, a sessao foi autorizada pelo `resolveAuthState()`;
  - se a tela `Sem permissao` aparece, o erro agora e explicito e inclui somente diagnostico sanitizado:
    - `loginSucceeded: true`;
    - `userIdMasked`;
    - `canManagePortfolio: false`.

Validacoes remotas:

- UUID autenticado mascarado existe.
- `public.can_manage_portfolio()` com o UUID da conta retorna `true`.
- a conta, simulada como `authenticated`, consegue listar `portfolio_cases` e ve 39 linhas.
- usuario comum sem vinculo administrativo retorna `false`.
- request anonima real de escrita em `portfolio_cases` retornou HTTP 401.
- `anon` nao tem `EXECUTE` em `public.can_manage_portfolio()`.
- `authenticated` tem `EXECUTE` em `public.can_manage_portfolio()`.

Comandos locais apos a correcao:

```bash
npm run portfolio:cms:lint
npm run portfolio:cms:test
npm run portfolio:cms:build
npm run verify
npm run portfolio:cms:e2e
```

Resultados:

- lint passou;
- unit tests passaram: 6 arquivos, 28 testes;
- build passou com o warning conhecido de chunk grande;
- verify passou;
- E2E nao executou nesta sessao porque `PORTFOLIO_TEST_ADMIN_EMAIL` e `PORTFOLIO_TEST_ADMIN_PASSWORD` nao estavam presentes no ambiente do agente.

Confirmacoes:

- RLS nao foi enfraquecida.
- `public.can_manage_portfolio()` nao foi alterada para retornar `true`.
- nenhum email foi hardcoded na funcao.
- nenhum bypass frontend foi criado.
- service role nao foi usado no navegador.
- nenhum deploy foi feito.

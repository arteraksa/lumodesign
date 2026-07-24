# Relatório de validação da reconstrução Next.js

Data: 17 de julho de 2026.

## Resultado

A nova aplicação executa de forma independente do runtime do Framer. O export antigo continua preservado e pode ser iniciado com `npm run legacy:dev`; nenhum arquivo legado foi removido nesta etapa.

## Continuação: validação remota Supabase

Data: 17 de julho de 2026, continuação da homologação com o projeto remoto definitivo `yzivkrotylwyglavtnho`.

- Migration `20260717140934_nextjs_platform_case_fields.sql`: auditada, corrigida para execução repetida e aplicada no remoto como `20260717151735_nextjs_platform_case_fields`.
- Migration `20260717152107_harden_nextjs_portfolio_access.sql`: aplicada no remoto como `20260717152126_harden_nextjs_portfolio_access`.
- Migration `20260717164059_constrain_portfolio_storage_uploads.sql`: criada nesta continuação, simulada com rollback e aplicada no remoto como `20260717164120_constrain_portfolio_storage_uploads`.
- Backup prévio preservado em `backups/nextjs-platform/2026-07-17-pre-platform-fields.json` com SHA-256 registrado no arquivo `.sha256`.
- Estado remoto pós-validação: `portfolio_cases` com 36 publicados e 3 rascunhos; `portfolio_case_media` com 567 registros; histórico de slugs com 2 registros.
- Buckets `portfolio-drafts` e `portfolio-media`: limite de 10 MB e MIME restrito a JPEG, PNG, WebP e AVIF para novos uploads.
- `.env.local`: configurado com URL pública, publishable key e `REVALIDATION_SECRET`; nenhum segredo foi impresso no relatório.

## Segurança prática

- Visitante anon via REST: 36 cases publicados visíveis, 0 rascunhos/arquivados visíveis.
- Insert anon em `portfolio_cases`: bloqueado com `401`.
- Update como `role anon` em transação rollback: 0 linhas atualizadas.
- RPC `public.can_manage_portfolio()` como anon: bloqueado com `401`.
- Usuário autenticado não admin simulado por JWT real existente: `can_manage_portfolio = false` e 0 linhas atualizadas em rollback.
- Upload anon de PNG real para `portfolio-media`: bloqueado por RLS.
- Endpoint `/api/revalidate`: `401` sem segredo ou com segredo inválido; `200` com `REVALIDATION_SECRET`.
- Advisors Supabase: permanecem avisos de `can_manage_portfolio()` como `SECURITY DEFINER` executável por `authenticated` (intencional como gate de autorização), leaked password protection desativado no Auth e avisos de performance/índices antigos.

## Verificações automatizadas

- `npm run lint`: aprovado, sem warnings;
- `npm run typecheck`: aprovado;
- `npm run build`: aprovado em modo de produção com Next.js 16;
- `npm audit --omit=dev`: zero vulnerabilidades conhecidas;
- detector de heurísticas visuais do Impeccable: nenhuma ocorrência.

Na continuação, os comandos foram executados com Node.js 20.20.2 e passaram; o build emite aviso do `@supabase/supabase-js` indicando que Node 20 será descontinuado futuramente e deve ser substituído por Node 22+.

## Navegador

Validação feita com Google Chrome via Playwright no servidor de produção em `http://localhost:3000`:

| Cenário | Resultado |
| --- | --- |
| Desktop 1440 x 1000 | HTTP 200, sete seções, sem overflow horizontal, sem erros de console |
| Mobile 390 x 844 | HTTP 200, sem overflow horizontal, título e conteúdo visíveis |
| Teclado | skip link e navegação alcançáveis; FAQ expande com Enter |
| Reduced motion | conteúdo visível, sem depender de animações de entrada |
| WebGL disponível | canvas carregado de forma tardia no hero |
| WebGL indisponível | canvas ausente e fallback visual presente |
| Case `/cases/leylaw` | HTTP 200, conteúdo e capa renderizados no servidor |
| Admin sem configuração | redireciona para `/admin/login`; não cria sessão simulada |

Capturas de referência: `next-desktop-final.png`, `next-mobile-final.png`, `next-reduced-final.png` e `next-no-webgl.png` no diretório de visualizações desta tarefa.

Na continuação, a validação de produção confirmou:

- Chrome real, viewports 1440x900, 1280x800, 810x1080 e 390x844: 0 erros de console e 0 responses 4xx/5xx na home.
- Safari real: home carregada em nova aba em `localhost:3000`; screenshot salvo como `next-safari-real-home.jpeg`.
- `/cases`: 36 cards renderizados a partir do Supabase remoto.
- `/cases/leylaw`: H1 `Leylaw` e imagens renderizadas.
- Scroll real até Cases: capas dos 6 primeiros cards completas, com `naturalWidth > 0`.
- JS inicial após correção do WebGL: cerca de 210 KB transferidos; chunk Three/R3F carrega apenas após interação do usuário.

## Pendências reais

1. Executar o fluxo autenticado completo com credenciais reais: `PORTFOLIO_TEST_ADMIN_EMAIL` e `PORTFOLIO_TEST_ADMIN_PASSWORD` não estavam disponíveis e não havia storage state salvo em `admin/portfolio/.auth/admin.json`.
2. Ativar leaked password protection no Supabase Auth pelo dashboard, se desejado pela política de segurança.
3. Revisar advisors de performance herdados fora do escopo da landing/CMS Next.
4. Fazer a homologação visual final com o responsável pela marca antes de remover o export e o CMS Vite antigos.
5. Depois da homologação, remover os arquivos Framer/Vite legados e os scripts de compatibilidade em uma alteração separada e recuperável.

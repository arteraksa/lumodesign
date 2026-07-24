# RAKSA Design — plataforma Next.js

Aplicação pública e CMS administrativo reconstruídos com Next.js App Router, React, TypeScript, Tailwind CSS e Supabase.

## Requisitos

- Node.js 22 ou superior
- npm
- projeto Supabase com as migrations deste repositório aplicadas

## Configuração

```sh
cp .env.example .env.local
npm install
npm run dev
```

Acesse `http://localhost:3000`. O login administrativo fica em `http://localhost:3000/admin/login`.

Sem variáveis Supabase, a landing page usa um snapshot local dos cases para permitir desenvolvimento visual. Autenticação e operações administrativas permanecem indisponíveis até a configuração real — não há sessão ou permissão simulada.

## Comandos

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

## Estrutura

- `app/(site)`: rotas públicas e páginas de cases
- `app/admin`: login e CMS protegido
- `app/api/revalidate`: invalidação autenticada de cache
- `components`: primitives, navegação, motion e efeitos
- `sections`: seções da landing page
- `lib`: Supabase, autorização, queries e validação
- `supabase/migrations`: schema, RLS, storage e evolução dos cases
- `docs/nextjs-migration`: auditoria, arquitetura e relatório de validação

Consulte [a auditoria](docs/nextjs-migration/current-site-audit.md), [a arquitetura](docs/nextjs-migration/architecture.md) e [o relatório de validação](docs/nextjs-migration/validation-report.md).

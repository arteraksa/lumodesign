# Arquitetura Next.js alvo

```text
app/
  (site)/                 # home, listagem e detalhe públicos
  admin/                  # login e CMS protegido
  api/revalidate/         # webhook/endpoint interno de cache
components/
  effects/                # WebGL, cursor, parallax e fallbacks
  motion/                 # ilhas Framer Motion
  ui/                     # primitives compartilhadas
sections/                 # composição da landing page
lib/
  auth/                   # autorização administrativa
  queries/                # leituras server-side
  supabase/               # clientes browser/server e tipos
  validation/             # schemas Zod
supabase/migrations/      # schema, RLS e storage
```

Server Components são o padrão. Header mobile, accordions, formulários, motion e WebGL ficam em componentes client-side isolados. Leituras públicas não passam por endpoints internos; os Server Components consultam o Supabase diretamente. Mutações do CMS usam Server Actions, a sessão do usuário e RLS.

O cache público usa a tag `portfolio-cases`. Publicações feitas no CMS invalidam a tag e as rotas públicas; integrações externas podem chamar `POST /api/revalidate` com segredo de servidor.

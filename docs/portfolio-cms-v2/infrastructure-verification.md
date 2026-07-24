# Verificacao de infraestrutura e deploy

Data: 2026-07-10.

Modo: somente leitura. Nao foram criadas migrations, nao foi aplicado SQL, nao houve deploy e nao houve alteracao de dados remotos.

## Git e remotes

Branch local atual:

- `lumo`
- tracking: `arteraksa/lumo`
- commit local observado: `bfb6071`

Remotes configurados:

- `origin`: `https://github.com/omateusoso/raksa-site.git`
- `arteraksa`: `git@github.com-raksa:arteraksa/raksadesign.git`

Branches remotas observadas:

- `origin/main`
- `origin/mateus`
- `arteraksa/lumo`
- `arteraksa/main`
- `arteraksa/mateus`
- `arteraksa/codex/supabase-admin-integration`

## GitHub Pages

Confirmado via `gh api repos/arteraksa/raksadesign/pages`:

- repo: `arteraksa/raksadesign`
- Pages status: `built`
- build type: `legacy`
- source branch: `lumo`
- source path: `/`
- URL Pages: `https://arteraksa.github.io/raksadesign/`
- `custom_404`: `true`
- `cname`: `null`
- HTTPS enforced: `true`
- public: `true`

Confirmado via `gh api repos/omateusoso/raksa-site/pages`:

- repo legado/alternativo: `omateusoso/raksa-site`
- Pages status: `built`
- source branch: `main`
- URL Pages: `https://omateusoso.github.io/raksa-site/`
- `custom_404`: `true`
- `cname`: `null`

Conclusao: para este checkout na branch `lumo`, a producao GitHub Pages relevante e `arteraksa/raksadesign`, branch `lumo`, base path `/raksadesign`.

## Dominio publico e base path

Dominios testados via `curl -I -L`:

- `https://arteraksa.github.io/raksadesign/`: HTTP 200, servidor `GitHub.com`.
- `https://arteraksa.github.io/raksadesign/cases/leylaw/`: HTTP 200, servidor `GitHub.com`.
- `https://arteraksa.github.io/raksadesign/cases/slug-inexistente-audit/`: HTTP 404 com HTML customizado do repo, contendo markers `raksa-404-fallback`, `raksa-public-content` e `/raksadesign`.
- `https://raksadesign.com/`: HTTP 200, servidor `Framer/...`.
- `https://raksadesign.com/raksadesign/`: HTTP 404, servidor `Framer/...`.
- `https://raksadesign.com/raksadesign/cases/leylaw/`: HTTP 404, servidor `Framer/...`.

Conclusao:

- Para GitHub Pages deste repo, `/raksadesign` e o base path real.
- `raksadesign.com` nao esta apontando para o Pages deste repo nesta verificacao; responde pelo Framer direto e nao aceita `/raksadesign`.
- Nao ha `CNAME` no repositorio e a API Pages informa `cname: null`.
- Portanto, qualquer implementacao CMS v2 neste repo deve preservar `/raksadesign` ate haver troca explicita de dominio/hosting.

## Arquivos de deploy e CI/CD

Arquivos encontrados:

- `.nojekyll`

Arquivos nao encontrados no escopo `maxdepth 4`:

- `.github/workflows/*`
- `CNAME`
- `vercel.json`
- `netlify.toml`
- `wrangler.toml`
- `firebase.json`
- `.vercel/*`
- `.netlify/*`

Conclusao:

- Nao ha workflow CI/CD versionado no checkout.
- O deploy confirmado e GitHub Pages legacy, source branch `lumo`, path `/`.
- `.nojekyll` existe e e coerente com GitHub Pages, mas a confirmacao veio da API do GitHub Pages, nao apenas desse arquivo.

## Comportamento esperado para 404 e rotas profundas

No Pages confirmado:

- Rotas com diretorio real, como `/raksadesign/cases/leylaw/`, retornam HTTP 200.
- Rotas profundas inexistentes retornam HTTP 404, mas com o `404.html` customizado do repo.
- O `404.html` carrega `admin/supabase-config.js`, `scripts/raksa-routing.js` e `scripts/raksa-public-content.js`, permitindo que uma rota `/cases/<slug>/` inexistente tente renderizar dinamicamente em client-side.

Risco:

- SEO e status HTTP de cases dinamicos inexistentes continuam problemáticos: mesmo se o JS renderizar conteudo, o status inicial e 404.
- O servidor local `scripts/serve.mjs` nao simula exatamente o Pages: localmente ele retorna `cases/index.html` para `/cases/<slug>/` inexistente, enquanto o GitHub Pages retorna `404.html`.

## Evidencias operacionais usadas

Comandos somente leitura usados:

```bash
git remote -v
git branch -vv
git ls-remote --heads origin
git ls-remote --heads arteraksa
gh repo view arteraksa/raksadesign --json nameWithOwner,url,defaultBranchRef,homepageUrl,isPrivate
gh api repos/arteraksa/raksadesign/pages
curl -I -L https://arteraksa.github.io/raksadesign/
curl -I -L https://arteraksa.github.io/raksadesign/cases/leylaw/
curl -L -D - https://arteraksa.github.io/raksadesign/cases/slug-inexistente-audit/
```

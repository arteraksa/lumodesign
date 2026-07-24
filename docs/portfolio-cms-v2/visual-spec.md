# Especificacao visual de referencia - Leylaw

Referencia capturada sem alterar o visual atual:

- `docs/portfolio-cms-v2/screenshots/leylaw-1440x900.png`
- `docs/portfolio-cms-v2/screenshots/leylaw-1280x800.png`
- `docs/portfolio-cms-v2/screenshots/leylaw-810x1080.png`
- `docs/portfolio-cms-v2/screenshots/leylaw-390x844.png`
- Medicoes: `docs/portfolio-cms-v2/screenshots/leylaw-measurements.json`

URL local usada: `http://localhost:4173/raksadesign/cases/leylaw/`.

## Estrutura geral

O case Leylaw e uma pagina de portfolio escura, com layout principal em duas colunas nos viewports desktop/tablet e layout empilhado no mobile.

Background global: `rgb(5, 2, 13)` / token Framer `#05020D`.

Tipografia observada:

- Familias carregadas: Inter e Satoshi.
- Texto do case aparece em Inter/Satoshi via classes Framer.
- Titulos de secao no corpo: peso forte, cor branca.
- Corpo: branco com opacidade, leitura em coluna estreita.
- Badge: texto pequeno em roxo/azul, uppercase.

## Desktop 1440 x 900

Captura: `screenshots/leylaw-1440x900.png`.

Layout:

- Padding externo horizontal: 32 px na coluna esquerda; galeria inicia em x=464.
- Coluna/sidebar esquerda: x=32, largura 368 px.
- Gap entre sidebar e galeria: 64 px.
- Galeria direita: x=464, largura 944 px.
- Imagens com raio 12 px.
- Conteudo inicia em y=70 com badge.
- Botao website: x=32, y=102, largura 368 px, altura 31 px.
- Titulo/resumo principal: x=32, y=161, largura 368 px.

Comportamento:

- A coluna textual permanece visualmente fixa no topo enquanto a galeria rola; a medicao do viewport mostra muitos elementos abaixo do fold, mas a altura do documento reportada pelo Framer no desktop fica igual ao viewport. Deve ser tratado como efeito/scroll interno ou layout Framer com containers posicionados.
- A galeria forma uma lista vertical de imagens: primeira wide banner 944 x 148, depois imagens 944 x 531 com gap de 16 px.

## Desktop 1280 x 800

Captura: `screenshots/leylaw-1280x800.png`.

Layout:

- Sidebar: x=32, largura 320 px.
- Galeria: x=416, largura 832 px.
- Gap: 64 px.
- Botao website: 320 x 31.
- Imagens: banner 832 x 130; imagens principais 832 x 468.
- Raios: 12 px.

## Tablet 810 x 1080

Captura: `screenshots/leylaw-810x1080.png`.

Layout:

- Ainda usa duas colunas.
- Sidebar: x=32, largura 301 px.
- Galeria: x=397, largura 382 px.
- Gap: 64 px.
- Imagens: banner 382 x 60; imagens principais 382 x 215.
- Conteudo textual continua em coluna fixa estreita.

Breakpoint observado:

- Em 810 px ainda e layout de duas colunas.
- O breakpoint mobile entra abaixo de 810 px, coerente com CSS Framer `max-width: 809.98px`.

## Mobile 390 x 844

Captura: `screenshots/leylaw-390x844.png`.

Layout:

- Pagina empilhada e longa, scrollHeight medido: 3669 px.
- Padding horizontal: 20 px para texto; imagens usam x=16 e largura 358 px.
- Badge centralizado: x=167, y=130, largura 57 px.
- Botao website: x=20, y=166, largura 350 px, altura 31 px.
- Texto principal: x=20, largura 350 px.
- Galeria entra no fluxo por volta de y=490.
- Imagens principais: 358 x 201.
- Banner: 358 x 56.
- Raio das imagens: 12 px.

Comportamento:

- Nao ha sidebar sticky no mobile; conteudo e galeria entram no mesmo fluxo.
- A galeria aparece intercalada/posicionada por cima da altura textual em alguns pontos de medicao, portanto a implementacao nova deve validar visualmente para nao sobrepor texto e imagem.

## Componentes

### Badge

- Texto: `UI/UX Design`.
- Cor visual: roxo/azul da marca (`#5A3CFF` como token principal observado no HTML).
- Uppercase.
- Em desktop fica alinhado a esquerda da sidebar; em mobile fica centralizado.

### Botao Website

- Texto: `Acessar website`.
- Desktop: ocupa toda largura da sidebar.
- Mobile: ocupa quase toda largura da tela com margens de 20 px.
- Estilo Framer pill/botao com borda e hover roxo herdado de `raksa-public-content.js`.
- Link atual vindo do JSON: `https://leylaw.ai`.

### Corpo textual

Ordem observada:

1. Badge.
2. Botao `Acessar website`.
3. Titulo: `LeyLaw AI: Design de uma Plataforma de IA para Acesso à Justiça nos EUA`.
4. Secao `Sobre o Cliente`.
5. Paragrafo cliente.
6. Secao `O Desafio`.
7. Paragrafo desafio.
8. Bullets/linhas recuadas do desafio.
9. Secao solucao e subsecoes.

### Galeria

- Imagens com `border-radius: 12px`.
- Desktop/tablet: coluna direita independente, largura responsiva.
- Mobile: largura 358 px em viewport 390.
- Primeira imagem e banner curto; seguintes usam proporcao 16:9 aproximada.
- Fonte atual das imagens no DOM renderizado do case estatico e majoritariamente local `framerusercontent.com/images/...`, enquanto `admin/data/cases.json` aponta Leylaw para Supabase Storage. Essa divergencia precisa ser resolvida na migracao.

### Navegacao anterior/proximo

- No template dinamico, a area usa `Recomendação`, textos `Anterior` e `Próximo`, imagens de capa e botoes Framer clonados.
- Para Leylaw, por ser primeiro na ordenacao atual por `home_order/title`, pode nao haver anterior; slots vazios sao escondidos por `raksa-routing.js`.

## Animacoes

- HTML Framer usa atributos `data-framer-appear-id`, opacity inicial e transforms.
- `raksa-public-content.js` reanima elementos dinamicos com Web Animations:
  - `animateTemplateAppear`: translateY para 0, opacity 0 -> 1, duracao 820 ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Delay escalonado ate 260 ms.
- Novo renderer deve respeitar `prefers-reduced-motion`; a implementacao atual nao demonstra uma alternativa clara para todos os patches dinamicos.

## Breakpoints

Breakpoints do HTML Leylaw:

- `min-width: 1440px`
- `min-width: 1024px and max-width: 1439.98px`
- `min-width: 810px and max-width: 1023.98px`
- `max-width: 809.98px`

Regra de paridade para CMS v2:

- 810 px ainda deve ser duas colunas.
- 809 px e abaixo deve ser mobile empilhado.
- Manter sidebar entre 301 e 368 px nos viewports auditados.
- Manter gap desktop/tablet proximo de 64 px.
- Manter raio de galeria em 12 px.

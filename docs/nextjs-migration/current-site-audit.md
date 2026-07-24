# Auditoria do site atual e baseline da migração Next.js

Data da auditoria: 17 de julho de 2026.

## Estado técnico encontrado

O checkout é uma arquitetura híbrida formada por:

1. `index.html` e páginas em `cases/` exportadas pelo Framer;
2. scripts locais que reescrevem rotas e injetam conteúdo público do Supabase;
3. um CMS React/Vite isolado em `admin/portfolio`;
4. tabelas `portfolio_cases`, `portfolio_case_media` e `portfolio_case_slug_history` com RLS;
5. buckets `portfolio-drafts` (privado) e `portfolio-media` (público), além do bucket legado `case-images`.

O HTML inicial da home tem aproximadamente 1,1 MB e carrega wrappers, classes, bundles e hidratação próprios do Framer. O diretório `framerusercontent.com` soma aproximadamente 89 MB e 614 imagens/SVGs.

## Baseline visual

- Marca/conteúdo visível no export: RAKSA.
- Fundo principal: quase preto azulado (`#05020d`).
- Cor de ação: violeta (`#5a3cff`).
- Tipografia principal: Satoshi, com pesos 300 a 900.
- Largura útil: aproximadamente 1.200 px no desktop.
- Breakpoints observados: 810, 1.280 e 1.440 px.
- Cards: cantos de aproximadamente 16 px e bordas violeta de baixa opacidade.
- Material de vidro: restrito ao header e a superfícies de navegação.

## Seções e conteúdo

### Header

Logo, links Home, Serviços, Cases e FAQ, além do CTA “Entre em contato”. No mobile, o menu vira um controle compacto.

### Hero

Título “Seu design pode ser mais Inteligente”, texto “A Raksa oferece serviços de design com o que tem de mais novo no mercado. Venha inovar com a gente.” e CTA “Fazer um orçamento”. O fundo atual combina vídeo/efeito líquido e um carrossel de marcas.

### Serviços

Título “Impulsionando Marcas com Design e Estratégia Digital”, texto introdutório e seis serviços: UI/UX Design, Social Media Design, Materiais Gráficos, Editoração, Redesign Estratégico e Identidade Visual.

### Cases

Título “O Futuro do Design em nossos cases”, subtítulo “Confira algumas de nossas criações”, grade de nove cases publicados e CTA “Ver todos os cases”. A fonte atual é `portfolio_cases`, com mídia em `portfolio_case_media` e compatibilidade com `case-images`.

### Processo, diferenciais e sobre

O export não possui uma seção “Sobre” autônoma. A narrativa institucional está concentrada em “Agilidade que transforma ideias em realidade” e nos blocos Qualidade Premium, AI Power, Foco em Resultados, Inovação Constante, Desburocratização, Criatividade Otimizada, Custo-Benefício e “+200 negócios acelerados”. Na reconstrução, esses conteúdos serão preservados semanticamente e organizados como Processo/Sobre sem adicionar nova direção de arte.

### FAQ

Cinco perguntas em accordion sobre modelo de agência, uso de IA, serviços, contratação e atendimento remoto.

### Contato e footer

E-mail `contato@raksadesign.com`, WhatsApp `(51) 98115.9150`, Instagram, Facebook e LinkedIn. O footer contém marca, copyright e atalhos sociais.

## Assets selecionados para a primeira paridade

- seis imagens existentes de serviços;
- capas dos cases publicadas no Supabase;
- três pesos locais da fonte Satoshi;
- logotipos de clientes do hero;
- fallback líquido em CSS e efeito WebGL carregado sob demanda.

Os bundles, scripts, classes e wrappers do Framer não serão reutilizados.

## Efeitos e comportamento

- entrada do header e do hero;
- título com revelação por palavras;
- reveal de seções conforme viewport;
- hover com escala/overlay em serviços e cases;
- gradiente/depth violeta no plano de fundo;
- efeito líquido/WebGL no hero;
- accordions na FAQ;
- header sticky com material translúcido.

## Problemas objetivos do legado

| Dimensão | Nota | Evidência principal |
| --- | ---: | --- |
| Acessibilidade | 2/4 | headings duplicados, imagens decorativas sem descrição e conteúdo oculto com reduced motion |
| Performance | 1/4 | HTML de 1,1 MB, 89 MB de assets e bundles Framer globais |
| Responsivo | 3/4 | os quatro breakpoints funcionam, mas o mobile fica excessivamente longo |
| Theming | 1/4 | tokens existem dentro do export, porém estão misturados com milhares de valores gerados |
| Anti-patterns | 3/4 | identidade consistente; glass e cards são usados com função clara |
| **Total** | **10/20** | base visual boa, implementação técnica precisa de substituição completa |

### Prioridades de migração

1. Garantir conteúdo visível sem JavaScript e com `prefers-reduced-motion`.
2. Tornar a home uma composição de Server Components e ilhas client-side pequenas.
3. Buscar cases publicados no servidor e revalidar por tag.
4. Consolidar Auth, CRUD e uploads no App Router sem service role.
5. Manter o legado disponível até a validação visual, funcional e de dados.

## Critérios de paridade

- mesmos textos, CTA, contatos, serviços e nove cases em destaque;
- mesma família tipográfica, escala aproximada, fundo e violeta da marca;
- mesma sequência narrativa e densidade por viewport;
- navegação e accordions operáveis por teclado;
- conteúdo principal renderizado no servidor;
- animações opcionais e nunca responsáveis pela visibilidade do conteúdo;
- fallback visual funcional sem WebGL.

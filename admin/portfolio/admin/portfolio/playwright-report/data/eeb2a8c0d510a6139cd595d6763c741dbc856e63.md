# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portfolio-cms-real.spec.ts >> Portfolio CMS v2 real stability audit >> cria draft descartavel e valida autosave real
- Location: admin/portfolio/e2e/portfolio-cms-real.spec.ts:34:3

# Error details

```
Error: locator.check: Error: strict mode violation: getByLabel('Branding') resolved to 2 elements:
    1) <select>…</select> aka getByLabel('CategoriaTodasBrandingDesenvolvimentoEditorialUI/UX Design')
    2) <input type="checkbox"/> aka getByRole('checkbox', { name: 'Branding' })

Call log:
  - waiting for getByLabel('Branding')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "Portfolio CMS" [level=1] [ref=e7]
        - generic [ref=e8]: 39 cases
      - generic [ref=e9]:
        - button "Novo case" [ref=e10] [cursor=pointer]:
          - img [ref=e11]
        - button "Sair" [ref=e12] [cursor=pointer]:
          - img [ref=e13]
    - generic [ref=e16]:
      - img [ref=e17]
      - textbox [ref=e20]:
        - /placeholder: Buscar titulo, slug, categoria
    - generic [ref=e21]:
      - generic [ref=e22]:
        - text: Status
        - combobox "Status" [ref=e23]:
          - option "Todos" [selected]
          - option "Published"
          - option "Draft"
          - option "Archived"
      - generic [ref=e24]:
        - text: Categoria
        - combobox "Categoria" [ref=e25]:
          - option "Todas" [selected]
          - option "Branding"
          - option "Desenvolvimento"
          - option "Editorial"
          - option "UI/UX Design"
      - generic [ref=e26]:
        - text: Ordem
        - combobox "Ordem" [ref=e27]:
          - option "Portfolio" [selected]
          - option "Home"
          - option "Atualizacao"
          - option "Titulo"
          - option "Status"
    - generic [ref=e28]:
      - button "Leylaw leylaw published home UI/UX Design 01/06/2026" [ref=e29] [cursor=pointer]:
        - generic [ref=e30]:
          - strong [ref=e31]: Leylaw
          - generic [ref=e32]: leylaw
          - generic [ref=e33]:
            - emphasis [ref=e34]: published
            - emphasis [ref=e35]: home
        - generic [ref=e36]:
          - generic [ref=e37]: UI/UX Design
          - generic [ref=e38]: 01/06/2026
      - button "Atitus Educação atitus-educação published home UI/UX Design, Desenvolvimento, Branding, Editorial 28/05/2026" [ref=e39] [cursor=pointer]:
        - generic [ref=e40]:
          - strong [ref=e41]: Atitus Educação
          - generic [ref=e42]: atitus-educação
          - generic [ref=e43]:
            - emphasis [ref=e44]: published
            - emphasis [ref=e45]: home
        - generic [ref=e46]:
          - generic [ref=e47]: UI/UX Design, Desenvolvimento, Branding, Editorial
          - generic [ref=e48]: 28/05/2026
      - button "Valor Capital Group valor-capital-group published home UI/UX Design 28/05/2026" [ref=e49] [cursor=pointer]:
        - generic [ref=e50]:
          - strong [ref=e51]: Valor Capital Group
          - generic [ref=e52]: valor-capital-group
          - generic [ref=e53]:
            - emphasis [ref=e54]: published
            - emphasis [ref=e55]: home
        - generic [ref=e56]:
          - generic [ref=e57]: UI/UX Design
          - generic [ref=e58]: 28/05/2026
      - button "Vexo vexo published home UI/UX Design, Branding 01/06/2026" [ref=e59] [cursor=pointer]:
        - generic [ref=e60]:
          - strong [ref=e61]: Vexo
          - generic [ref=e62]: vexo
          - generic [ref=e63]:
            - emphasis [ref=e64]: published
            - emphasis [ref=e65]: home
        - generic [ref=e66]:
          - generic [ref=e67]: UI/UX Design, Branding
          - generic [ref=e68]: 01/06/2026
      - button "Eric Clapton eric-clapton published home UI/UX Design, Desenvolvimento 01/06/2026" [ref=e69] [cursor=pointer]:
        - generic [ref=e70]:
          - strong [ref=e71]: Eric Clapton
          - generic [ref=e72]: eric-clapton
          - generic [ref=e73]:
            - emphasis [ref=e74]: published
            - emphasis [ref=e75]: home
        - generic [ref=e76]:
          - generic [ref=e77]: UI/UX Design, Desenvolvimento
          - generic [ref=e78]: 01/06/2026
      - button "Candy Dates candy-dates published home UI/UX Design, Desenvolvimento 28/05/2026" [ref=e79] [cursor=pointer]:
        - generic [ref=e80]:
          - strong [ref=e81]: Candy Dates
          - generic [ref=e82]: candy-dates
          - generic [ref=e83]:
            - emphasis [ref=e84]: published
            - emphasis [ref=e85]: home
        - generic [ref=e86]:
          - generic [ref=e87]: UI/UX Design, Desenvolvimento
          - generic [ref=e88]: 28/05/2026
      - button "Tri RS tri-rs published home UI/UX Design 01/06/2026" [ref=e89] [cursor=pointer]:
        - generic [ref=e90]:
          - strong [ref=e91]: Tri RS
          - generic [ref=e92]: tri-rs
          - generic [ref=e93]:
            - emphasis [ref=e94]: published
            - emphasis [ref=e95]: home
        - generic [ref=e96]:
          - generic [ref=e97]: UI/UX Design
          - generic [ref=e98]: 01/06/2026
      - button "Vallor vallor published home UI/UX Design, Desenvolvimento 01/06/2026" [ref=e99] [cursor=pointer]:
        - generic [ref=e100]:
          - strong [ref=e101]: Vallor
          - generic [ref=e102]: vallor
          - generic [ref=e103]:
            - emphasis [ref=e104]: published
            - emphasis [ref=e105]: home
        - generic [ref=e106]:
          - generic [ref=e107]: UI/UX Design, Desenvolvimento
          - generic [ref=e108]: 01/06/2026
      - button "Impresul impresul published home Branding, Editorial 28/05/2026" [ref=e109] [cursor=pointer]:
        - generic [ref=e110]:
          - strong [ref=e111]: Impresul
          - generic [ref=e112]: impresul
          - generic [ref=e113]:
            - emphasis [ref=e114]: published
            - emphasis [ref=e115]: home
        - generic [ref=e116]:
          - generic [ref=e117]: Branding, Editorial
          - generic [ref=e118]: 28/05/2026
      - button "Anima+ anima published UI/UX Design, Branding 28/05/2026" [ref=e119] [cursor=pointer]:
        - generic [ref=e120]:
          - strong [ref=e121]: Anima+
          - generic [ref=e122]: anima
          - emphasis [ref=e124]: published
        - generic [ref=e125]:
          - generic [ref=e126]: UI/UX Design, Branding
          - generic [ref=e127]: 28/05/2026
      - button "Banrisul | App Redesign banrisul-app-redesign published UI/UX Design 28/05/2026" [ref=e128] [cursor=pointer]:
        - generic [ref=e129]:
          - strong [ref=e130]: Banrisul | App Redesign
          - generic [ref=e131]: banrisul-app-redesign
          - emphasis [ref=e133]: published
        - generic [ref=e134]:
          - generic [ref=e135]: UI/UX Design
          - generic [ref=e136]: 28/05/2026
      - button "BU1LD bu1ld published UI/UX Design, Desenvolvimento 28/05/2026" [ref=e137] [cursor=pointer]:
        - generic [ref=e138]:
          - strong [ref=e139]: BU1LD
          - generic [ref=e140]: bu1ld
          - emphasis [ref=e142]: published
        - generic [ref=e143]:
          - generic [ref=e144]: UI/UX Design, Desenvolvimento
          - generic [ref=e145]: 28/05/2026
      - button "Calendário Impresul 2023 calendário-impresul-2023 published Editorial 28/05/2026" [ref=e146] [cursor=pointer]:
        - generic [ref=e147]:
          - strong [ref=e148]: Calendário Impresul 2023
          - generic [ref=e149]: calendário-impresul-2023
          - emphasis [ref=e151]: published
        - generic [ref=e152]:
          - generic [ref=e153]: Editorial
          - generic [ref=e154]: 28/05/2026
      - button "Calendário Impresul 2024 calendário-impresul-2024 published Editorial 28/05/2026" [ref=e155] [cursor=pointer]:
        - generic [ref=e156]:
          - strong [ref=e157]: Calendário Impresul 2024
          - generic [ref=e158]: calendário-impresul-2024
          - emphasis [ref=e160]: published
        - generic [ref=e161]:
          - generic [ref=e162]: Editorial
          - generic [ref=e163]: 28/05/2026
      - button "Click Impresso click-impresso published Branding, Editorial 28/05/2026" [ref=e164] [cursor=pointer]:
        - generic [ref=e165]:
          - strong [ref=e166]: Click Impresso
          - generic [ref=e167]: click-impresso
          - emphasis [ref=e169]: published
        - generic [ref=e170]:
          - generic [ref=e171]: Branding, Editorial
          - generic [ref=e172]: 28/05/2026
      - button "Definna definna published UI/UX Design, Desenvolvimento 28/05/2026" [ref=e173] [cursor=pointer]:
        - generic [ref=e174]:
          - strong [ref=e175]: Definna
          - generic [ref=e176]: definna
          - emphasis [ref=e178]: published
        - generic [ref=e179]:
          - generic [ref=e180]: UI/UX Design, Desenvolvimento
          - generic [ref=e181]: 28/05/2026
      - button "Digital Marketing digital-marketing published UI/UX Design 28/05/2026" [ref=e182] [cursor=pointer]:
        - generic [ref=e183]:
          - strong [ref=e184]: Digital Marketing
          - generic [ref=e185]: digital-marketing
          - emphasis [ref=e187]: published
        - generic [ref=e188]:
          - generic [ref=e189]: UI/UX Design
          - generic [ref=e190]: 28/05/2026
      - button "Lisa Dossi lisa-dossi published UI/UX Design 28/05/2026" [ref=e191] [cursor=pointer]:
        - generic [ref=e192]:
          - strong [ref=e193]: Lisa Dossi
          - generic [ref=e194]: lisa-dossi
          - emphasis [ref=e196]: published
        - generic [ref=e197]:
          - generic [ref=e198]: UI/UX Design
          - generic [ref=e199]: 28/05/2026
      - button "Magnus magnus published UI/UX Design 28/05/2026" [ref=e200] [cursor=pointer]:
        - generic [ref=e201]:
          - strong [ref=e202]: Magnus
          - generic [ref=e203]: magnus
          - emphasis [ref=e205]: published
        - generic [ref=e206]:
          - generic [ref=e207]: UI/UX Design
          - generic [ref=e208]: 28/05/2026
      - button "Morangos Mofados morangos-mofados published Editorial 28/05/2026" [ref=e209] [cursor=pointer]:
        - generic [ref=e210]:
          - strong [ref=e211]: Morangos Mofados
          - generic [ref=e212]: morangos-mofados
          - emphasis [ref=e214]: published
        - generic [ref=e215]:
          - generic [ref=e216]: Editorial
          - generic [ref=e217]: 28/05/2026
      - button "Nina nina published UI/UX Design 28/05/2026" [ref=e218] [cursor=pointer]:
        - generic [ref=e219]:
          - strong [ref=e220]: Nina
          - generic [ref=e221]: nina
          - emphasis [ref=e223]: published
        - generic [ref=e224]:
          - generic [ref=e225]: UI/UX Design
          - generic [ref=e226]: 28/05/2026
      - button "Plataforma EAD plataforma-ead published UI/UX Design, Branding 28/05/2026" [ref=e227] [cursor=pointer]:
        - generic [ref=e228]:
          - strong [ref=e229]: Plataforma EAD
          - generic [ref=e230]: plataforma-ead
          - emphasis [ref=e232]: published
        - generic [ref=e233]:
          - generic [ref=e234]: UI/UX Design, Branding
          - generic [ref=e235]: 28/05/2026
      - button "Portal do Aluno UFRGS portal-do-aluno-ufrgs published UI/UX Design 28/05/2026" [ref=e236] [cursor=pointer]:
        - generic [ref=e237]:
          - strong [ref=e238]: Portal do Aluno UFRGS
          - generic [ref=e239]: portal-do-aluno-ufrgs
          - emphasis [ref=e241]: published
        - generic [ref=e242]:
          - generic [ref=e243]: UI/UX Design
          - generic [ref=e244]: 28/05/2026
      - button "Restiview restiview published Branding, Editorial 28/05/2026" [ref=e245] [cursor=pointer]:
        - generic [ref=e246]:
          - strong [ref=e247]: Restiview
          - generic [ref=e248]: restiview
          - emphasis [ref=e250]: published
        - generic [ref=e251]:
          - generic [ref=e252]: Branding, Editorial
          - generic [ref=e253]: 28/05/2026
      - button "Workshop de Mentor[IA] workshop-de-mentor-ia published UI/UX Design, Branding 28/05/2026" [ref=e254] [cursor=pointer]:
        - generic [ref=e255]:
          - strong [ref=e256]: Workshop de Mentor[IA]
          - generic [ref=e257]: workshop-de-mentor-ia
          - emphasis [ref=e259]: published
        - generic [ref=e260]:
          - generic [ref=e261]: UI/UX Design, Branding
          - generic [ref=e262]: 28/05/2026
      - button "A Primeira Segunda-Feira a-primeira-segunda-feira published UI/UX Design 28/05/2026" [ref=e263] [cursor=pointer]:
        - generic [ref=e264]:
          - strong [ref=e265]: A Primeira Segunda-Feira
          - generic [ref=e266]: a-primeira-segunda-feira
          - emphasis [ref=e268]: published
        - generic [ref=e269]:
          - generic [ref=e270]: UI/UX Design
          - generic [ref=e271]: 28/05/2026
      - button "Capri Housing capri-housing published UI/UX Design 28/05/2026" [ref=e272] [cursor=pointer]:
        - generic [ref=e273]:
          - strong [ref=e274]: Capri Housing
          - generic [ref=e275]: capri-housing
          - emphasis [ref=e277]: published
        - generic [ref=e278]:
          - generic [ref=e279]: UI/UX Design
          - generic [ref=e280]: 28/05/2026
      - button "DEMIP demip published Branding, Editorial 28/05/2026" [ref=e281] [cursor=pointer]:
        - generic [ref=e282]:
          - strong [ref=e283]: DEMIP
          - generic [ref=e284]: demip
          - emphasis [ref=e286]: published
        - generic [ref=e287]:
          - generic [ref=e288]: Branding, Editorial
          - generic [ref=e289]: 28/05/2026
      - button "LumiLab lumilab published UI/UX Design 28/05/2026" [ref=e290] [cursor=pointer]:
        - generic [ref=e291]:
          - strong [ref=e292]: LumiLab
          - generic [ref=e293]: lumilab
          - emphasis [ref=e295]: published
        - generic [ref=e296]:
          - generic [ref=e297]: UI/UX Design
          - generic [ref=e298]: 28/05/2026
      - button "Vacinas | Infográfico vacinas-infográfico published Editorial 29/05/2026" [ref=e299] [cursor=pointer]:
        - generic [ref=e300]:
          - strong [ref=e301]: Vacinas | Infográfico
          - generic [ref=e302]: vacinas-infográfico
          - emphasis [ref=e304]: published
        - generic [ref=e305]:
          - generic [ref=e306]: Editorial
          - generic [ref=e307]: 29/05/2026
      - button "Blenduca blenduca published UI/UX Design, Desenvolvimento, Branding, Editorial 01/06/2026" [ref=e308] [cursor=pointer]:
        - generic [ref=e309]:
          - strong [ref=e310]: Blenduca
          - generic [ref=e311]: blenduca
          - emphasis [ref=e313]: published
        - generic [ref=e314]:
          - generic [ref=e315]: UI/UX Design, Desenvolvimento, Branding, Editorial
          - generic [ref=e316]: 01/06/2026
      - button "Dark Star dark-star published UI/UX Design, Desenvolvimento, Branding, Editorial 01/06/2026" [ref=e317] [cursor=pointer]:
        - generic [ref=e318]:
          - strong [ref=e319]: Dark Star
          - generic [ref=e320]: dark-star
          - emphasis [ref=e322]: published
        - generic [ref=e323]:
          - generic [ref=e324]: UI/UX Design, Desenvolvimento, Branding, Editorial
          - generic [ref=e325]: 01/06/2026
      - button "JAQ H2 jaq-h2 published UI/UX Design, Desenvolvimento, Branding, Editorial 01/06/2026" [ref=e326] [cursor=pointer]:
        - generic [ref=e327]:
          - strong [ref=e328]: JAQ H2
          - generic [ref=e329]: jaq-h2
          - emphasis [ref=e331]: published
        - generic [ref=e332]:
          - generic [ref=e333]: UI/UX Design, Desenvolvimento, Branding, Editorial
          - generic [ref=e334]: 01/06/2026
      - button "Paula and Domenick paula-and-domenick published UI/UX Design, Desenvolvimento, Branding 01/06/2026" [ref=e335] [cursor=pointer]:
        - generic [ref=e336]:
          - strong [ref=e337]: Paula and Domenick
          - generic [ref=e338]: paula-and-domenick
          - emphasis [ref=e340]: published
        - generic [ref=e341]:
          - generic [ref=e342]: UI/UX Design, Desenvolvimento, Branding
          - generic [ref=e343]: 01/06/2026
      - button "Polvilho do Dado polvilho published UI/UX Design, Desenvolvimento 01/06/2026" [ref=e344] [cursor=pointer]:
        - generic [ref=e345]:
          - strong [ref=e346]: Polvilho do Dado
          - generic [ref=e347]: polvilho
          - emphasis [ref=e349]: published
        - generic [ref=e350]:
          - generic [ref=e351]: UI/UX Design, Desenvolvimento
          - generic [ref=e352]: 01/06/2026
      - button "Você Marca voce-marca published UI/UX Design 01/06/2026" [ref=e353] [cursor=pointer]:
        - generic [ref=e354]:
          - strong [ref=e355]: Você Marca
          - generic [ref=e356]: voce-marca
          - emphasis [ref=e358]: published
        - generic [ref=e359]:
          - generic [ref=e360]: UI/UX Design
          - generic [ref=e361]: 01/06/2026
      - button "test-cms-ux-public-fix test-cms-ux-public-fix draft Branding 14/07/2026" [ref=e362] [cursor=pointer]:
        - generic [ref=e363]:
          - strong [ref=e364]: test-cms-ux-public-fix
          - generic [ref=e365]: test-cms-ux-public-fix
          - emphasis [ref=e367]: draft
        - generic [ref=e368]:
          - generic [ref=e369]: Branding
          - generic [ref=e370]: 14/07/2026
      - button "Teste Integração Pública test-cms-public-integration draft Branding 12/07/2026" [ref=e371] [cursor=pointer]:
        - generic [ref=e372]:
          - strong [ref=e373]: Teste Integração Pública
          - generic [ref=e374]: test-cms-public-integration
          - emphasis [ref=e376]: draft
        - generic [ref=e377]:
          - generic [ref=e378]: Branding
          - generic [ref=e379]: 12/07/2026
      - button "Novo case novo-case-406cc8db draft sem categoria 11/07/2026" [ref=e380] [cursor=pointer]:
        - generic [ref=e381]:
          - strong [ref=e382]: Novo case
          - generic [ref=e383]: novo-case-406cc8db
          - emphasis [ref=e385]: draft
        - generic [ref=e386]:
          - generic [ref=e387]: sem categoria
          - generic [ref=e388]: 11/07/2026
  - main [ref=e389]:
    - generic [ref=e390]:
      - generic [ref=e391]:
        - heading "Portfolio CMS E2E inicial" [level=2] [ref=e392]
        - text: draftAlteracoes nao salvas
      - generic [ref=e393]:
        - button "Preview" [ref=e394] [cursor=pointer]:
          - img [ref=e395]
          - text: Preview
        - button "Salvar rascunho" [ref=e398] [cursor=pointer]:
          - img [ref=e399]
          - text: Salvar rascunho
        - button "Publicar" [ref=e403] [cursor=pointer]:
          - img [ref=e404]
          - text: Publicar
        - button "Arquivar" [ref=e407] [cursor=pointer]:
          - img [ref=e408]
          - text: Arquivar
    - navigation "Secoes do editor" [ref=e411]:
      - button "geral" [ref=e412] [cursor=pointer]
      - button "conteudo" [ref=e413] [cursor=pointer]
      - button "capa" [ref=e414] [cursor=pointer]
      - button "galeria" [ref=e415] [cursor=pointer]
      - button "organizacao" [ref=e416] [cursor=pointer]
      - button "seo" [ref=e417] [cursor=pointer]
      - button "historico" [ref=e418] [cursor=pointer]
      - button "preview" [ref=e419] [cursor=pointer]
    - generic [ref=e420]:
      - generic [ref=e421]:
        - text: Titulo
        - textbox "Titulo" [ref=e422]: Portfolio CMS E2E inicial
      - generic [ref=e423]:
        - text: Slug
        - textbox "Slug /cases/test-cms-e2e-1784668083825/" [ref=e425]: test-cms-e2e-1784668083825
        - generic [ref=e426]: /cases/test-cms-e2e-1784668083825/
      - generic [ref=e427]:
        - text: Status
        - combobox "Status Status muda por Publicar, Atualizar publicacao, Despublicar, Arquivar ou Restaurar." [disabled] [ref=e428]:
          - option "draft" [selected]
          - option "published"
          - option "archived"
        - generic [ref=e429]: Status muda por Publicar, Atualizar publicacao, Despublicar, Arquivar ou Restaurar.
      - generic [ref=e430]:
        - text: Resumo
        - textbox "Resumo" [active] [ref=e431]: Case descartavel usado somente pela auditoria Playwright do CMS.
      - generic [ref=e432]:
        - text: Website
        - textbox "Website" [ref=e433]
      - group "Categorias" [ref=e434]:
        - generic [ref=e435]: Categorias
        - generic [ref=e436]:
          - checkbox "Branding" [ref=e437]
          - text: Branding
        - generic [ref=e438]:
          - checkbox "Desenvolvimento" [ref=e439]
          - text: Desenvolvimento
        - generic [ref=e440]:
          - checkbox "Editorial" [ref=e441]
          - text: Editorial
        - generic [ref=e442]:
          - checkbox "UI/UX Design" [ref=e443]
          - text: UI/UX Design
    - complementary "Mensagens do sistema"
```

# Test source

```ts
  89  |     await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", "published", { timeout: 30_000 });
  90  |     await expect(page.getByTestId("operation-notice")).toContainText(/publicado com sucesso/i);
  91  |     expect(telemetry.publicationUpdates(), "publicacao duplicada").toHaveLength(1);
  92  |     expect(await visibleToastCount(page, /Case publicado|Publicacao atualizada/), "toast unico de publicacao").toBe(1);
  93  | 
  94  |     const published = await dbGetCase(caseId);
  95  |     expect(published.status).toBe("published");
  96  |     expect(published.published_at).toBeTruthy();
  97  |     initialPublishedAt = String(published.published_at);
  98  |     initialVersion = Number(published.version);
  99  | 
  100 |     await telemetry.reset("published-edit");
  101 |     await page.getByTestId("case-title").fill(`Portfolio CMS E2E publicado ${Date.now()}`);
  102 |     await expect(page.locator(".save-state")).toContainText("Alteracoes nao publicadas");
  103 |     await page.waitForTimeout(3_000);
  104 |     expect(telemetry.caseUpdates(), "published nao pode autosalvar").toHaveLength(0);
  105 | 
  106 |     await telemetry.reset("update-publication");
  107 |     await page.getByTestId("update-publication").click();
  108 |     await expect(page.getByTestId("update-publication")).toBeDisabled();
  109 |     await page.getByTestId("update-publication").click({ force: true }).catch(() => undefined);
  110 |     await expect(page.getByTestId("operation-notice")).toContainText(/atualizada com sucesso/i, { timeout: 30_000 });
  111 |     expect(telemetry.publicationUpdates(), "atualizacao duplicada").toHaveLength(1);
  112 |     expect(await visibleToastCount(page, /Publicacao atualizada/), "toast unico de atualizacao").toBe(1);
  113 | 
  114 |     const updated = await dbGetCase(caseId);
  115 |     expect(updated.status).toBe("published");
  116 |     expect(updated.published_at).toBe(initialPublishedAt);
  117 |     expect(Number(updated.version)).toBeGreaterThan(initialVersion);
  118 | 
  119 |     await validatePublicCase(page, String(updated.title));
  120 |   });
  121 | 
  122 |   test("reconcilia resposta incerta sem travar estados", async ({ page }) => {
  123 |     await openCase(page);
  124 |     await page.getByTestId("case-title").fill(`Portfolio CMS E2E reconciliado ${Date.now()}`);
  125 | 
  126 |     let blocked = false;
  127 |     await page.route("**/rest/v1/portfolio_cases?**", async (route) => {
  128 |       const request = route.request();
  129 |       if (!blocked && request.method() === "PATCH" && (request.postData() || "").includes("\"status\":\"published\"")) {
  130 |         blocked = true;
  131 |         await route.abort("failed");
  132 |         return;
  133 |       }
  134 |       await route.continue();
  135 |     });
  136 | 
  137 |     await telemetry.reset("uncertain-update");
  138 |     await page.getByTestId("update-publication").click();
  139 |     await expect(page.getByTestId("operation-notice")).toContainText(/Nao foi possivel|Erro|confirmar|atualizada/i, { timeout: 30_000 });
  140 |     await page.unroute("**/rest/v1/portfolio_cases?**");
  141 |     await expect(page.getByText(/Publicando|Atualizando|Salvando|Reconciliando/)).toHaveCount(0, { timeout: 12_000 });
  142 | 
  143 |     const row = await dbGetCase(caseId);
  144 |     expect(["published", "draft", "archived"]).toContain(row.status);
  145 |     await page.reload();
  146 |     await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", String(row.status));
  147 |   });
  148 | 
  149 |   test("modais, toasts e limpeza do case descartavel", async ({ page }) => {
  150 |     await openCase(page);
  151 |     await page.getByTestId("case-title").fill(`Portfolio CMS E2E modal ${Date.now()}`);
  152 |     await page.getByTestId("create-case").click();
  153 |     await page.getByRole("button", { name: "Cancel" }).click().catch(() => undefined);
  154 |     await assertNoBlockingOverlay(page);
  155 | 
  156 |     page.once("dialog", async (dialog) => {
  157 |       expect(dialog.message()).toContain("Arquivar");
  158 |       await dialog.dismiss();
  159 |     });
  160 |     await page.getByTestId("archive-case").click();
  161 |     await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", "published");
  162 |     await assertNoBlockingOverlay(page);
  163 | 
  164 |     page.once("dialog", async (dialog) => {
  165 |       expect(dialog.message()).toContain("Arquivar");
  166 |       await dialog.accept();
  167 |     });
  168 |     await page.getByTestId("archive-case").click();
  169 |     await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", "archived", { timeout: 30_000 });
  170 |     const row = await dbGetCase(caseId);
  171 |     expect(row.status).toBe("archived");
  172 |   });
  173 | });
  174 | 
  175 | async function openCms(page: Page) {
  176 |   await page.goto(cmsUrl);
  177 |   await expect(page.getByTestId("create-case")).toBeVisible({ timeout: 30_000 });
  178 | }
  179 | 
  180 | async function openCase(page: Page) {
  181 |   await page.goto(`${cmsUrl}cases/${caseId}`);
  182 |   await expect(page.getByTestId("case-editor")).toBeVisible({ timeout: 30_000 });
  183 | }
  184 | 
  185 | async function fillMinimumDraft(page: Page, title: string) {
  186 |   await page.getByTestId("case-title").fill(title);
  187 |   await page.getByTestId("case-slug").fill(slug);
  188 |   await page.getByTestId("case-excerpt").fill("Case descartavel usado somente pela auditoria Playwright do CMS.");
> 189 |   await page.getByLabel("Branding").check();
      |                                     ^ Error: locator.check: Error: strict mode violation: getByLabel('Branding') resolved to 2 elements:
  190 |   await page.getByRole("button", { name: "conteudo" }).click();
  191 |   await page.locator('[data-testid="case-content-editor"] .ProseMirror').click();
  192 |   await page.keyboard.type("Conteudo real do case descartavel para publicar e validar o fluxo publico.");
  193 |   await page.getByRole("button", { name: "capa" }).click();
  194 |   await page.getByLabel("URL da capa").fill(coverUrl);
  195 | }
  196 | 
  197 | async function saveDraft(page: Page) {
  198 |   await page.getByRole("button", { name: "geral" }).click();
  199 |   const save = page.getByTestId("save-draft");
  200 |   if (await save.isEnabled()) await save.click();
  201 |   await expect(page.getByTestId("operation-notice")).toContainText(/Rascunho salvo|Autosave concluido|Salvo/i, { timeout: 20_000 });
  202 | }
  203 | 
  204 | async function uploadGalleryImage(page: Page) {
  205 |   const png = Buffer.from(
  206 |     "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lm8rJAAAAABJRU5ErkJggg==",
  207 |     "base64",
  208 |   );
  209 |   await page.getByLabel("Upload multiplo").setInputFiles({ name: "portfolio-cms-e2e.png", mimeType: "image/png", buffer: png });
  210 |   await expect(page.getByText(/Uploads finalizados/i)).toBeVisible({ timeout: 30_000 });
  211 | }
  212 | 
  213 | async function validatePublicCase(page: Page, expectedTitle: string) {
  214 |   for (const width of [390, 810, 1440]) {
  215 |     await page.setViewportSize({ width, height: 900 });
  216 |     await page.goto(publicUrl);
  217 |     await expect(page.getByText(expectedTitle).first()).toBeVisible({ timeout: 30_000 });
  218 |     await page.goto(`${publicUrl}${slug}/`);
  219 |     await expect(page.getByText(expectedTitle).first()).toBeVisible({ timeout: 30_000 });
  220 |     await expect(page.locator("img").filter({ hasNotText: "" }).first()).toBeVisible();
  221 |     await page.reload();
  222 |     await expect(page.getByText(expectedTitle).first()).toBeVisible();
  223 |   }
  224 | }
  225 | 
  226 | async function visibleToastCount(page: Page, pattern: RegExp) {
  227 |   return page.locator(".toast").filter({ hasText: pattern }).count();
  228 | }
  229 | 
  230 | async function assertNoBlockingOverlay(page: Page) {
  231 |   await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  232 |   await expect(page.locator(".critical-modal-backdrop")).toHaveCount(0);
  233 | }
  234 | 
  235 | function attachTelemetry(page: Page, testInfo: TestInfo) {
  236 |   let phase = testInfo.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  237 |   const consoleErrors: string[] = [];
  238 |   const consoleWarnings: string[] = [];
  239 |   const failedResponses: Array<{ status: number; method: string; url: string; resourceType: string }> = [];
  240 |   const failedRequests: Array<{ method: string; url: string; errorText: string | null }> = [];
  241 |   const requests: Array<{ method: string; url: string; postData: string; startedAt: number; endedAt?: number; durationMs?: number }> = [];
  242 |   const counts = new Map<string, number>();
  243 | 
  244 |   page.on("console", (message) => {
  245 |     const text = message.text();
  246 |     if (message.type() === "error") consoleErrors.push(text);
  247 |     if (message.type() === "warning" && !/Download the React DevTools/i.test(text)) consoleWarnings.push(text);
  248 |   });
  249 |   page.on("pageerror", (error) => {
  250 |     console.error("[PAGE ERROR]", error.message);
  251 |     consoleErrors.push(error.message);
  252 |   });
  253 |   page.on("requestfailed", (request) => {
  254 |     const errorText = request.failure()?.errorText || null;
  255 |     console.error("[REQUEST FAILED]", request.method(), request.url(), errorText);
  256 |     failedRequests.push({ method: request.method(), url: request.url(), errorText });
  257 |   });
  258 |   page.on("request", (request) => {
  259 |     const item = { method: request.method(), url: request.url(), postData: request.postData() || "", startedAt: Date.now() };
  260 |     requests.push(item);
  261 |     counts.set(`${item.method} ${item.url}`, (counts.get(`${item.method} ${item.url}`) || 0) + 1);
  262 |   });
  263 |   page.on("response", (response) => {
  264 |     const request = response.request();
  265 |     const match = [...requests].reverse().find((item) => item.url === request.url() && item.method === request.method() && !item.endedAt);
  266 |     if (match) {
  267 |       match.endedAt = Date.now();
  268 |       match.durationMs = match.endedAt - match.startedAt;
  269 |     }
  270 |     if (response.status() >= 400) {
  271 |       const failure = { status: response.status(), method: request.method(), url: response.url(), resourceType: request.resourceType() };
  272 |       console.error("[HTTP ERROR]", failure.method, failure.status, failure.url, failure.resourceType);
  273 |       failedResponses.push(failure);
  274 |     }
  275 |   });
  276 | 
  277 |   return {
  278 |     consoleErrors,
  279 |     failedResponses,
  280 |     get repeatedRequests() {
  281 |       return [...counts.entries()].map(([key, count]) => ({ key, count })).filter((item) => item.count > 1);
  282 |     },
  283 |     async reset(nextPhase: string) {
  284 |       await this.flush();
  285 |       phase = nextPhase;
  286 |       requests.length = 0;
  287 |       failedResponses.length = 0;
  288 |       consoleErrors.length = 0;
  289 |       consoleWarnings.length = 0;
```
import { expect, test, type Page } from "@playwright/test";

function monitor(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "unknown";
    if (/ERR_ABORTED|cancelled|canceled/i.test(reason)) return;
    failedRequests.push(`${reason} ${request.method()} ${request.url()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/nao-existe-homologacao")) {
      failedRequests.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
  return { consoleErrors, failedRequests };
}

test("home, header, âncoras, teclado, SEO e carregamento progressivo", async ({ page }, testInfo) => {
  const telemetry = monitor(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Seu design pode ser mais inteligente" })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /design/i);
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await page.getByRole("link", { name: "FAQ", exact: true }).click();
  await expect(page).toHaveURL(/#faq$/);

  if (testInfo.project.name === "webkit-public") {
    await page.getByRole("link", { name: "Pular para o conteúdo" }).evaluate((element: HTMLElement) => element.focus());
  } else {
    await page.keyboard.press("Home");
    await page.keyboard.press("Tab");
  }
  const focusedOutline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(focusedOutline).not.toBe("none");
  await expect(page.locator("form")).toHaveCount(0);

  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
});

test("listagem, detalhe, imagens, metadados, 404 e slug antigo", async ({ page, request }) => {
  const telemetry = monitor(page);
  await page.goto("/cases");
  const cards = page.locator(".cases-grid--listing .case-card");
  await expect(cards).toHaveCount(36);
  const firstHref = await cards.first().getAttribute("href");
  expect(firstHref).toMatch(/^\/cases\//);
  await cards.first().click();
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
  for (const image of await page.locator("main img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  }

  const missing = await request.get("/nao-existe-homologacao");
  expect(missing.status()).toBe(404);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const historyResponse = await request.get(`${url}/rest/v1/portfolio_case_slug_history?select=old_slug,portfolio_cases!inner(slug,status)&portfolio_cases.status=eq.published&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  expect(historyResponse.ok()).toBe(true);
  const history = await historyResponse.json() as Array<{ old_slug: string; portfolio_cases: { slug: string } }>;
  if (history[0]) {
    const oldResponse = await request.get(`/cases/${history[0].old_slug}`, { maxRedirects: 0 });
    expect([307, 308]).toContain(oldResponse.status());
    expect(oldResponse.headers().location).toContain(`/cases/${history[0].portfolio_cases.slug}`);
  }

  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
});

test("tres detalhes publicos resolvem slug, imagens e URL canonica", async ({ page }) => {
  const telemetry = monitor(page);
  await page.goto("/cases");
  const paths = await page.locator(".cases-grid--listing .case-card").evaluateAll((cards) => cards.slice(0, 3).map((card) => card.getAttribute("href")));
  expect(paths).toHaveLength(3);

  for (const path of paths) {
    expect(path).toMatch(/^\/cases\/[^/]+$/);
    await page.goto(path!);
    await expect(page.locator("h1")).toBeVisible();
    await expect.poll(async () => {
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      return canonical ? decodeURIComponent(new URL(canonical).pathname) : null;
    }).toBe(path);
    for (const image of await page.locator("main img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
    }
  }

  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
});

test("responsividade nos breakpoints aprovados e menu mobile", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  for (const width of [1440, 1280, 1024, 810, 768, 430, 390, 375]) {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator("h1")).toBeVisible();
    if (width <= 768) {
      const trigger = page.getByRole("button", { name: "Abrir menu" });
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(page.getByRole("navigation", { name: "Navegação mobile" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("navigation", { name: "Navegação mobile" })).toHaveCount(0);
    }
  }
});

test("reduced motion e ausência de WebGL não escondem conteúdo", async ({ browser }) => {
  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  await reduced.goto("/");
  await expect(reduced.locator("h1")).toBeVisible();
  await expect(reduced.locator(".hero-effect canvas")).toHaveCount(0);
  await reduced.close();

  const noWebgl = await browser.newPage();
  await noWebgl.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = (function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2") return null;
      return originalGetContext.apply(this, [type, ...args] as never);
    }) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await noWebgl.goto("/");
  await expect(noWebgl.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(noWebgl.locator(".hero-effect canvas")).toHaveCount(0);
  await noWebgl.close();
});

test("revalidação exige segredo e aceita somente o segredo correto", async ({ request }) => {
  expect((await request.post("/api/revalidate", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/revalidate", {
    data: {},
    headers: { "x-revalidation-secret": "segredo-incorreto-controlado" },
  })).status()).toBe(401);

  const secret = process.env.REVALIDATION_SECRET;
  expect(secret, "REVALIDATION_SECRET deve existir sem ser impresso").toBeTruthy();
  const accepted = await request.post("/api/revalidate", {
    data: { slugs: ["slug-controlado-inexistente"] },
    headers: { "x-revalidation-secret": secret! },
  });
  expect(accepted.status()).toBe(200);
  await expect(accepted.json()).resolves.toMatchObject({ revalidated: true, tag: "portfolio-cases" });
});

test("rotas administrativas bloqueiam usuário anônimo", async ({ page }) => {
  await page.goto("/admin/cases");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByTestId("admin-login-form")).toBeVisible();
  await page.goto("/admin/cases/new");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("efeito WebGL decorativo não bloqueia conteúdo e métricas básicas permanecem estáveis", async ({ page }) => {
  const scripts: string[] = [];
  await page.addInitScript(() => {
    const state = { cls: 0, longTasks: 0 };
    Object.defineProperty(window, "__homologationMetrics", { value: state });
    if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
          if (!entry.hadRecentInput) state.cls += entry.value ?? 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      new PerformanceObserver((list) => { state.longTasks += list.getEntries().length; })
        .observe({ type: "longtask", buffered: true });
    }
  });
  page.on("response", (response) => {
    if (/javascript/.test(response.headers()["content-type"] ?? "")) scripts.push(response.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(scripts.length).toBeGreaterThan(0);
  const metrics = await page.evaluate(() => (window as unknown as { __homologationMetrics: { cls: number; longTasks: number } }).__homologationMetrics);
  expect(metrics.cls).toBeLessThan(0.1);
  expect(metrics.longTasks).toBeLessThan(12);
});

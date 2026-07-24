import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cmsUrl = "http://localhost:5177/admin/portfolio/";
const publicUrl = "http://localhost:4174/cases/";
const supabaseUrl = "https://yzivkrotylwyglavtnho.supabase.co";
const anonKey = "sb_publishable_99D42sJ3fT78ll6EzmIDqg_RWXrgtNn";
const slug = `test-cms-e2e-${Date.now()}`;
let caseId = "";
let initialPublishedAt = "";
let initialVersion = 0;

type Telemetry = ReturnType<typeof attachTelemetry>;

test.describe.configure({ mode: "serial" });

test.describe("Portfolio CMS v2 real stability audit", () => {
  let telemetry: Telemetry;

  test.beforeEach(async ({ page }, testInfo) => {
    telemetry = attachTelemetry(page, testInfo);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await assertNoBlockingOverlay(page);
    await telemetry.flush();
    expect(telemetry.consoleErrors, "erros de console").toEqual([]);
    expect(telemetry.failedResponses, `respostas HTTP inesperadas: ${JSON.stringify(telemetry.failedResponses, null, 2)}`).toEqual([]);
    expect(telemetry.repeatedRequests.filter((item) => item.count > 20), "requests repetidas em excesso").toEqual([]);
  });

  test.afterAll(async () => {
    if (caseId) await deleteE2eCase(caseId);
  });

  test("cria draft descartavel e valida autosave real", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        Object.defineProperty(globalThis.crypto, "randomUUID", { configurable: true, value: undefined });
      } catch {
        // Alguns navegadores tornam a propriedade imutavel; o restante da
        // suite ainda cobre o caminho nativo nesses ambientes.
      }
    });
    await openCms(page);
    console.log("URL antes:", page.url());
    await Promise.all([
      page.waitForURL(/\/admin\/portfolio\/cases\/[0-9a-f-]{36}$/),
      page.getByTestId("create-case").click(),
    ]);
    console.log("URL depois:", page.url());
    await expect(page.getByTestId("case-editor")).toBeVisible();
    await expect.poll(() => new URL(page.url()).pathname.match(/\/admin\/portfolio\/cases\/([0-9a-f-]{36})\/?$/)?.[1] || "", {
      message: "UUID ausente na rota administrativa",
    }).toMatch(/^[0-9a-f-]{36}$/);
    caseId = new URL(page.url()).pathname.match(/\/admin\/portfolio\/cases\/([0-9a-f-]{36})\/?$/)![1];

    await fillMinimumDraft(page, "Portfolio CMS E2E inicial");
    await saveDraft(page, telemetry);
    await telemetry.reset("autosave");

    await page.getByTestId("case-title").fill("");
    const debouncedAutosaveResponse = page.waitForResponse((response) => {
      const request = response.request();
      const url = new URL(response.url());
      return request.method() === "PATCH"
        && url.pathname === "/rest/v1/portfolio_cases"
        && url.searchParams.get("id") === `eq.${caseId}`;
    });
    const started = Date.now();
    let index = 0;
    while (Date.now() - started < 10_000) {
      await page.getByTestId("case-title").fill(`Portfolio CMS E2E digitacao continua ${index}`);
      await page.waitForTimeout(100);
      index += 1;
    }

    const updatesDuringTyping = telemetry.caseUpdates().length;
    expect(updatesDuringTyping, "nao pode salvar por tecla").toBeLessThanOrEqual(2);
    const debounceResponse = await debouncedAutosaveResponse;
    expect(debounceResponse.ok(), "o autosave apos o debounce deve concluir em 2xx").toBe(true);
    await expect.poll(() => telemetry.pendingCaseUpdates(), { message: "o autosave apos debounce deve terminar" }).toBe(0);
    await expect(page.getByTestId("operation-notice")).toContainText(/Autosave concluido/i);
    const updatesAfterDebounce = telemetry.caseUpdates().length;
    expect(updatesAfterDebounce, "deve haver save final apos debounce").toBeGreaterThanOrEqual(1);
    expect(updatesAfterDebounce, "draft nao pode salvar em loop").toBeLessThanOrEqual(updatesDuringTyping + 2);

    await telemetry.reset("autosave-single-flight");
    const queuedAutosaveResponse = page.waitForResponse((response) => {
      const request = response.request();
      const url = new URL(response.url());
      return request.method() === "PATCH"
        && url.pathname === "/rest/v1/portfolio_cases"
        && url.searchParams.get("id") === `eq.${caseId}`;
    });
    await page.getByTestId("case-title").pressSequentially("continuacao enquanto salva ", { delay: 15 });
    const autosaveResponse = await queuedAutosaveResponse;
    expect(autosaveResponse.ok(), "o autosave enfileirado deve concluir em 2xx").toBe(true);
    await expect.poll(() => telemetry.pendingCaseUpdates(), { message: "o autosave enfileirado deve terminar" }).toBe(0);
    await expect(page.getByTestId("operation-notice")).toContainText(/Autosave concluido/i);
    expect(maxConcurrent(telemetry.caseUpdates()), "maximo um save ativo e um pendente").toBeLessThanOrEqual(2);

    const row = await dbGetCase(caseId);
    expect(row.slug).toBe(slug);
    expect(String(row.title)).toContain("continuacao enquanto salva");
    expect(row.status).toBe("draft");

    await telemetry.reset("no-update-navigation");
    await page.getByRole("button", { name: "galeria" }).click();
    await page.getByRole("button", { name: "preview", exact: true }).click();
    await expect(page.getByText(slug)).toBeVisible();
    expect(telemetry.caseUpdates(), "alternar secoes/preview nao pode disparar update").toHaveLength(0);
  });

  test("publica com clique duplicado, atualiza publicado e valida publico", async ({ page }) => {
    await openCase(page);
    await page.getByRole("button", { name: "galeria" }).click();
    await uploadGalleryImage(page);
    expect(telemetry.pendingCaseUpdates(), "upload de galeria nao deve exigir update vazio do case").toBe(0);

    await telemetry.reset("publish");
    await page.getByTestId("publish-case").click();
    await expect(page.getByTestId("publish-case")).toBeDisabled();
    await page.getByTestId("publish-case").click({ force: true }).catch(() => undefined);
    await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", "published", { timeout: 30_000 });
    await expect(page.getByTestId("operation-notice")).toContainText(/publicado com sucesso/i);
    expect(telemetry.publicationUpdates(), "publicacao duplicada").toHaveLength(1);
    expect(await visibleToastCount(page, /Case publicado|Publicacao atualizada/), "toast unico de publicacao").toBe(1);

    const published = await dbGetCase(caseId);
    expect(published.status).toBe("published");
    expect(published.published_at).toBeTruthy();
    initialPublishedAt = String(published.published_at);
    initialVersion = Number(published.version);

    await telemetry.reset("published-edit");
    await page.getByRole("button", { name: "geral", exact: true }).click();
    await page.getByTestId("case-title").fill(`Portfolio CMS E2E publicado ${Date.now()}`);
    await expect(page.locator(".save-state")).toContainText("Alteracoes nao publicadas");
    await page.waitForTimeout(3_000);
    expect(telemetry.caseUpdates(), "published nao pode autosalvar").toHaveLength(0);

    await telemetry.reset("update-publication");
    await page.getByTestId("update-publication").click();
    await expect(page.getByTestId("update-publication")).toBeDisabled();
    await page.getByTestId("update-publication").click({ force: true }).catch(() => undefined);
    await expect(page.getByTestId("operation-notice")).toContainText(/atualizada com sucesso/i, { timeout: 30_000 });
    expect(telemetry.publicationUpdates(), "atualizacao duplicada").toHaveLength(1);
    expect(await visibleToastCount(page, /Publicacao atualizada/), "toast unico de atualizacao").toBe(1);

    const updated = await dbGetCase(caseId);
    expect(updated.status).toBe("published");
    expect(updated.published_at).toBe(initialPublishedAt);
    expect(Number(updated.version)).toBeGreaterThan(initialVersion);

    await validatePublicCase(page, String(updated.title));
  });

  test("reconcilia resposta incerta sem travar estados", async ({ page }) => {
    await openCase(page);
    await page.getByTestId("case-title").fill(`Portfolio CMS E2E reconciliado ${Date.now()}`);

    let blocked = false;
    await page.route("**/rest/v1/portfolio_cases?**", async (route) => {
      const request = route.request();
      if (!blocked && request.method() === "PATCH" && (request.postData() || "").includes("\"status\":\"published\"")) {
        blocked = true;
        await route.abort("failed");
        return;
      }
      await route.continue();
    });

    await telemetry.reset("uncertain-update");
    await page.getByTestId("update-publication").click();
    await expect(page.getByTestId("operation-notice")).toContainText(/Nao foi possivel|Erro|confirmar|atualizada/i, { timeout: 30_000 });
    await page.unroute("**/rest/v1/portfolio_cases?**");
    await expect(page.getByText(/Publicando|Atualizando|Salvando|Reconciliando/)).toHaveCount(0, { timeout: 12_000 });
    telemetry.acknowledgeExpectedAbortedWrite(caseId);

    const row = await dbGetCase(caseId);
    expect(["published", "draft", "archived"]).toContain(row.status);
    await page.reload();
    await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", String(row.status));
  });

  test("modais, toasts e limpeza do case descartavel", async ({ page }) => {
    await openCase(page);
    await page.getByTestId("case-title").fill(`Portfolio CMS E2E modal ${Date.now()}`);
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("alteracoes nao salvas");
      await dialog.dismiss();
    });
    await page.getByTestId("create-case").click();
    await expect(page).toHaveURL(new RegExp(`/admin/portfolio/cases/${caseId}$`));
    await assertNoBlockingOverlay(page);

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Arquivar");
      await dialog.dismiss();
    });
    await page.getByTestId("archive-case").click();
    await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", "published");
    await assertNoBlockingOverlay(page);

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Arquivar");
      await dialog.accept();
    });
    await page.getByTestId("archive-case").click();
    await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", "archived", { timeout: 30_000 });
    await page.getByTestId("case-status-filter").selectOption("archived");
    await expect(caseRow(page)).toHaveAttribute("data-case-status", "archived");

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Restaurar");
      await dialog.accept();
    });
    await page.getByTestId("restore-case").click();
    await expect(page.getByTestId("case-editor")).toHaveAttribute("data-case-status", "draft", { timeout: 30_000 });
    await expect(page.getByTestId("operation-notice")).toContainText(/restaurado como rascunho/i);
    await page.getByTestId("case-status-filter").selectOption("active");
    await expect(caseRow(page)).toHaveAttribute("data-case-status", "draft");
    const row = await dbGetCase(caseId);
    expect(row.status).toBe("draft");
  });
});

async function openCms(page: Page) {
  await page.goto(cmsUrl);
  await expect(page.getByTestId("create-case")).toBeVisible({ timeout: 30_000 });
}

async function openCase(page: Page) {
  await page.goto(`${cmsUrl}cases/${caseId}`);
  await expect(page.getByTestId("case-editor")).toBeVisible({ timeout: 30_000 });
}

function caseRow(page: Page) {
  return page.locator(`[data-testid="case-row"][data-case-slug="${slug}"]`);
}

async function fillMinimumDraft(page: Page, title: string) {
  await page.getByTestId("case-title").fill(title);
  await page.getByTestId("case-slug").fill(slug);
  await page.getByTestId("case-excerpt").fill("Case descartavel usado somente pela auditoria Playwright do CMS.");
  const branding = page.getByRole("checkbox", { name: "Branding", exact: true });
  await branding.check();
  await expect(branding).toBeChecked();
  await page.getByRole("button", { name: "conteudo" }).click();
  await page.locator('[data-testid="case-content-editor"] .ProseMirror').click();
  await page.keyboard.type("Conteudo real do case descartavel para publicar e validar o fluxo publico.");
  await page.getByRole("button", { name: "capa" }).click();
  await page.getByLabel("Upload nova capa").setInputFiles(testPng("portfolio-cms-e2e-cover.png"));
  await expect(page.getByText(/Capa enviada/i)).toBeVisible({ timeout: 30_000 });
}

async function saveDraft(page: Page, telemetry: Telemetry) {
  await page.getByRole("button", { name: "geral" }).click();
  const save = page.getByTestId("save-draft");
  const expected = {
    title: await page.getByTestId("case-title").inputValue(),
    slug: await page.getByTestId("case-slug").inputValue(),
    excerpt: await page.getByTestId("case-excerpt").inputValue(),
  };
  await expect(save).toBeEnabled();
  const responsePromise = page.waitForResponse((response) => {
    const request = response.request();
    const url = new URL(response.url());
    return request.method() === "PATCH"
      && url.pathname === "/rest/v1/portfolio_cases"
      && url.searchParams.get("id") === `eq.${caseId}`
      && url.searchParams.has("version");
  });
  await save.click();
  const response = await responsePromise;
  expect(response.status(), "o update do case deve concluir em 2xx").toBeGreaterThanOrEqual(200);
  expect(response.status(), "o update do case deve concluir em 2xx").toBeLessThan(300);
  const rows = await response.json() as Array<Record<string, unknown>>;
  expect(rows, "o PATCH deve retornar o registro atualizado").toHaveLength(1);
  expect(rows[0].id).toBe(caseId);
  await expect.poll(() => telemetry.pendingCaseUpdates(), { message: "nenhuma gravacao do case pode ficar pendente" }).toBe(0);
  await expect(page.locator(".save-state")).not.toContainText(/Salvando/i);
  await expect(page.getByTestId("operation-notice")).toContainText(/Rascunho salvo|Autosave concluido|Salvo/i);

  await telemetry.captureSaveOperations();
  await page.reload();
  await expect(page.getByTestId("case-editor")).toBeVisible();
  await expect(page.getByTestId("case-title")).toHaveValue(expected.title);
  await expect(page.getByTestId("case-slug")).toHaveValue(expected.slug);
  await expect(page.getByTestId("case-excerpt")).toHaveValue(expected.excerpt);
  const persisted = await dbGetCase(caseId);
  expect(persisted.title).toBe(expected.title);
  expect(persisted.slug).toBe(expected.slug);
  expect(persisted.excerpt).toBe(expected.excerpt);
}

async function uploadGalleryImage(page: Page) {
  await page.getByLabel("Upload multiplo").setInputFiles(testPng("portfolio-cms-e2e-gallery.png"));
  await expect(page.getByText(/Uploads finalizados/i)).toBeVisible({ timeout: 30_000 });
}

function testPng(name: string) {
  return {
    name,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lm8rJAAAAABJRU5ErkJggg==",
      "base64",
    ),
  };
}

async function validatePublicCase(page: Page, expectedTitle: string) {
  for (const width of [390, 810, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(publicUrl);
    await expect(page.getByText(expectedTitle).first()).toBeVisible({ timeout: 30_000 });
    await page.goto(`${publicUrl}${slug}/`);
    await expect(page.getByText(expectedTitle).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("img").filter({ hasNotText: "" }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(expectedTitle).first()).toBeVisible();
  }
}

async function visibleToastCount(page: Page, pattern: RegExp) {
  return page.locator(".toast").filter({ hasText: pattern }).count();
}

async function assertNoBlockingOverlay(page: Page) {
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.locator(".critical-modal-backdrop")).toHaveCount(0);
}

function attachTelemetry(page: Page, testInfo: TestInfo) {
  let phase = testInfo.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const failedResponses: Array<{ status: number; method: string; url: string; resourceType: string }> = [];
  const failedRequests: Array<{ method: string; url: string; errorText: string | null }> = [];
  const requests: Array<{ operationId: string; method: string; url: string; postData: string; startedAt: number; endedAt?: number; durationMs?: number }> = [];
  const saveOperations: unknown[] = [];
  const counts = new Map<string, number>();

  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") consoleErrors.push(text);
    if (message.type() === "warning" && !/Download the React DevTools/i.test(text)) consoleWarnings.push(text);
  });
  page.on("pageerror", (error) => {
    console.error("[PAGE ERROR]", error.message);
    consoleErrors.push(error.message);
  });
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || null;
    console.error("[REQUEST FAILED]", request.method(), request.url(), errorText);
    failedRequests.push({ method: request.method(), url: request.url(), errorText });
  });
  page.on("request", (request) => {
    const item = { operationId: crypto.randomUUID(), method: request.method(), url: request.url(), postData: request.postData() || "", startedAt: Date.now() };
    requests.push(item);
    counts.set(`${item.method} ${item.url}`, (counts.get(`${item.method} ${item.url}`) || 0) + 1);
  });
  page.on("response", (response) => {
    const request = response.request();
    const match = [...requests].reverse().find((item) => item.url === request.url() && item.method === request.method() && !item.endedAt);
    if (match) {
      match.endedAt = Date.now();
      match.durationMs = match.endedAt - match.startedAt;
    }
    if (response.status() >= 400) {
      const failure = { status: response.status(), method: request.method(), url: response.url(), resourceType: request.resourceType() };
      console.error("[HTTP ERROR]", failure.method, failure.status, failure.url, failure.resourceType);
      failedResponses.push(failure);
    }
  });

  return {
    consoleErrors,
    failedResponses,
    get repeatedRequests() {
      return [...counts.entries()].map(([key, count]) => ({ key, count })).filter((item) => item.count > 1);
    },
    async reset(nextPhase: string) {
      await this.flush();
      phase = nextPhase;
      requests.length = 0;
      failedResponses.length = 0;
      consoleErrors.length = 0;
      consoleWarnings.length = 0;
      counts.clear();
      saveOperations.length = 0;
    },
    caseUpdates() {
      return requests.filter((item) => item.method === "PATCH" && item.url.includes("/rest/v1/portfolio_cases"));
    },
    pendingCaseUpdates() {
      return this.caseUpdates().filter((item) => !item.endedAt).length;
    },
    async captureSaveOperations() {
      const operations = await page.evaluate(() => {
        return ((window as Window & { __portfolioSaveOperations?: unknown[] }).__portfolioSaveOperations || []);
      }).catch(() => []);
      for (const operation of operations) {
        const serialized = JSON.stringify(operation);
        if (!saveOperations.some((item) => JSON.stringify(item) === serialized)) saveOperations.push(operation);
      }
    },
    publicationUpdates() {
      return this.caseUpdates().filter((item) => item.postData.includes('"status":"published"'));
    },
    acknowledgeExpectedAbortedWrite(expectedCaseId: string) {
      const matchingFailures = failedRequests.filter((item) =>
        item.method === "PATCH"
        && item.url.includes(`/portfolio_cases?id=eq.${expectedCaseId}`)
        && /ERR_FAILED|aborted/i.test(item.errorText || ""),
      );
      expect(matchingFailures, "a falha de rede simulada deve atingir somente o PATCH esperado").toHaveLength(1);
      const expectedConsoleErrors = consoleErrors.filter((item) => /Failed to load resource: net::ERR_FAILED/i.test(item));
      expect(expectedConsoleErrors, "o navegador deve registrar somente a falha simulada").toHaveLength(1);
      failedRequests.splice(0, failedRequests.length, ...failedRequests.filter((item) => !matchingFailures.includes(item)));
      consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((item) => !expectedConsoleErrors.includes(item)));
    },
    async flush() {
      const dir = path.resolve("admin/portfolio/test-results/telemetry");
      await mkdir(dir, { recursive: true });
      await this.captureSaveOperations();
      const body = {
        phase,
        consoleErrors,
        consoleWarnings,
        failedResponses,
        failedRequests,
        repeatedRequests: this.repeatedRequests,
        supabaseRequests: requests.filter((item) => item.url.includes("supabase.co")),
        caseUpdates: this.caseUpdates().length,
        saveOperations,
        publicationUpdates: this.publicationUpdates().length,
        storageRequests: requests.filter((item) => item.url.includes("/storage/v1/")).length,
      };
      await writeFile(path.join(dir, `${phase}.json`), `${JSON.stringify(body, null, 2)}\n`);
      await testInfo.attach(`telemetry-${phase}`, { body: JSON.stringify(body, null, 2), contentType: "application/json" });
    },
  };
}

function maxConcurrent(items: Array<{ startedAt: number; endedAt?: number }>) {
  const events = items.flatMap((item) => [
    { at: item.startedAt, delta: 1 },
    { at: item.endedAt || Date.now(), delta: -1 },
  ]);
  let active = 0;
  let max = 0;
  for (const event of events.sort((a, b) => a.at - b.at || b.delta - a.delta)) {
    active += event.delta;
    max = Math.max(max, active);
  }
  return max;
}

async function dbGetCase(id: string) {
  const token = await getAccessToken();
  const response = await fetch(`${supabaseUrl}/rest/v1/portfolio_cases?id=eq.${encodeURIComponent(id)}&select=*`, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
  });
  expect(response.ok).toBe(true);
  const rows = await response.json() as Array<Record<string, unknown>>;
  expect(rows).toHaveLength(1);
  return rows[0];
}

async function deleteE2eCase(id: string) {
  const token = await getAccessToken();
  const headers = { apikey: anonKey, authorization: `Bearer ${token}` };
  const caseResponse = await fetch(`${supabaseUrl}/rest/v1/portfolio_cases?id=eq.${encodeURIComponent(id)}&select=id,slug,cover_storage_bucket,cover_storage_path`, { headers });
  expect(caseResponse.ok, "nao foi possivel confirmar o case temporario para limpeza").toBe(true);
  const cases = await caseResponse.json() as Array<{ id: string; slug: string; cover_storage_bucket: string | null; cover_storage_path: string | null }>;
  expect(cases, "a limpeza so pode remover o case E2E criado nesta execucao").toHaveLength(1);
  expect(cases[0].slug, "a limpeza recusou um case que nao pertence ao E2E").toMatch(/^test-cms-e2e-/);

  const mediaResponse = await fetch(`${supabaseUrl}/rest/v1/portfolio_case_media?case_id=eq.${encodeURIComponent(id)}&select=storage_bucket,storage_path`, { headers });
  expect(mediaResponse.ok, "nao foi possivel listar a midia temporaria para limpeza").toBe(true);
  const media = await mediaResponse.json() as Array<{ storage_bucket: string | null; storage_path: string | null }>;
  const objects = [cases[0], ...media].flatMap((item) => item.cover_storage_bucket && item.cover_storage_path
    ? [{ bucket: item.cover_storage_bucket, path: item.cover_storage_path }]
    : "storage_bucket" in item && item.storage_bucket && item.storage_path
      ? [{ bucket: item.storage_bucket, path: item.storage_path }]
      : []);

  for (const object of objects) {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(object.bucket)}`, {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [object.path] }),
    });
    expect(response.ok, `nao foi possivel remover a midia temporaria ${object.bucket}/${object.path}`).toBe(true);
    const verifyResponse = await fetch(`${supabaseUrl}/storage/v1/object/info/${encodeURIComponent(object.bucket)}/${object.path.split("/").map(encodeURIComponent).join("/")}`, { headers });
    const verifyBody = await verifyResponse.text();
    expect([400, 404], `o objeto temporario ainda existe: ${object.bucket}/${object.path}`).toContain(verifyResponse.status);
    expect(verifyBody, `o Storage nao confirmou ausencia de ${object.bucket}/${object.path}`).toMatch(/not.?found|not exist/i);
  }

  const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/portfolio_cases?id=eq.${encodeURIComponent(id)}&slug=like.test-cms-e2e-*&select=id`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=representation" },
  });
  expect(deleteResponse.ok, "nao foi possivel remover o case temporario").toBe(true);
  const deleted = await deleteResponse.json() as Array<{ id: string }>;
  expect(deleted.map((item) => item.id), "a limpeza nao removeu o case E2E esperado").toEqual([id]);

  for (const table of ["portfolio_cases", "portfolio_case_media", "portfolio_case_slug_history"]) {
    const filter = table === "portfolio_cases" ? "id" : "case_id";
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}=eq.${encodeURIComponent(id)}&select=*`, { headers });
    expect(verifyResponse.ok, `nao foi possivel verificar residuos em ${table}`).toBe(true);
    expect(await verifyResponse.json(), `a limpeza deixou residuos em ${table}`).toEqual([]);
  }
}

async function getAccessToken() {
  const state = JSON.parse(await readFile("admin/portfolio/.auth/admin.json", "utf8"));
  const origin = state.origins.find((item: { origin: string }) => item.origin === "http://localhost:5177");
  const entry = origin?.localStorage?.find((item: { name: string }) => item.name.includes("auth-token"));
  if (!entry) throw new Error("storageState autenticado nao contem token Supabase.");
  const session = JSON.parse(entry.value);
  const token = session.access_token || session.currentSession?.access_token;
  if (!token) throw new Error("storageState autenticado nao contem access token Supabase.");
  return token;
}

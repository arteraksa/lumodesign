import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { WebSocket } from "undici";

const runId = crypto.randomUUID();
const originalSlug = `e2e-next-${runId}`;
const changedSlug = `${originalSlug}-alterado`;
const title = `E2E Next temporário ${runId}`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lm8rJAAAAABJRU5ErkJggg==", "base64");

test.describe.configure({ mode: "serial" });

test("sessão persiste, CMS completa o ciclo e limpa a fixture", async ({ page }) => {
  let caseId = "";
  try {
    await page.goto("/admin/cases");
    await expect(page.getByTestId("create-case")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("create-case")).toBeVisible();

    await page.getByTestId("create-case").click();
    await expect(page).toHaveURL(/\/admin\/cases\/new$/);
    await expect(page.getByRole("heading", { name: "Novo case" })).toBeVisible();
    await expect(page.getByTestId("case-form")).toBeVisible();
    await expect(page.getByTestId("case-title")).toBeVisible();
    await expect(page.getByTestId("case-content")).toBeVisible();
    await expect(page.getByTestId("case-form-error")).toHaveCount(0);
    await page.getByTestId("save-case").click();
    await expect(page.getByRole("heading", { name: "Salvando seu rascunho" })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/cases\/[0-9a-f-]+\/edit\?notice=saved$/);
    caseId = page.url().match(/cases\/([0-9a-f-]+)\/edit/)?.[1] ?? "";
    expect(caseId).toBeTruthy();
    await expect(page.getByTestId("case-title")).toHaveValue("");

    await page.getByTestId("case-title").fill(title);
    await page.getByTestId("case-slug").fill(originalSlug);
    await page.getByLabel(/Cliente/).fill("Homologação automatizada");
    await page.getByLabel("Adicionar categoria").selectOption("Branding");
    await page.getByLabel("Adicionar categoria").selectOption("UI/UX Design");
    await page.getByLabel("Descrição curta").fill("Fixture temporária da homologação ponta a ponta.");
    await page.getByTestId("case-content").fill("Conteúdo temporário controlado para homologação.");
    await page.getByTestId("cover-upload").setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
    await expect(page.getByTestId("cover-image")).toBeVisible();
    await expect(page.getByText("Anexada como capa")).toBeVisible();
    await page.getByTestId("gallery-upload").setInputFiles([
      { name: "gallery-1.png", mimeType: "image/png", buffer: png },
      { name: "gallery-2.png", mimeType: "image/png", buffer: png },
    ]);
    await expect(page.getByTestId("project-image")).toHaveCount(2);
    await expect(page.getByText("Anexada ao projeto")).toHaveCount(2);
    await page.getByTestId("save-case").click();
    await expect(page.getByRole("heading", { name: "Salvando seu rascunho" })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/admin/cases/${caseId}/edit\\?notice=saved$`));

    await expect(page.getByTestId("case-title")).toHaveValue(title);
    await page.getByTestId("publish-case").click();
    await expect(page.getByRole("heading", { name: "Publicando seu case" })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/admin/cases/${caseId}/edit\\?notice=published$`));
    await expect(page.getByText("Case publicado com sucesso")).toBeVisible();

    await page.goto(`/cases/${originalSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator(".case-gallery figure")).toHaveCount(2);

    await page.goto(`/admin/cases/${caseId}/edit`);
    await page.getByTestId("case-slug").fill(changedSlug);
    await page.getByLabel("Descrição curta").fill("Conteúdo atualizado após publicação.");
    await page.getByTestId("publish-case").click();
    await expect(page.getByRole("heading", { name: "Publicando seu case" })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/admin/cases/${caseId}/edit\\?notice=published$`));
    await page.goto(`/cases/${originalSlug}`);
    await expect(page).toHaveURL(new RegExp(`/cases/${changedSlug}$`));
    await page.goto(`/cases/${changedSlug}`);
    await expect(page.getByText("Conteúdo atualizado após publicação.")).toBeVisible();

    await page.goto(`/admin/cases/${caseId}/edit`);
    await page.getByTestId("archive-case").click();
    await expect(page).toHaveURL(/\/admin\/cases$/);
    await page.goto(`/cases/${changedSlug}`);
    await expect(page.getByRole("heading", { name: "Esta página não foi encontrada." })).toBeVisible();

    await page.goto(`/admin/cases/${caseId}/edit`);
    await page.getByTestId("restore-case").click();
    await expect(page).toHaveURL(new RegExp(`/admin/cases/${caseId}/edit$`));
    await expect(page.locator(".admin-status-pill")).toHaveText("Rascunho");
  } finally {
    await cleanupTemporaryCase(caseId);
  }
});

test("logout bloqueia reload e acesso direto", async ({ page }) => {
  await page.goto("/admin/cases");
  await page.getByTestId("logout").click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/cases");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

async function cleanupTemporaryCase(caseId: string) {
  if (!caseId) return;
  const email = process.env.PORTFOLIO_TEST_ADMIN_EMAIL;
  const password = process.env.PORTFOLIO_TEST_ADMIN_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!email || !password || !url || !key) return;
  const client = createClient(url, key, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  });
  const { error: loginError } = await client.auth.signInWithPassword({ email, password });
  if (loginError) throw new Error("Falha ao autenticar a rotina segura de limpeza.");
  const { data: media } = await client.from("portfolio_case_media").select("storage_bucket,storage_path").eq("case_id", caseId);
  const { data: item } = await client.from("portfolio_cases").select("slug,title,cover_storage_bucket,cover_storage_path").eq("id", caseId).maybeSingle();
  if (item && !item.slug.startsWith("e2e-next-") && !(item.slug === "" && item.title === "")) {
    throw new Error("A limpeza recusou um registro que não pertence à suíte E2E.");
  }
  const objects = [
    ...(media ?? []).map((entry) => ({ bucket: entry.storage_bucket, path: entry.storage_path })),
    { bucket: item?.cover_storage_bucket, path: item?.cover_storage_path },
  ];
  for (const bucket of ["portfolio-drafts", "portfolio-media"] as const) {
    const paths = objects.filter((entry) => entry.bucket === bucket && entry.path).map((entry) => entry.path as string);
    if (paths.length) await client.storage.from(bucket).remove(paths);
  }
  await client.from("portfolio_cases").delete().eq("id", caseId).like("slug", "e2e-next-%");
  await client.auth.signOut();
}

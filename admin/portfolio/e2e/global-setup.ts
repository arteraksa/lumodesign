import { chromium, expect, type FullConfig, type Page } from "@playwright/test";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";

const authFile = path.resolve("admin/portfolio/.auth/admin.json");

export default async function globalSetup(config: FullConfig) {
  const email = process.env.PORTFOLIO_TEST_ADMIN_EMAIL;
  const password = process.env.PORTFOLIO_TEST_ADMIN_PASSWORD;

  await mkdir(path.dirname(authFile), { recursive: true });
  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:5177";
  const browser = await chromium.launch({ channel: "chrome" });
  const hasSavedSession = await access(authFile).then(() => true).catch(() => false);
  const context = await browser.newContext({
    baseURL,
    storageState: !email || !password
      ? (hasSavedSession ? authFile : undefined)
      : undefined,
  });
  const page = await context.newPage();

  if (email && password) {
    await page.goto("/admin/portfolio/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: /^Entrar$/ }).click();
  } else {
    await page.goto("/admin/portfolio/");
  }
  await assertAuthorizedPortfolioSession(page);

  await context.storageState({ path: authFile });
  await context.close();
  await browser.close();
}

async function assertAuthorizedPortfolioSession(page: Page) {
  await Promise.race([
    page.getByLabel("Novo case").waitFor({ state: "visible", timeout: 30_000 }),
    page.getByText(/Sem permissao/i).waitFor({ state: "visible", timeout: 30_000 }),
  ]);

  if (await page.getByLabel("Novo case").isVisible()) {
    return;
  }

  const userIdMasked = await readMaskedUserId(page);
  throw new Error(
    [
      "Login realizado, mas esta conta não possui permissão para gerenciar o portfólio.",
      JSON.stringify({
        loginSucceeded: true,
        userIdMasked,
        canManagePortfolio: false,
      }),
    ].join("\n"),
  );
}

async function readMaskedUserId(page: Page) {
  return page.evaluate(() => {
    const entry = Object.entries(window.localStorage).find(([key]) => key.includes("auth-token"));
    if (!entry) return "unavailable";
    try {
      const session = JSON.parse(entry[1]);
      const token = session.access_token || session.currentSession?.access_token;
      const payload = JSON.parse(window.atob(String(token).split(".")[1] || ""));
      const subject = String(payload.sub || "");
      if (!subject) return "unavailable";
      return `${subject.slice(0, 8)}-****-****-****-${subject.slice(-12)}`;
    } catch {
      return "unavailable";
    }
  });
}

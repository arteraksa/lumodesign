import { expect, test as setup } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const authFile = path.resolve("admin/portfolio/.auth/admin.json");

setup("autentica uma conta administrativa real", async ({ page }) => {
  const email = process.env.PORTFOLIO_TEST_ADMIN_EMAIL;
  const password = process.env.PORTFOLIO_TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Credenciais administrativas de homologação ausentes no ambiente. Nenhum valor foi lido ou registrado.");
  }

  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(`${password}-incorreta`);
  await page.getByTestId("admin-login-submit").click();
  await expect(page.getByTestId("admin-login-error")).toHaveText("E-mail ou senha inválidos.");

  await page.getByLabel("Senha").fill(password);
  await page.getByTestId("admin-login-submit").click();
  await expect(page).toHaveURL(/\/admin\/cases$/);
  await expect(page.getByTestId("create-case")).toBeVisible();

  await mkdir(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});

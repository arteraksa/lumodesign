import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["html", { outputFolder: "./playwright-report", open: "never" }], ["list"]],
  globalSetup: "./e2e/global-setup.ts",
  outputDir: "./test-results/artifacts",
  use: {
    baseURL: "http://localhost:5177",
    channel: "chrome",
    storageState: "admin/portfolio/.auth/admin.json",
    trace: "on",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run portfolio:cms:dev -- --host 127.0.0.1",
      url: "http://localhost:5177/admin/portfolio/",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --port 4174",
      url: "http://localhost:4174/cases/",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});

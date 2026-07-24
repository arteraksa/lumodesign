import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";

Object.assign(process.env, loadEnv("test", process.cwd(), ""));

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4180";
const authState = "admin/portfolio/.auth/admin.json";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "reports/playwright-next", open: "never" }]],
  outputDir: "reports/playwright-next-artifacts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- -p 4180",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        trace: "off",
        screenshot: "off",
        video: "off",
      },
    },
    {
      name: "chrome-public",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "webkit-public",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "chrome-authenticated",
      testMatch: /cms\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: { ...devices["Desktop Chrome"], channel: "chrome", storageState: authState },
    },
  ],
});

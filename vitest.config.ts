import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "node:path";

Object.assign(process.env, loadEnv("test", process.cwd(), ""));

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    exclude: ["admin/portfolio/**", "node_modules/**"],
    coverage: { reporter: ["text", "html"] },
  },
});

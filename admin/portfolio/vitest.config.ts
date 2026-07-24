import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../..", "lib"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["admin/portfolio/src/tests/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: [path.resolve(__dirname, "src/tests/setup.ts")],
    coverage: {
      reporter: ["text", "json"],
    },
  },
});

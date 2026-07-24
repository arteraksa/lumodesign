import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const portfolioBase = "/admin/portfolio/";

export default defineConfig({
  root: __dirname,
  base: portfolioBase,
  plugins: [
    react(),
    {
      name: "portfolio-admin-spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const requestPath = req.url?.split("?")[0] || "";
          const internalPath = requestPath.slice(portfolioBase.length);
          const isViteInternal = internalPath.startsWith("@vite/") || internalPath.startsWith("@react-refresh");
          if (requestPath.startsWith(portfolioBase) && !isViteInternal && !path.extname(requestPath)) {
            req.url = portfolioBase;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../..", "lib"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5177,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname), path.resolve(__dirname, ".."), path.resolve(__dirname, "../..")],
    },
  },
});

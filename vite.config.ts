import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/app/routes",
      generatedRouteTree: "./src/app/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: false,
  },
  // Pre-bundle lucide-react so cold dev boot doesn't do 500+ individual
  // icon-module requests; Vite esbuild pre-bundles it into one chunk.
  optimizeDeps: {
    include: ["lucide-react"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@app": path.resolve(__dirname, "./src/app"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("react-dom") || /\/react\//.test(id)) {
            return "react";
          }
          if (id.includes("@tanstack")) {
            return "tanstack";
          }
          if (id.includes("radix-ui") || id.includes("@radix-ui")) {
            return "radix";
          }
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("/zod/")) {
            return "forms";
          }
          if (id.includes("/motion/") || id.includes("next-themes")) {
            return "motion";
          }
          return "vendor";
        },
      },
    },
  },
});

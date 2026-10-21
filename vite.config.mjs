import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { viteStaticCopy } from "vite-plugin-static-copy";

const sourcePath = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [
    viteStaticCopy({
      targets: [{ src: "assets/**/*", dest: "" }],
    }),
  ],
  resolve: {
    alias: {
      "@": sourcePath("./src"),
    },
  },
  build: {
    outDir: "build",
    sourcemap: mode !== "production",
    minify: mode === "production",
  },
  server: {
    // Tauri sets TAURI_ENV_DEBUG when running `tauri dev`; in that case it
    // opens its own native window, so we don't want Vite to also open a
    // browser tab. When running plain `vite`, the env var is absent and a
    // browser is opened as usual.
    open: process.env.TAURI_ENV_DEBUG !== "true",
    // Use a high port to avoid conflicts with other local applications.
    port: 64000,
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    clearMocks: true,
  },
}));

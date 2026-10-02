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
      Config: sourcePath("./src/Config"),
      Entities: sourcePath("./src/Entities"),
      HUD: sourcePath("./src/HUD"),
      Miscellaneous: sourcePath("./src/Miscellaneous"),
      Scenes: sourcePath("./src/Scenes"),
    },
  },
  build: {
    outDir: "build",
    sourcemap: mode !== "production",
    minify: mode === "production",
  },
  server: {
    open: true,
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    clearMocks: true,
  },
}));

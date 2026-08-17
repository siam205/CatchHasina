import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const config = defineConfig({
  resolve: {
    alias: {
      "@": resolve(directory, "src"),
    },
  },
  test: {
    clearMocks: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
  },
});

export default config;

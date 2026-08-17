import { defineConfig, devices } from "@playwright/test";

const config = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- -p 3100",
    reuseExistingServer: true,
    timeout: 120000,
    url: "http://127.0.0.1:3100",
  },
});

export default config;

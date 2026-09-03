import { devices, type PlaywrightTestConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 5000,
  },
  forbidOnly: Boolean(process.env.CI),
  outputDir: "test-results/",
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 1,
  testDir: "./e2e",
  timeout: 30 * 1000,
  use: {
    actionTimeout: 0,
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `PORT=${new URL(baseURL).port || "3001"} pnpm dev:e2e`,
    env: {
      ...process.env,
      SECRET_KEY_BASE: process.env.SECRET_KEY_BASE ?? "e2e-test-secret",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
    url: baseURL,
  },
  workers: 1,
};

export default config;

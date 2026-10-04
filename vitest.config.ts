import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    clearMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: "happy-dom",
          environment: "happy-dom",
          include: ["**/*.test.{ts,js,tsx,jsx}"],
          exclude: ["**/node_modules/**", "**/*.server.test.{ts,js}", "e2e/**"],
          setupFiles: "./src/test/setup-happy-dom.ts",
        },
      },
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          setupFiles: "./src/test/setup-server.ts",
          include: ["**/*.server.test.{ts,js}"],
          exclude: ["**/node_modules/**", "e2e/**"],
        },
      },
    ],
  },
});

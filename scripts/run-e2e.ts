import { spawnSync } from "node:child_process";
import { e2eDatabaseName, e2eDatabaseUrl, migrateAndSeed, startLocalPostgres } from "./local-db";

startLocalPostgres();
migrateAndSeed(e2eDatabaseName, e2eDatabaseUrl, false, true);

const result = spawnSync("pnpm", ["exec", "playwright", "test"], {
  env: {
    ...process.env,
    DATABASE_URL: e2eDatabaseUrl,
    MIGRATION_DATABASE_URL: e2eDatabaseUrl,
    SECRET_KEY_BASE: "e2e-test-secret",
  },
  stdio: "inherit",
});

process.exit(result.status ?? 1);

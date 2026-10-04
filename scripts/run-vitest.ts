import { spawnSync } from "node:child_process";
import {
  migrateAndSeed,
  startLocalPostgres,
  vitestDatabaseName,
  vitestDatabaseUrl,
} from "./local-db";

startLocalPostgres();
migrateAndSeed(vitestDatabaseName, vitestDatabaseUrl, false, true);

const args = process.argv.slice(2);
const result = spawnSync("pnpm", ["exec", "vitest", ...args], {
  env: {
    ...process.env,
    DATABASE_URL: vitestDatabaseUrl,
    MIGRATION_DATABASE_URL: vitestDatabaseUrl,
  },
  stdio: "inherit",
});

process.exit(result.status ?? 1);

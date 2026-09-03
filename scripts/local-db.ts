import { createHash } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const workspacePath = resolve(process.cwd());
const workspaceId = createHash("sha256").update(workspacePath).digest("hex").slice(0, 8);
const port = 42000 + (Number.parseInt(workspaceId.slice(0, 4), 16) % 10000);
const stateDirectory = join("/tmp", "shopping-list", workspaceId);
const dataDirectory = join(stateDirectory, "postgres");
const logFile = join(stateDirectory, "postgres.log");

export const localDatabaseName = `shopping_list_local_${workspaceId}`;
export const e2eDatabaseName = `shopping_list_e2e_${workspaceId}`;

function databaseUrl(databaseName: string) {
  return `postgresql://postgres@127.0.0.1:${port}/${databaseName}`;
}

export const localDatabaseUrl = databaseUrl(localDatabaseName);
export const e2eDatabaseUrl = databaseUrl(e2eDatabaseName);

function runMise(command: string, args: string[], allowFailure = false) {
  const result = spawnSync("mise", ["exec", "--", command, ...args], {
    cwd: workspacePath,
    encoding: "utf8",
    stdio: allowFailure ? "pipe" : "inherit",
  });

  if (result.error) {
    throw new Error("mise is required. Install it, then run `mise install` from this repository.");
  }
  if (!allowFailure && result.status !== 0) process.exit(result.status ?? 1);
  return result;
}

function isRunning() {
  return runMise("pg_isready", ["-h", "127.0.0.1", "-p", String(port)], true).status === 0;
}

export function startLocalPostgres() {
  mkdirSync(stateDirectory, { recursive: true });

  if (!existsSync(dataDirectory)) {
    runMise("initdb", ["-D", dataDirectory, "-U", "postgres", "--auth=trust"]);
  }

  if (!isRunning()) {
    runMise("pg_ctl", [
      "-D",
      dataDirectory,
      "-l",
      logFile,
      "-o",
      `-h 127.0.0.1 -p ${port}`,
      "start",
    ]);
  }
}

function ensureDatabase(databaseName: string) {
  const result = runMise(
    "psql",
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(port),
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      `SELECT 1 FROM pg_database WHERE datname = '${databaseName}'`,
    ],
    true,
  );
  if (result.stdout.trim() !== "1") {
    runMise("createdb", ["-h", "127.0.0.1", "-p", String(port), "-U", "postgres", databaseName]);
  }
}

function recreateDatabase(databaseName: string) {
  runMise("psql", [
    "-h",
    "127.0.0.1",
    "-p",
    String(port),
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-c",
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid()`,
  ]);
  runMise("dropdb", [
    "--if-exists",
    "-h",
    "127.0.0.1",
    "-p",
    String(port),
    "-U",
    "postgres",
    databaseName,
  ]);
  runMise("createdb", ["-h", "127.0.0.1", "-p", String(port), "-U", "postgres", databaseName]);
}

export function assertWorkspaceDatabase(url: string, databaseName: string) {
  if (url !== databaseUrl(databaseName)) {
    throw new Error(
      `Refusing to modify ${url}. This command only permits ${databaseUrl(databaseName)} for this workspace.`,
    );
  }
}

async function setEnvValue(key: string, value: string) {
  const envPath = join(workspacePath, ".env.local");
  const line = `${key}=${JSON.stringify(value)}`;
  let contents = "";

  try {
    contents = await readFile(envPath, "utf8");
  } catch (error: unknown) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }

  const expression = new RegExp(`^${key}=.*$`, "m");
  if (expression.test(contents)) {
    await writeFile(envPath, contents.replace(expression, line));
  } else {
    await appendFile(envPath, `${contents && !contents.endsWith("\n") ? "\n" : ""}${line}\n`);
  }
}

async function writeLocalEnvironment() {
  await setEnvValue("DATABASE_URL", localDatabaseUrl);
  await setEnvValue("MIGRATION_DATABASE_URL", localDatabaseUrl);
  await setEnvValue("SECRET_KEY_BASE", "local-development-secret");
  await setEnvValue("ALLOWED_DEV_ORIGINS", "localhost,127.0.0.1");
}

function runCommand(command: string, args: string[], environment: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, {
    cwd: workspacePath,
    env: environment,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function migrateAndSeed(databaseName: string, url: string, seed: boolean, reset = false) {
  assertWorkspaceDatabase(url, databaseName);
  if (reset) recreateDatabase(databaseName);
  else ensureDatabase(databaseName);
  const environment = {
    ...process.env,
    DATABASE_URL: url,
    MIGRATION_DATABASE_URL: url,
    SECRET_KEY_BASE: process.env.SECRET_KEY_BASE ?? "local-development-secret",
  };
  runCommand("pnpm", ["db:migrate"], environment);
  if (seed) runCommand("pnpm", ["tsx", "scripts/seed-local.ts"], environment);
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "start":
      startLocalPostgres();
      console.log(`PostgreSQL is ready at ${databaseUrl("postgres")}`);
      break;
    case "stop":
      if (existsSync(dataDirectory) && isRunning())
        runMise("pg_ctl", ["-D", dataDirectory, "stop"]);
      break;
    case "status":
      console.log(
        isRunning() ? `PostgreSQL is running on port ${port}.` : "PostgreSQL is stopped.",
      );
      process.exitCode = isRunning() ? 0 : 1;
      break;
    case "setup":
      startLocalPostgres();
      await writeLocalEnvironment();
      migrateAndSeed(localDatabaseName, localDatabaseUrl, true);
      console.log(`Local environment ready for ${basename(workspacePath)}.`);
      break;
    case "reset":
      startLocalPostgres();
      migrateAndSeed(localDatabaseName, localDatabaseUrl, true, true);
      break;
    default:
      throw new Error("Usage: local-db.ts <start|stop|status|setup|reset>");
  }
}

if (process.argv[1]?.endsWith("local-db.ts")) void main();

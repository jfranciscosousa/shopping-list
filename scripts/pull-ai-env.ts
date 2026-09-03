import { execFileSync } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import dotenv from "dotenv";

const temporaryDirectory = await mkdtemp(join(tmpdir(), "shopping-list-vercel-env-"));
const temporaryEnvFile = join(temporaryDirectory, ".env");

try {
  execFileSync("pnpm", ["exec", "vercel", "env", "pull", temporaryEnvFile], {
    stdio: "inherit",
  });
  const variables = dotenv.parse(await readFile(temporaryEnvFile));
  const token = variables.VERCEL_OIDC_TOKEN;
  if (!token) throw new Error("Vercel did not provide VERCEL_OIDC_TOKEN.");

  const localEnvPath = join(process.cwd(), ".env.local");
  let localEnv = "";
  try {
    localEnv = await readFile(localEnvPath, "utf8");
  } catch (error: unknown) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  const tokenLine = `VERCEL_OIDC_TOKEN=${JSON.stringify(token)}`;
  const expression = /^VERCEL_OIDC_TOKEN=.*$/m;
  const updatedEnv = expression.test(localEnv)
    ? localEnv.replace(expression, tokenLine)
    : `${localEnv}${localEnv && !localEnv.endsWith("\n") ? "\n" : ""}${tokenLine}\n`;
  await writeFile(localEnvPath, updatedEnv);
  await chmod(localEnvPath, 0o600);
  console.log("Updated VERCEL_OIDC_TOKEN in .env.local.");
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

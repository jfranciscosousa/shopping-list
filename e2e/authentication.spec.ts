import { expect, test } from "@playwright/test";
import { genSaltSync, hashSync } from "bcrypt-ts";
import { Client } from "pg";

const password = "e2e-password";
const createdEmails: string[] = [];

function createCredentials() {
  const suffix = crypto.randomUUID();
  return {
    email: `e2e-${suffix}@example.test`,
    name: `E2E ${suffix.slice(0, 8)}`,
  };
}

async function createUser(email: string, name: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for E2E tests");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('INSERT INTO "User" (email, name, password) VALUES ($1, $2, $3)', [
      email,
      name,
      hashSync(password, genSaltSync(12)),
    ]);
  } finally {
    await client.end();
  }

  createdEmails.push(email);
}

test.afterEach(async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || createdEmails.length === 0) return;

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('DELETE FROM "User" WHERE email = ANY($1)', [createdEmails]);
  } finally {
    createdEmails.length = 0;
    await client.end();
  }
});

test("signs up", async ({ page }) => {
  const { email, name } = createCredentials();
  createdEmails.push(email);

  await page.goto("/");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.locator("#signup-name").fill(name);
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(password);
  await page.locator("#signup-confirm-password").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

test("logs in", async ({ page }) => {
  const { email, name } = createCredentials();
  await createUser(email, name);

  await page.goto("/");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

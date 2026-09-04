import { expect, test, type Page } from "@playwright/test";
import { genSaltSync, hashSync } from "bcrypt-ts";
import { Client } from "pg";

const password = "e2e-password";
const createdEmails: string[] = [];

function createCredentials() {
  const suffix = crypto.randomUUID();
  return {
    email: `e2e-intro-${suffix}@example.test`,
    name: `E2E Intro ${suffix.slice(0, 8)}`,
  };
}

async function createUser(email: string, name: string, introDismissed = false) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for E2E tests");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(
      'INSERT INTO "User" (email, name, password, config) VALUES ($1, $2, $3, $4)',
      [
        email,
        name,
        hashSync(password, genSaltSync(12)),
        introDismissed ? JSON.stringify({ introDismissed: true }) : JSON.stringify({}),
      ],
    );
  } finally {
    await client.end();
  }

  createdEmails.push(email);
}

async function getUserConfig(email: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for E2E tests");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const {
      rows: [user],
    } = await client.query<{ config: { introDismissed?: boolean } }>(
      'SELECT config FROM "User" WHERE email = $1',
      [email],
    );
    return user?.config;
  } finally {
    await client.end();
  }
}

async function login(page: Page, email: string) {
  await page.goto("/");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
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

test("shows the introduction when the user has no saved preference", async ({ page }) => {
  const { email, name } = createCredentials();
  await createUser(email, name);

  await login(page, email);

  await expect(
    page.getByRole("heading", { name: /Everything you need, beautifully sorted\./ }),
  ).toBeVisible();
});

test("hides the introduction when the user dismissed it previously", async ({ page }) => {
  const { email, name } = createCredentials();
  await createUser(email, name, true);

  await login(page, email);

  await expect(
    page.getByRole("heading", { name: /Everything you need, beautifully sorted\./ }),
  ).not.toBeVisible();
});

test("dismisses the introduction and saves the preference", async ({ page }) => {
  const { email, name } = createCredentials();
  await createUser(email, name);

  await login(page, email);

  const intro = page.getByRole("heading", { name: /Everything you need, beautifully sorted\./ });
  await expect(intro).toBeVisible();
  await page.getByRole("button", { name: "Dismiss introduction" }).click();
  await expect.poll(() => getUserConfig(email)).toEqual({ introDismissed: true });
  await expect(intro).not.toBeVisible();
});

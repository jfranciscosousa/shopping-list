import { expect, test } from "@playwright/test";
import { genSaltSync, hashSync } from "bcrypt-ts";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

const password = "e2e-password";
const createdEmails: string[] = [];

function createCredentials() {
  const suffix = crypto.randomUUID();
  return {
    email: `e2e-pdf-${suffix}@example.test`,
    name: `E2E PDF ${suffix.slice(0, 8)}`,
  };
}

async function createCategorizedShoppingList(email: string, name: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for E2E tests");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [user],
    } = await client.query<{ id: number }>(
      'INSERT INTO "User" (email, name, password) VALUES ($1, $2, $3) RETURNING id',
      [email, name, hashSync(password, genSaltSync(12))],
    );
    if (!user) throw new Error("Unable to create E2E user");

    const {
      rows: [produce, dairy],
    } = await client.query<{ id: number }>(
      'INSERT INTO "Category" (name, emoji, "userId", "sortIndex") VALUES ($1, $2, $3, $4), ($5, $6, $3, $7) RETURNING id',
      ["Produce", "🥬", user.id, 0, "Dairy", "🥛", 1],
    );
    if (!produce || !dairy) throw new Error("Unable to create E2E categories");

    await client.query(
      'INSERT INTO "ShoppingItem" (name, "categoryId", "userId") VALUES ($1, $2, $3), ($4, $2, $3), ($5, $6, $3)',
      ["Apples", produce.id, user.id, "Potatoes", "Milk", dairy.id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
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

test("exports a categorized shopping list as a PDF", async ({ page }, testInfo) => {
  const { email, name } = createCredentials();
  await createCategorizedShoppingList(email, name);

  await page.goto("/");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  const exportButton = page.getByRole("button", { name: "Export PDF" });
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^shopping-list-\d{4}-\d{2}-\d{2}\.pdf$/);
  const pdfPath = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(pdfPath);

  const pdf = await readFile(pdfPath);
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  expect(pdf.length).toBeGreaterThan(100);
});

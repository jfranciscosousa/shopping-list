import { expect, test } from "@playwright/test";
import { genSaltSync, hashSync } from "bcrypt-ts";
import { Client } from "pg";

const password = "e2e-password";
const createdEmails: string[] = [];

test.use({ hasTouch: true });

test.afterEach(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('DELETE FROM "User" WHERE email = ANY($1)', [createdEmails]);
  } finally {
    createdEmails.length = 0;
    await client.end();
  }
});

for (const submission of ["click", "tap", "Enter"] as const) {
  test(`keeps the item input focused when adding with ${submission}`, async ({ page }) => {
    const email = `e2e-input-${crypto.randomUUID()}@example.test`;
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required for E2E tests");

    const client = new Client({ connectionString });
    await client.connect();
    try {
      const {
        rows: [user],
      } = await client.query<{ id: number }>(
        'INSERT INTO "User" (email, name, password) VALUES ($1, $2, $3) RETURNING id',
        [email, "E2E Input", hashSync(password, genSaltSync(12))],
      );
      if (!user) throw new Error("Unable to create E2E user");
      createdEmails.push(email);
      await client.query('INSERT INTO "Category" (name, "userId") VALUES ($1, $2)', [
        "Groceries",
        user.id,
      ]);
    } finally {
      await client.end();
    }

    await page.goto("/");
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    const input = page.getByPlaceholder("Add an item (e.g., eggs, milk, bread)");
    await input.fill("Eggs");
    await input.evaluate((element) => {
      element.dataset.blurCount = "0";
      element.addEventListener("blur", () => {
        element.dataset.blurCount = String(Number(element.dataset.blurCount) + 1);
      });
    });

    if (submission === "Enter") {
      await page.keyboard.press("Enter");
    } else {
      await page.getByRole("button", { name: "Add item", exact: true })[submission]();
    }
    await page.keyboard.type("Bread");

    await expect(page.getByRole("button", { name: "Edit Eggs", exact: true })).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("Bread");
    await expect(input).toHaveAttribute("data-blur-count", "0");
  });
}

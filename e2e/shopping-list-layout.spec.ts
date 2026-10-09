import { expect, test } from "@playwright/test";
import { hashSync } from "bcrypt-ts";
import { Client } from "pg";

const email = `e2e-layout-${crypto.randomUUID()}@example.test`;
const password = "e2e-password";
const longName = "A".repeat(80);

test.afterEach(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('DELETE FROM "User" WHERE email = $1', [email]);
  } finally {
    await client.end();
  }
});

test("distributes category cards and keeps narrow-screen controls inside them", async ({
  page,
}) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const {
      rows: [user],
    } = await client.query<{ id: string }>(
      'INSERT INTO "User" (email, name, password, config) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, "Layout test", hashSync(password, 12), { introDismissed: true }],
    );
    await Promise.all(
      [longName, "Dairy"].map(async (name, index) => {
        const {
          rows: [category],
        } = await client.query<{ id: string }>(
          'INSERT INTO "Category" (name, "sortIndex", "userId") VALUES ($1, $2, $3) RETURNING id',
          [name, index, user.id],
        );
        await client.query(
          'INSERT INTO "ShoppingItem" (name, "categoryId", "userId") VALUES ($1, $2, $3)',
          [index === 0 ? longName : "Milk", category.id, user.id],
        );
      }),
    );
  } finally {
    await client.end();
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  const cards = page.locator("main section .break-inside-avoid");
  await expect(cards).toHaveCount(2);
  await expect
    .poll(async () => {
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();
      return Boolean(first && second && second.x > first.x && second.y === first.y);
    })
    .toBe(true);
  await expect(cards.nth(0).locator("ul").locator("..")).toHaveCSS("padding", "8px 20px");

  // Viewport changes and interactions must run in order on the same page.
  /* eslint-disable no-await-in-loop */
  for (const width of [768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const deleteCategory = page.getByRole("button", {
      name: `Delete all items in ${longName}`,
      exact: true,
    });
    const editItem = page.getByRole("button", { name: `Edit ${longName}`, exact: true });
    for (const control of [deleteCategory, editItem]) {
      const card = await cards.first().boundingBox();
      const button = await control.boundingBox();
      expect(card).not.toBeNull();
      expect(button).not.toBeNull();
      expect(button!.x).toBeGreaterThanOrEqual(card!.x);
      expect(button!.x + button!.width).toBeLessThanOrEqual(card!.x + card!.width);
    }
    await editItem.click();
    await expect(page.getByRole("textbox", { name: "Item name" })).toHaveValue(longName);
    const form = cards.first().locator("form");
    expect(await form.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.getByRole("button", { name: "Cancel editing" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }

  /* eslint-enable no-await-in-loop */

  await page.getByRole("button", { name: `Edit ${longName}`, exact: true }).click();
  await page.getByRole("textbox", { name: "Item name" }).fill("Updated item");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("button", { name: "Edit Updated item", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Edit Updated item", exact: true })).toBeVisible();
});

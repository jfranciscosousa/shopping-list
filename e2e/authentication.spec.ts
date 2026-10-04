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
  await page.locator("#login-password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid email or password", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();

  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

test("mobile navigation overlays content and dismisses without shifting the page", async ({
  page,
}) => {
  const { email, name } = createCredentials();
  await createUser(email, name);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  const heading = page.getByRole("heading", {
    name: /Everything you need, beautifully sorted\./,
  });
  await expect(heading).toBeVisible();
  const initialBounds = await heading.boundingBox();
  const menu = page.locator("#mobile-navigation");
  const backdrop = page.getByRole("button", { name: "Dismiss navigation" });
  const openMenu = page.getByRole("button", { name: "Open menu", exact: true });

  await expect(menu).toBeHidden();
  await expect(menu).toHaveAttribute("inert", "");
  await openMenu.click();
  await expect(page.getByRole("button", { name: "Close menu", exact: true })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(menu).toBeVisible();
  await expect(backdrop).toBeVisible();
  await expect(menu).toHaveCSS("opacity", "1");
  expect(await heading.boundingBox()).toEqual(initialBounds);
  await backdrop.click({ position: { x: 10, y: 600 } });
  await expect(menu).toBeHidden();

  await openMenu.click();
  await menu.getByRole("link", { name: "Pantry", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(openMenu).toBeFocused();

  await openMenu.click();
  await menu.getByRole("link", { name: "Pantry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pantry Manager" })).toBeVisible();
  await expect(menu).toBeHidden();

  await openMenu.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(menu).toBeHidden();
  await expect(backdrop).toBeHidden();
  await expect(page.getByRole("link", { name: "Profile", exact: true })).toBeVisible();
});

test("updates a profile and clears cached data when switching accounts", async ({ page }) => {
  const firstUser = createCredentials();
  const secondUser = createCredentials();
  await createUser(firstUser.email, firstUser.name);
  await createUser(secondUser.email, secondUser.name);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      'INSERT INTO "Category" (name, "userId") SELECT $1, id FROM "User" WHERE email = $2',
      ["First account aisle", firstUser.email],
    );
    await client.query(
      'INSERT INTO "Category" (name, "userId") SELECT $1, id FROM "User" WHERE email = $2',
      ["Second account aisle", secondUser.email],
    );
  } finally {
    await client.end();
  }

  await page.goto("/");
  await page.locator("#login-email").fill(firstUser.email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Profile", exact: true }).first().click();
  await page.locator("#name").fill("Updated profile name");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Profile updated successfully", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Categories", exact: true }).click();
  await expect(page.getByText("First account aisle", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByText("First account aisle", { exact: true })).not.toBeVisible();

  await page.locator("#login-email").fill(secondUser.email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Profile", exact: true }).first().click();
  await page.getByRole("tab", { name: "Categories", exact: true }).click();
  await expect(page.getByText("Second account aisle", { exact: true })).toBeVisible();
  await expect(page.getByText("First account aisle", { exact: true })).not.toBeVisible();
});

test("revisits pages without a server navigation roundtrip", async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION !== "1", "Next.js prefetching requires production");
  const { email, name } = createCredentials();
  await createUser(email, name);

  await page.goto("/");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  const shoppingHeading = page.getByRole("heading", {
    name: /Everything you need, beautifully sorted\./,
  });
  await expect(shoppingHeading).toBeVisible();
  await page.getByRole("link", { name: "Pantry", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Pantry Manager" })).toBeVisible();
  await page.getByRole("link", { name: "Profile", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();

  const navigationRequests: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() === "GET" && request.headers()["rsc"] === "1") {
      navigationRequests.push(request.url());
      await route.abort();
    } else {
      await route.continue();
    }
  });

  await page.getByRole("link", { name: "Shopping list", exact: true }).first().click();
  await expect(shoppingHeading).toBeVisible();
  await page.getByRole("link", { name: "Pantry", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Pantry Manager" })).toBeVisible();
  await page.getByRole("link", { name: "Profile", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  expect(navigationRequests).toEqual([]);

  await page.unroute("**/*");
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await page.goto("/pantry");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pantry Manager" })).not.toBeVisible();
});

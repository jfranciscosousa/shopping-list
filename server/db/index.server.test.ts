import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";
import { db } from "./index";
import { users } from "./schema";

it("persists and reads a user", async () => {
  const id = randomUUID();
  const email = `${id}@example.test`;

  await db.insert(users).values({ id, email, password: "test-only", name: "Test User" });

  const [user] = await db.select().from(users).where(eq(users.id, id));

  expect(user).toMatchObject({ id, email, name: "Test User" });
});

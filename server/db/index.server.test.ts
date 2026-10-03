import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { eq, sql } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { db } from "./index";
import { users } from "./schema";

it("persists and reads a user", async () => {
  const id = randomUUID();
  const email = `${id}@example.test`;

  await db.insert(users).values({ id, email, password: "test-only", name: "Test User" });

  const [user] = await db.select().from(users).where(eq(users.id, id));

  expect(user).toMatchObject({ id, email, name: "Test User" });
});

it("replaces a disconnected idle connection on the next query", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const control = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await control.connect();
    const previous = await db.execute<{ pid: number }>(sql`SELECT pg_backend_pid() AS pid`);
    const disconnected = new Promise<void>((resolve) => {
      db.$client.once("error", () => resolve());
    });

    // The server-test setup permits only this workspace's disposable database.
    await control.query("SELECT pg_terminate_backend($1)", [previous.rows[0].pid]);
    await disconnected;

    const current = await db.execute<{ pid: number }>(sql`SELECT pg_backend_pid() AS pid`);
    expect(current.rows[0].pid).not.toBe(previous.rows[0].pid);
    expect(log).toHaveBeenCalledWith("Idle database connection failed", {
      error: expect.any(Error),
    });
  } finally {
    await control.end();
    log.mockRestore();
  }
});

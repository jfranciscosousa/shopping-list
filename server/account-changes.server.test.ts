import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { expect, it, vi } from "vitest";
import { subscribeToAccountChanges } from "./account-changes.server";

it("notifies only the affected account after commit, including cascaded deletes", async () => {
  const writer = new Client({ connectionString: process.env.DATABASE_URL });
  const userId = randomUUID();
  const otherId = randomUUID();
  const changed = vi.fn();
  const foreignChanged = vi.fn();
  const disconnected = vi.fn();
  const unsubscribe = await subscribeToAccountChanges({ userId, changed, disconnected });
  const unsubscribeOther = await subscribeToAccountChanges({
    userId: otherId,
    changed: foreignChanged,
    disconnected,
  });
  await writer.connect();
  try {
    await writer.query(
      'INSERT INTO "User" (id, email, password) VALUES ($1::uuid, $1::text, $3), ($2::uuid, $2::text, $3)',
      [userId, otherId, "test-only"],
    );
    await writer.query("BEGIN");
    const categoryId = randomUUID();
    await writer.query('INSERT INTO "Category" (id, name, "userId") VALUES ($1, $2, $3)', [
      categoryId,
      "Sync test",
      userId,
    ]);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(changed).not.toHaveBeenCalled();
    await writer.query("COMMIT");
    await vi.waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
    expect(foreignChanged).not.toHaveBeenCalled();

    await writer.query("BEGIN");
    await writer.query('UPDATE "Category" SET name = $1 WHERE id = $2', [
      "Rolled back",
      categoryId,
    ]);
    await writer.query("ROLLBACK");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(changed).toHaveBeenCalledTimes(1);

    await writer.query('UPDATE "Category" SET name = $1 WHERE id = $2', ["Committed", categoryId]);
    await vi.waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    await writer.query(
      'INSERT INTO "ShoppingItem" (name, "categoryId", "userId") VALUES ($1, $2, $3)',
      ["Cascading item", categoryId, userId],
    );
    await vi.waitFor(() => expect(changed).toHaveBeenCalledTimes(3));
    await writer.query('DELETE FROM "Category" WHERE id = $1', [categoryId]);
    await vi.waitFor(() => expect(changed).toHaveBeenCalledTimes(4));
    expect(foreignChanged).not.toHaveBeenCalled();

    await writer.query('INSERT INTO "Category" (name, "userId") VALUES ($1, $2)', [
      "Foreign",
      otherId,
    ]);
    await vi.waitFor(() => expect(foreignChanged).toHaveBeenCalledTimes(1));
    expect(changed).toHaveBeenCalledTimes(4);
    expect(disconnected).not.toHaveBeenCalled();
  } finally {
    unsubscribe();
    unsubscribeOther();
    await writer.query("ROLLBACK");
    await writer.query('DELETE FROM "User" WHERE id = ANY($1::uuid[])', [[userId, otherId]]);
    await writer.end();
  }
});

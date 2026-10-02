import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdtemp, readdir, rm, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { z } from "zod";
import {
  assertWorkspaceDatabase,
  e2eDatabaseName,
  localDatabaseUrl,
  startLocalPostgres,
} from "./local-db";

const databaseName = `${e2eDatabaseName}_uuid_${process.pid}`;
const url = new URL(localDatabaseUrl);
url.pathname = `/${databaseName}`;
assertWorkspaceDatabase(url.href, databaseName);
startLocalPostgres();

const adminUrl = new URL(localDatabaseUrl);
adminUrl.pathname = "/postgres";
const admin = new Client({ connectionString: adminUrl.href });
await admin.connect();
const folder = await mkdtemp(join(tmpdir(), "shopping-list-uuid-"));
const client = new Client({ connectionString: url.href });
const tables = ["User", "Category", "ShoppingItem", "PantryArea", "PantryItem"];
const uuidMigration = "20261002202727_uuid_ids";

async function snapshot() {
  const result = await client.query<{
    table_name: string;
    rows: Record<string, unknown>[];
  }>(
    tables
      .map(
        (table) =>
          `SELECT '${table}' AS table_name, coalesce(jsonb_agg(to_jsonb(t) ORDER BY id), '[]') AS rows FROM "${table}" t`,
      )
      .join(" UNION ALL "),
  );
  return Object.fromEntries(result.rows.map(({ table_name, rows }) => [table_name, rows]));
}

function normalize(rows: Awaited<ReturnType<typeof snapshot>>) {
  const key = (table: string, id: unknown) => {
    const row = rows[table].find((candidate) => candidate.id === id);
    assert.ok(row, `Missing ${table} reference: ${id}`);
    return table === "User" ? row.email : row.name;
  };
  return Object.fromEntries(
    Object.entries(rows).map(([table, entries]) => [
      table,
      entries
        .map(({ id, userId, categoryId, pantryAreaId, ...data }) => ({
          ...data,
          key: key(table, id),
          ...(userId === undefined ? {} : { user: key("User", userId) }),
          ...(categoryId === undefined ? {} : { category: key("Category", categoryId) }),
          ...(pantryAreaId === undefined ? {} : { area: key("PantryArea", pantryAreaId) }),
        }))
        .sort((a, b) => String(a.key).localeCompare(String(b.key))),
    ]),
  );
}

function runMigration() {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("pnpm", ["db:migrate"], {
      env: { ...globalThis.process.env, MIGRATION_DATABASE_URL: url.href },
      stdio: "inherit",
    });
    process.on("error", reject);
    process.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Migration exit: ${code}`)),
    );
  });
}

try {
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  await client.connect();
  await Promise.all(
    (await readdir("drizzle", { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name !== uuidMigration)
      .map((entry) =>
        cp(join("drizzle", entry.name), join(folder, entry.name), { recursive: true }),
      ),
  );
  await migrate(drizzle({ client }), { migrationsFolder: folder });
  await client.query(`
    INSERT INTO "User" (id, email, password, name, config) VALUES
      (7, 'first@example.test', 'hash-one', 'First', '{"introDismissed":true}'),
      (999, 'second@example.test', 'hash-two', 'Second', '{}');
    INSERT INTO "Category" (id, name, description, emoji, "sortIndex", "userId") VALUES
      (7, 'Produce', 'Fresh', '🥬', -2, 7), (999, 'Dairy', NULL, NULL, 3, 999);
    INSERT INTO "ShoppingItem" (id, name, "categoryId", "userId") VALUES
      (7, 'Apples', 7, 7), (999, 'Milk', 999, 999);
    INSERT INTO "PantryArea" (id, name, "userId") VALUES (7, 'Fridge', 7), (999, 'Shelf', 999);
    INSERT INTO "PantryItem" (id, name, "pantryAreaId", "userId", "producedAt", "expiresAt") VALUES
      (7, 'Yogurt', 7, 7, '2025-01-01', '2030-01-01'),
      (999, 'Rice', 999, 999, '2024-01-01', '2031-01-01');
    ALTER TABLE "Category" RENAME CONSTRAINT "Category_userId_User_id_fkey" TO "Category_userId_fkey";
  `);
  const before = await snapshot();
  const journalBefore = (
    await client.query("SELECT * FROM drizzle.__drizzle_migrations ORDER BY id")
  ).rows;

  await cp(join("drizzle", uuidMigration), join(folder, uuidMigration), { recursive: true });
  await appendFile(
    join(folder, uuidMigration, "migration.sql"),
    "\n--> statement-breakpoint\nSELECT 1 / 0;\n",
  );
  await assert.rejects(migrate(drizzle({ client }), { migrationsFolder: folder }));
  assert.deepEqual(await snapshot(), before, "Failed migration must roll back all data and IDs");
  assert.deepEqual(
    (await client.query("SELECT * FROM drizzle.__drizzle_migrations ORDER BY id")).rows,
    journalBefore,
  );

  await Promise.all([runMigration(), runMigration()]);
  const after = await snapshot();
  assert.deepEqual(
    normalize(after),
    normalize(before),
    "Rows, relationships and timestamps must survive",
  );
  for (const entries of Object.values(after)) {
    for (const row of entries) {
      for (const [column, value] of Object.entries(row)) {
        if (column === "id" || column.endsWith("Id")) assert.ok(z.uuid().safeParse(value).success);
      }
    }
  }
  await runMigration();
  assert.deepEqual(await snapshot(), after, "Rerunning must not replace UUIDs");

  await client.query("BEGIN");
  const {
    rows: [newUser],
  } = await client.query('INSERT INTO "User" (email, password) VALUES ($1, $2) RETURNING id', [
    "new@example.test",
    "hash",
  ]);
  assert.ok(z.uuid().safeParse(newUser.id).success, "New IDs must default to UUIDs");
  const defaults = await client.query(
    `
    WITH category AS (
      INSERT INTO "Category" (name, "userId") VALUES ('New category', $1) RETURNING id
    ), area AS (
      INSERT INTO "PantryArea" (name, "userId") VALUES ('New area', $1) RETURNING id
    ), shopping AS (
      INSERT INTO "ShoppingItem" (name, "categoryId", "userId")
      SELECT 'New shopping item', id, $1 FROM category RETURNING id
    ), pantry AS (
      INSERT INTO "PantryItem" (name, "pantryAreaId", "userId", "expiresAt")
      SELECT 'New pantry item', id, $1, '2030-01-01' FROM area RETURNING id
    )
    SELECT id FROM category UNION ALL SELECT id FROM area
    UNION ALL SELECT id FROM shopping UNION ALL SELECT id FROM pantry;
  `,
    [newUser.id],
  );
  assert.equal(defaults.rows.length, 4);
  for (const row of defaults.rows) assert.ok(z.uuid().safeParse(row.id).success);
  await assert.rejects(
    client.query('INSERT INTO "Category" (name, "userId") VALUES ($1, $2)', [
      "Invalid",
      crypto.randomUUID(),
    ]),
  );
  await client.query("ROLLBACK");

  await client.query("BEGIN");
  await client.query('DELETE FROM "Category" WHERE id = $1', [after.Category[0].id]);
  assert.equal((await client.query('SELECT count(*)::int AS n FROM "ShoppingItem"')).rows[0].n, 1);
  await client.query("ROLLBACK");
  await client.query("BEGIN");
  await client.query('DELETE FROM "PantryArea" WHERE id = $1', [after.PantryArea[0].id]);
  assert.equal((await client.query('SELECT count(*)::int AS n FROM "PantryItem"')).rows[0].n, 1);
  await client.query("ROLLBACK");
  await client.query("BEGIN");
  await client.query('DELETE FROM "User" WHERE id = ANY($1::uuid[])', [
    after.User.map((user) => user.id),
  ]);
  for (const rows of Object.values(await snapshot())) assert.equal(rows.length, 0);
  await client.query("ROLLBACK");
  await client.query(
    "DROP SCHEMA public CASCADE; DROP SCHEMA drizzle CASCADE; CREATE SCHEMA public;",
  );
  await runMigration();
  for (const rows of Object.values(await snapshot())) assert.equal(rows.length, 0);
  console.log(
    "UUID migration passed: rollback, data preservation, concurrent deploys, defaults, cascades and fresh install.",
  );
} finally {
  await client.end();
  await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
  await admin.end();
  await rm(folder, { recursive: true, force: true });
}

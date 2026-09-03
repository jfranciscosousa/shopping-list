import dotenv from "dotenv";
import { hashSync } from "bcrypt-ts";
import { Client } from "pg";
import { assertWorkspaceDatabase, localDatabaseName, localDatabaseUrl } from "./local-db";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL ?? localDatabaseUrl;
assertWorkspaceDatabase(connectionString, localDatabaseName);

const demoEmail = "demo@example.test";
const demoPassword = "demo-password";

async function seed() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");
    const user = await client.query<{ id: number }>(
      `INSERT INTO "User" (email, name, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, "updatedAt" = NOW()
       RETURNING id`,
      [demoEmail, "Local Demo", hashSync(demoPassword, 12)],
    );
    const userId = user.rows[0].id;

    await client.query('DELETE FROM "Category" WHERE "userId" = $1', [userId]);
    await client.query('DELETE FROM "PantryArea" WHERE "userId" = $1', [userId]);

    const produce = await client.query<{ id: number }>(
      'INSERT INTO "Category" (name, description, emoji, "sortIndex", "userId") VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ["Produce", "Fresh fruit and vegetables", "🥬", 0, userId],
    );
    const dairy = await client.query<{ id: number }>(
      'INSERT INTO "Category" (name, description, emoji, "sortIndex", "userId") VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ["Dairy", "Milk, cheese, and chilled products", "🥛", 1, userId],
    );
    await client.query(
      'INSERT INTO "ShoppingItem" (name, "categoryId", "userId") VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)',
      [
        "Bananas",
        produce.rows[0].id,
        userId,
        "Spinach",
        produce.rows[0].id,
        userId,
        "Whole milk",
        dairy.rows[0].id,
        userId,
      ],
    );

    const fridge = await client.query<{ id: number }>(
      'INSERT INTO "PantryArea" (name, "userId") VALUES ($1, $2) RETURNING id',
      ["Fridge", userId],
    );
    await client.query(
      'INSERT INTO "PantryItem" (name, "expiresAt", "pantryAreaId", "userId") VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)',
      [
        "Greek yogurt",
        new Date("2030-01-15T12:00:00Z"),
        fridge.rows[0].id,
        userId,
        "Carrots",
        new Date("2030-01-22T12:00:00Z"),
        fridge.rows[0].id,
        userId,
      ],
    );
    await client.query("COMMIT");
    console.log(`Seeded ${demoEmail} (password: ${demoPassword}).`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

void seed();

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString) throw new Error("MIGRATION_DATABASE_URL must be a direct PostgreSQL URL.");

const client = new Client({ connectionString });
await client.connect();
try {
  // Hold a session lock before Drizzle reads the journal, including during journal upgrades.
  await client.query("SELECT pg_advisory_lock(724193, 1)");
  await migrate(drizzle({ client }), { migrationsFolder: "./drizzle" });
  console.log("Database migrations complete.");
} finally {
  // Closing the session also releases the lock on failures.
  await client.end();
}

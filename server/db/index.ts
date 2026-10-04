import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
});

pool.on("error", (error) => {
  console.error("Idle database connection failed", { error });
});

export const db = drizzle({ client: pool });

export async function closeDatabaseConnection() {
  await pool.end();
}

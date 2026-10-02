import { afterAll, afterEach, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { closeDatabaseConnection, db } from "@/server/db";
import { assertWorkspaceDatabase, vitestDatabaseName } from "@/scripts/local-db";

assertWorkspaceDatabase(process.env.DATABASE_URL ?? "", vitestDatabaseName);

// The database client uses one connection, so each test can roll back all its writes.
beforeEach(async () => {
  await db.execute(sql`BEGIN`);
});

afterEach(async () => {
  await db.execute(sql`ROLLBACK`);
});

afterAll(closeDatabaseConnection);

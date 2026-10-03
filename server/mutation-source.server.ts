import { AsyncLocalStorage } from "node:async_hooks";
import { sql } from "drizzle-orm";
import { db } from "./db";

export const mutationSource = new AsyncLocalStorage<string | undefined>();

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function withAccountChange<T>(write: (tx: Transaction) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.source_id', ${mutationSource.getStore() ?? ""}, true)`,
    );
    return write(tx);
  });
}

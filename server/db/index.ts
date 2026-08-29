import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

const client = new Client({ connectionString: process.env.DATABASE_URL });
let connection: Promise<Client> | undefined;

const lazyClient = new Proxy(client, {
  get(target, property, receiver) {
    if (property === "query") {
      return async (...args: Parameters<Client["query"]>) => {
        connection ??= target.connect();
        await connection;
        return target.query(...args);
      };
    }

    return Reflect.get(target, property, receiver);
  },
}) as Client;

export const db = drizzle({ client: lazyClient });

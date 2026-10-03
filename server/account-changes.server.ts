import { Client } from "pg";

type Subscriber = { userId: string; changed: () => void; disconnected: () => void };
const subscribers = new Set<Subscriber>();
let listener: Client | undefined;
let connecting: Promise<void> | undefined;

function stop(client: Client) {
  if (listener !== client) return;
  listener = undefined;
  connecting = undefined;
  const current = [...subscribers];
  subscribers.clear();
  for (const subscriber of current) subscriber.disconnected();
  void client.end().catch(() => {});
}

export async function subscribeToAccountChanges(subscriber: Subscriber) {
  subscribers.add(subscriber);
  if (!listener) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
      connectionTimeoutMillis: 5_000,
      keepAlive: true,
    });
    listener = client;
    client.on("notification", ({ channel, payload }) => {
      if (channel !== "account_changes") return;
      for (const subscription of subscribers) {
        if (subscription.userId === payload) subscription.changed();
      }
    });
    client.on("error", (error) => {
      console.error("Account change listener failed", error);
      stop(client);
    });
    client.on("end", () => stop(client));
    connecting = client.connect().then(async () => {
      await client.query("LISTEN account_changes");
    });
  }

  const client = listener;
  try {
    await connecting;
  } catch (error) {
    stop(client);
    throw error;
  }

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0 && listener === client) {
      listener = undefined;
      connecting = undefined;
      void client.end().catch(() => {});
    }
  };
}

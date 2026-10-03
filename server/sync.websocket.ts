import { defineWebSocketHandler } from "nitro";
import { decodeJwt } from "jose";
import { authenticateToken } from "./auth.server";
import { subscribeToAccountChanges } from "./account-changes.server";

const cleanups = new Map<string, () => void>();

export default defineWebSocketHandler({
  async upgrade(request) {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== request.headers.get("host")) {
      return new Response("Forbidden", { status: 403 });
    }
    const token = request.headers
      .get("cookie")
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("auth-token="))
      ?.slice("auth-token=".length);
    const user = token ? await authenticateToken(token) : null;
    if (!user) return new Response("Unauthorized", { status: 401 });
    return { context: { userId: user.id, expiresAt: decodeJwt(token!).exp! * 1000 } };
  },
  async open(peer) {
    try {
      const unsubscribe = await subscribeToAccountChanges({
        userId: peer.context.userId as string,
        changed: () => peer.send("changed"),
        disconnected: () => peer.close(1012, "Reconnect"),
      });
      // Reauthenticate periodically and never keep a socket past its JWT expiry.
      const expiry = setTimeout(
        () => peer.close(1000, "Renew session"),
        Math.max(0, Math.min(240_000, (peer.context.expiresAt as number) - Date.now())),
      );
      const cleanup = () => {
        clearTimeout(expiry);
        unsubscribe();
        cleanups.delete(peer.id);
      };
      if (peer.websocket.readyState !== 1) {
        cleanup();
        return;
      }
      cleanups.set(peer.id, cleanup);
      peer.send("ready");
    } catch (error) {
      console.error("Unable to subscribe to account changes", error);
      peer.close(1011, "Subscription unavailable");
    }
  },
  close(peer) {
    cleanups.get(peer.id)?.();
  },
  error(peer) {
    cleanups.get(peer.id)?.();
    peer.close(1011, "Connection failed");
  },
});

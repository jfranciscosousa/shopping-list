import { expect, it, vi } from "vitest";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth-error";
import { requireSuccess } from "@/hooks/action-result";
import { withActionHandling, withServerLogging } from "./error-handler";

it("preserves session expiry for reads and mutations", async () => {
  const expired = new Error(SESSION_EXPIRED_MESSAGE);
  const fail = async () => {
    throw expired;
  };
  await expect(withServerLogging("read", fail)()).rejects.toBe(expired);
  await expect(requireSuccess(withActionHandling("mutation", fail)())).rejects.toThrow(
    SESSION_EXPIRED_MESSAGE,
  );
});

it("does not expose unexpected server errors as auth failures", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const fail = async () => {
      throw new Error("Database unavailable");
    };
    await expect(withServerLogging("read", fail)()).rejects.toThrow(
      "We couldn't complete that request.",
    );
    await expect(withActionHandling("mutation", fail)()).resolves.toEqual({
      success: false,
      error: "We couldn't complete that request. Please try again.",
    });
  } finally {
    log.mockRestore();
  }
});

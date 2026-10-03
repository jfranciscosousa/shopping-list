import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import useAccountSync from "./use-account-sync";

it("invalidates on changes and reconnect readiness, without polling, and stops on unmount", () => {
  vi.useFakeTimers();
  const sockets: FakeSocket[] = [];
  class FakeSocket {
    onmessage?: (event: { data: string }) => void;
    onclose?: () => void;
    close = vi.fn(() => this.onclose?.());
    constructor(public url: URL) {
      sockets.push(this);
    }
  }
  vi.stubGlobal("WebSocket", FakeSocket);
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
  const { unmount } = renderHook(useAccountSync, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  try {
    expect(sockets[0].url.pathname).toBe("/_sync");
    const sourceId = sockets[0].url.searchParams.get("sourceId");
    expect(sourceId).toMatch(/^[a-f0-9-]{36}$/);
    act(() => sockets[0].onmessage?.({ data: "ready" }));
    expect(invalidate).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(10_000));
    expect(invalidate).toHaveBeenCalledTimes(1);
    act(() => sockets[0].onmessage?.({ data: "changed" }));
    expect(invalidate).toHaveBeenCalledTimes(2);
    act(() => sockets[0].close());
    act(() => vi.advanceTimersByTime(1_000));
    expect(sockets).toHaveLength(2);
    expect(sockets[1].url.searchParams.get("sourceId")).toBe(sourceId);
    act(() => sockets[1].onmessage?.({ data: "ready" }));
    expect(invalidate).toHaveBeenCalledTimes(3);
    unmount();
    act(() => vi.advanceTimersByTime(30_000));
    expect(sockets).toHaveLength(2);
    expect(sockets[1].close).toHaveBeenCalledTimes(1);
  } finally {
    unmount();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    client.clear();
  }
});

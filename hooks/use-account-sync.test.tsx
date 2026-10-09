import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import useAccountSync from "./use-account-sync";

const sockets: FakeSocket[] = [];
let visibility: DocumentVisibilityState;
let client: QueryClient;

class FakeSocket {
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: () => void;
  // Keep close asynchronous so stale browser events can arrive after resume.
  close = vi.fn();
  constructor(public url: URL) {
    sockets.push(this);
  }
}

function changeVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
}

function mount(strict = false) {
  return renderHook(useAccountSync, {
    reactStrictMode: strict,
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  sockets.length = 0;
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  vi.stubGlobal("WebSocket", FakeSocket);
  client = new QueryClient();
  vi.spyOn(client, "invalidateQueries").mockResolvedValue();
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("invalidates on changes and reconnect readiness, without polling, and stops on unmount", () => {
  const { unmount } = mount();
  expect(sockets[0].url.pathname).toBe("/_sync");
  const sourceId = sockets[0].url.searchParams.get("sourceId");
  expect(sourceId).toMatch(/^[a-f0-9-]{36}$/);
  act(() => sockets[0].onmessage?.({ data: "ready" }));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(10_000));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  act(() => sockets[0].onmessage?.({ data: "changed" }));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(2);
  act(() => sockets[0].onclose?.());
  act(() => vi.advanceTimersByTime(1_000));
  expect(sockets).toHaveLength(2);
  expect(sockets[1].url.searchParams.get("sourceId")).toBe(sourceId);
  act(() => sockets[1].onmessage?.({ data: "ready" }));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(3);
  unmount();
  act(() => {
    sockets[1].onclose?.();
    vi.advanceTimersByTime(30_000);
  });
  expect(sockets).toHaveLength(2);
  expect(sockets[1].close).toHaveBeenCalledTimes(1);
});

it("does not connect on a hidden mount and refreshes on visible readiness", () => {
  visibility = "hidden";
  mount();
  act(() => vi.advanceTimersByTime(60_000));
  expect(sockets).toHaveLength(0);
  act(() => changeVisibility("visible"));
  expect(sockets).toHaveLength(1);
  act(() => {
    changeVisibility("visible");
    sockets[0].onmessage?.({ data: "ready" });
  });
  expect(sockets).toHaveLength(1);
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
});

it.each(["connecting", "ready"])("closes a %s socket on hide and ignores late events", (state) => {
  mount();
  const first = sockets[0];
  if (state === "ready") act(() => first.onmessage?.({ data: "ready" }));
  vi.mocked(client.invalidateQueries).mockClear();
  act(() => {
    changeVisibility("hidden");
    first.onmessage?.({ data: "ready" });
    first.onclose?.();
    vi.advanceTimersByTime(60_000);
  });
  expect(first.close).toHaveBeenCalledTimes(1);
  expect(client.invalidateQueries).not.toHaveBeenCalled();
  expect(sockets).toHaveLength(1);
  act(() => changeVisibility("visible"));
  expect(sockets).toHaveLength(2);
  act(() => {
    first.onclose?.();
    first.onmessage?.({ data: "changed" });
    first.onerror?.();
    vi.advanceTimersByTime(60_000);
  });
  expect(sockets).toHaveLength(2);
  expect(sockets[1].close).not.toHaveBeenCalled();
  expect(client.invalidateQueries).not.toHaveBeenCalled();
  act(() => sockets[1].onmessage?.({ data: "ready" }));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
});

it("cancels a pending retry on hide and resets backoff on resume", () => {
  mount();
  act(() => sockets[0].onclose?.());
  expect(vi.getTimerCount()).toBe(1);
  act(() => changeVisibility("hidden"));
  expect(vi.getTimerCount()).toBe(0);
  act(() => vi.advanceTimersByTime(60_000));
  expect(sockets).toHaveLength(1);
  act(() => changeVisibility("visible"));
  expect(sockets).toHaveLength(2);
  act(() => sockets[1].onclose?.());
  act(() => vi.advanceTimersByTime(1_000));
  expect(sockets).toHaveLength(3);
});

it("checks visibility again when a retry fires before the visibility event", () => {
  mount();
  act(() => sockets[0].onclose?.());
  visibility = "hidden";
  act(() => vi.advanceTimersByTime(60_000));
  expect(sockets).toHaveLength(1);
  act(() => changeVisibility("visible"));
  expect(sockets).toHaveLength(2);
});

it("pauses on pagehide and resumes once on pageshow, including cached page restoration", () => {
  mount();
  act(() => {
    window.dispatchEvent(new Event("pagehide"));
    changeVisibility("visible");
    sockets[0].onclose?.();
    vi.advanceTimersByTime(60_000);
  });
  expect(sockets[0].close).toHaveBeenCalledTimes(1);
  expect(sockets).toHaveLength(1);
  act(() => {
    window.dispatchEvent(new Event("pageshow"));
    window.dispatchEvent(new Event("pageshow"));
    changeVisibility("visible");
  });
  expect(sockets).toHaveLength(2);
});

it.each(["hidden", "retry", "pagehide"])(
  "removes lifecycle listeners and retries on %s unmount",
  (state) => {
    if (state === "hidden") visibility = "hidden";
    const { unmount } = mount();
    if (state === "retry") act(() => sockets[0].onclose?.());
    if (state === "pagehide") act(() => window.dispatchEvent(new Event("pagehide")));
    unmount();
    const count = sockets.length;
    act(() => {
      changeVisibility("visible");
      window.dispatchEvent(new Event("pageshow"));
      window.dispatchEvent(new Event("pagehide"));
      sockets[0]?.onclose?.();
      vi.advanceTimersByTime(60_000);
    });
    expect(sockets).toHaveLength(count);
    expect(vi.getTimerCount()).toBe(0);
  },
);

it("isolates stale events after Strict Mode effect cleanup", () => {
  mount(true);
  expect(sockets).toHaveLength(2);
  expect(sockets[0].close).toHaveBeenCalledTimes(1);
  act(() => {
    sockets[0].onclose?.();
    sockets[0].onmessage?.({ data: "ready" });
    vi.advanceTimersByTime(60_000);
  });
  expect(sockets).toHaveLength(2);
  expect(client.invalidateQueries).not.toHaveBeenCalled();
  act(() => sockets[1].onmessage?.({ data: "ready" }));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
});

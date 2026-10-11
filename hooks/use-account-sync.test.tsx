import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import useAccountSync from "./use-account-sync";

let visibility: DocumentVisibilityState;
let focused: boolean;
let client: QueryClient;

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
  visibility = "visible";
  focused = true;
  vi.spyOn(document, "hasFocus").mockImplementation(() => focused);
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  vi.stubGlobal("WebSocket", vi.fn());
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

it("refreshes active queries every 15 seconds without WebSockets or cancelling in-flight reads", () => {
  const { unmount } = mount();
  expect(client.invalidateQueries).toHaveBeenCalledWith(
    { type: "active" },
    { cancelRefetch: false },
  );
  act(() => vi.advanceTimersByTime(14_999));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(1));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(2);
  expect(WebSocket).not.toHaveBeenCalled();
  unmount();
  act(() => vi.advanceTimersByTime(60_000));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});

it("does not poll a hidden tab and refreshes immediately when it becomes visible", () => {
  visibility = "hidden";
  mount();
  act(() => vi.advanceTimersByTime(60_000));
  expect(client.invalidateQueries).not.toHaveBeenCalled();
  act(() => changeVisibility("visible"));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  act(() => changeVisibility("visible"));
  expect(vi.getTimerCount()).toBe(1);
  act(() => {
    changeVisibility("hidden");
    vi.advanceTimersByTime(60_000);
  });
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
  act(() => changeVisibility("visible"));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(2);
});

it("pauses while unfocused and refreshes immediately on focus", () => {
  focused = false;
  mount();
  act(() => vi.advanceTimersByTime(60_000));
  expect(client.invalidateQueries).not.toHaveBeenCalled();
  act(() => {
    focused = true;
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("focus"));
  });
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(1);
  act(() => {
    focused = false;
    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(60_000);
  });
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
  act(() => {
    focused = true;
    changeVisibility("hidden");
    window.dispatchEvent(new Event("focus"));
  });
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  act(() => changeVisibility("visible"));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(2);
});

it("checks focus on each tick before the blur event", () => {
  mount();
  focused = false;
  act(() => vi.advanceTimersByTime(60_000));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
});

it("checks visibility on each tick even before a visibility event arrives", () => {
  mount();
  visibility = "hidden";
  act(() => vi.advanceTimersByTime(60_000));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
});

it("pauses on pagehide and resumes once on pageshow", () => {
  mount();
  act(() => {
    window.dispatchEvent(new Event("pagehide"));
    changeVisibility("visible");
    vi.advanceTimersByTime(60_000);
  });
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
  act(() => {
    window.dispatchEvent(new Event("pageshow"));
    window.dispatchEvent(new Event("pageshow"));
  });
  expect(client.invalidateQueries).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(1);
});

it.each(["visible", "hidden", "pagehide"])("removes listeners on %s unmount", (state) => {
  if (state === "hidden") visibility = "hidden";
  const { unmount } = mount();
  if (state === "pagehide") act(() => window.dispatchEvent(new Event("pagehide")));
  unmount();
  vi.mocked(client.invalidateQueries).mockClear();
  act(() => {
    changeVisibility("visible");
    window.dispatchEvent(new Event("pageshow"));
    vi.advanceTimersByTime(60_000);
  });
  expect(client.invalidateQueries).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps only one timer after Strict Mode effect cleanup", () => {
  mount(true);
  expect(vi.getTimerCount()).toBe(1);
  vi.mocked(client.invalidateQueries).mockClear();
  act(() => vi.advanceTimersByTime(15_000));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(1);
});

it("handles failed refreshes and continues polling", async () => {
  vi.mocked(client.invalidateQueries).mockRejectedValueOnce(new Error("Offline"));
  mount();
  await act(async () => {});
  act(() => vi.advanceTimersByTime(15_000));
  expect(client.invalidateQueries).toHaveBeenCalledTimes(2);
});

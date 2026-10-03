import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import useWakeLock from "./use-wake-lock";

function sentinel() {
  const lock = {
    released: false,
    release: vi.fn(async () => {
      lock.released = true;
    }),
  };
  return lock;
}

function deferredLock() {
  let resolve!: (lock: ReturnType<typeof sentinel>) => void;
  const promise = new Promise<ReturnType<typeof sentinel>>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const request = vi.fn();
let visibility: DocumentVisibilityState;

function changeVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  request.mockReset();
  vi.stubGlobal("navigator", { wakeLock: { request } });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("retains the lock across renders and releases it on unmount", async () => {
  const lock = sentinel();
  request.mockResolvedValue(lock);
  const hook = renderHook(() => useWakeLock(true));
  await act(async () => {});

  expect(request).toHaveBeenCalledExactlyOnceWith("screen");
  expect(lock.release).not.toHaveBeenCalled();
  hook.rerender();
  await act(async () => changeVisibility("visible"));
  expect(request).toHaveBeenCalledTimes(1);
  hook.unmount();
  expect(lock.release).toHaveBeenCalledTimes(1);
  await act(async () => changeVisibility("visible"));
  expect(request).toHaveBeenCalledTimes(1);
});

it("requests only while enabled and releases on disable", async () => {
  const lock = sentinel();
  request.mockResolvedValue(lock);
  const hook = renderHook(({ enabled }) => useWakeLock(enabled), {
    initialProps: { enabled: false },
  });
  expect(request).not.toHaveBeenCalled();
  hook.rerender({ enabled: true });
  await act(async () => {});
  hook.rerender({ enabled: false });
  expect(lock.release).toHaveBeenCalledTimes(1);
  await act(async () => changeVisibility("visible"));
  expect(request).toHaveBeenCalledTimes(1);
});

it("reacquires a browser-released lock when the document returns visible", async () => {
  const first = sentinel();
  const second = sentinel();
  request.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
  const hook = renderHook(() => useWakeLock(true));
  await act(async () => {});
  await act(async () => changeVisibility("hidden"));
  first.released = true;
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => changeVisibility("visible"));
  expect(request).toHaveBeenCalledTimes(2);
  expect(second.release).not.toHaveBeenCalled();
  hook.unmount();
  expect(second.release).toHaveBeenCalledTimes(1);
});

it("waits for visibility and does not duplicate a pending request", async () => {
  visibility = "hidden";
  const pending = deferredLock();
  const lock = sentinel();
  request.mockReturnValue(pending.promise);
  const hook = renderHook(() => useWakeLock(true));
  expect(request).not.toHaveBeenCalled();
  await act(async () => {
    changeVisibility("visible");
    changeVisibility("visible");
  });
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => pending.resolve(lock));
  expect(lock.release).not.toHaveBeenCalled();
  hook.unmount();
  expect(lock.release).toHaveBeenCalledTimes(1);
});

it.each(["disable", "unmount"])(
  "releases an acquisition that resolves after %s",
  async (action) => {
    const pending = deferredLock();
    const lock = sentinel();
    request.mockReturnValue(pending.promise);
    const hook = renderHook(({ enabled }) => useWakeLock(enabled), {
      initialProps: { enabled: true },
    });
    if (action === "disable") hook.rerender({ enabled: false });
    else hook.unmount();
    await act(async () => pending.resolve(lock));
    expect(lock.release).toHaveBeenCalledTimes(1);
  },
);

it("releases a late hidden acquisition and retries on visibility", async () => {
  const pending = deferredLock();
  const first = sentinel();
  const second = sentinel();
  request.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(second);
  const hook = renderHook(() => useWakeLock(true));
  await act(async () => changeVisibility("hidden"));
  await act(async () => pending.resolve(first));
  expect(first.release).toHaveBeenCalledTimes(1);
  await act(async () => changeVisibility("visible"));
  expect(request).toHaveBeenCalledTimes(2);
  hook.unmount();
  expect(second.release).toHaveBeenCalledTimes(1);
});

it.each(["toggle", "strict mode"])("isolates stale acquisitions during %s", async (mode) => {
  const pending = deferredLock();
  const stale = sentinel();
  const current = sentinel();
  request.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(current);
  const hook = renderHook(({ enabled }) => useWakeLock(enabled), {
    initialProps: { enabled: true },
    wrapper: mode === "strict mode" ? StrictMode : undefined,
  });
  if (mode === "toggle") {
    hook.rerender({ enabled: false });
    hook.rerender({ enabled: true });
  }
  await act(async () => pending.resolve(stale));
  expect(request).toHaveBeenCalledTimes(2);
  expect(stale.release).toHaveBeenCalledTimes(1);
  expect(current.release).not.toHaveBeenCalled();
  hook.unmount();
  expect(current.release).toHaveBeenCalledTimes(1);
});

it("tolerates unsupported browsers", async () => {
  vi.stubGlobal("navigator", {});
  const hook = renderHook(() => useWakeLock(true));
  await act(async () => changeVisibility("visible"));
  expect(request).not.toHaveBeenCalled();
  hook.unmount();
});

it("handles denied requests and retries on the next visible event", async () => {
  const lock = sentinel();
  request.mockRejectedValueOnce(new Error("Denied")).mockResolvedValueOnce(lock);
  const hook = renderHook(() => useWakeLock(true));
  await act(async () => {});
  await act(async () => changeVisibility("visible"));
  expect(request).toHaveBeenCalledTimes(2);
  hook.unmount();
  expect(lock.release).toHaveBeenCalledTimes(1);
});

it.each(["held", "pending"])("handles release rejection for a %s lock", async (state) => {
  const pending = deferredLock();
  const lock = sentinel();
  lock.release.mockRejectedValue(new Error("Release failed"));
  request.mockReturnValue(pending.promise);
  const hook = renderHook(() => useWakeLock(true));
  if (state === "held") await act(async () => pending.resolve(lock));
  hook.unmount();
  if (state === "pending") await act(async () => pending.resolve(lock));
  await act(async () => {});
  expect(lock.release).toHaveBeenCalledTimes(1);
});

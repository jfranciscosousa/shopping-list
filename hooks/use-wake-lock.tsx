import { useEffect } from "react";

export default function useWakeLock(enabled?: boolean) {
  useEffect(() => {
    if (!enabled || !navigator.wakeLock) return;

    let active = true;
    let pending = false;
    let wakeLock: WakeLockSentinel | null = null;

    async function release(lock: WakeLockSentinel) {
      try {
        await lock.release();
      } catch {
        // Wake Lock is optional; browser release failures must not escape cleanup.
      }
    }

    async function requestWakeLock() {
      if (
        !active ||
        pending ||
        document.visibilityState !== "visible" ||
        (wakeLock && !wakeLock.released)
      )
        return;

      pending = true;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (!active || document.visibilityState !== "visible") {
          void release(lock);
        } else {
          wakeLock = lock;
        }
      } catch {
        // Wake Lock is optional and may be denied by the browser or user.
      } finally {
        pending = false;
      }
    }

    void requestWakeLock();
    document.addEventListener("visibilitychange", requestWakeLock);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", requestWakeLock);
      if (wakeLock) void release(wakeLock);
    };
  }, [enabled]);
}

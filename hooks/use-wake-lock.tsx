import { useEffect, useRef } from "react";

export default function useWakeLock(enabled?: boolean) {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const cleanup = () => {
      if (!wakeLock.current) return;

      wakeLock.current.release();
      wakeLock.current = null;
    };

    async function requestWakeLock() {
      if (wakeLock.current) return;

      try {
        wakeLock.current = await navigator.wakeLock.request();
      } catch {
        // Wake Lock is optional and may be denied by the browser or user.
      }
    }

    if (enabled) void requestWakeLock();
    else cleanup();

    return cleanup();
  }, [enabled]);
}

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
      } catch (error) {
        console.error(error);
      }
    }

    if (enabled) void requestWakeLock();
    else cleanup();

    return cleanup();
  }, [enabled]);
}

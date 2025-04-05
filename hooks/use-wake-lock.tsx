import { useEffect, useRef } from "react";

export default function useWakeLock(enabled?: boolean) {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  // Function that attempts to request a screen wake lock.
  const requestWakeLock = async () => {
    if (wakeLock.current) return;

    try {
      wakeLock.current = await navigator.wakeLock.request();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
    }
  };

  const cleanup = () => {
    if (!wakeLock.current) return;

    wakeLock.current.release();
    wakeLock.current = null;
  };

  useEffect(() => {
    if (enabled) requestWakeLock();
    else cleanup();

    return cleanup();
  }, [enabled]);
}

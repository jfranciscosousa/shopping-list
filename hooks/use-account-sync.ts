import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getTabSourceId } from "@/lib/tab-source";

export default function useAccountSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let disposed = false;
    let pageHidden = false;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let delay = 1_000;

    function isActive() {
      return !disposed && !pageHidden && document.visibilityState === "visible";
    }

    function pause() {
      clearTimeout(retry);
      retry = undefined;
      const current = socket;
      socket = undefined;
      current?.close();
    }

    function connect() {
      retry = undefined;
      if (!isActive() || socket) return;
      const url = new URL("/_sync", window.location.href);
      url.searchParams.set("sourceId", getTabSourceId());
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      const current = new WebSocket(url);
      socket = current;
      current.onmessage = ({ data }) => {
        if (socket !== current || !isActive()) return;
        if (data !== "ready" && data !== "changed") return;
        delay = 1_000;
        void queryClient.invalidateQueries();
      };
      current.onclose = () => {
        if (socket !== current) return;
        socket = undefined;
        if (!isActive()) return;
        retry = setTimeout(connect, delay);
        delay = Math.min(delay * 2, 30_000);
      };
      current.onerror = () => current.close();
    }

    function resume() {
      if (!isActive()) {
        pause();
      } else if (!socket && retry === undefined) {
        delay = 1_000;
        connect();
      }
    }

    function onPageHide() {
      pageHidden = true;
      pause();
    }

    function onPageShow() {
      pageHidden = false;
      resume();
    }

    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    resume();
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      pause();
    };
  }, [queryClient]);
}

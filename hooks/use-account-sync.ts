import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function useAccountSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let delay = 1_000;

    function connect() {
      const url = new URL("/_sync", window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      socket.onmessage = ({ data }) => {
        if (data !== "ready" && data !== "changed") return;
        delay = 1_000;
        void queryClient.invalidateQueries();
      };
      socket.onclose = () => {
        if (disposed) return;
        retry = setTimeout(connect, delay);
        delay = Math.min(delay * 2, 30_000);
      };
      socket.onerror = () => socket.close();
    }

    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      socket.close();
    };
  }, [queryClient]);
}

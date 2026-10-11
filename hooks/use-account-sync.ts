import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function useAccountSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let pageHidden = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    function isActive() {
      return !pageHidden && document.visibilityState === "visible" && document.hasFocus();
    }

    function refresh() {
      if (!isActive()) return;
      void queryClient
        .invalidateQueries({ type: "active" }, { cancelRefetch: false })
        .catch(() => {});
    }

    function pause() {
      clearInterval(timer);
      timer = undefined;
    }

    function resume() {
      if (!isActive()) {
        pause();
      } else if (timer === undefined) {
        refresh();
        timer = setInterval(refresh, 15_000);
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
    window.addEventListener("focus", resume);
    window.addEventListener("blur", pause);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    resume();
    return () => {
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("blur", pause);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      pause();
    };
  }, [queryClient]);
}

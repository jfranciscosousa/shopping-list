import { createRouter } from "@tanstack/react-router";
import RouteError from "@/components/route-error";
import RouteLoading from "@/components/route-loading";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultStaleTime: 300_000,
    defaultPendingComponent: RouteLoading,
    defaultErrorComponent: RouteError,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import RouteError from "@/components/route-error";
import RouteLoading from "@/components/route-loading";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    // Never share session data between SSR requests or router instances.
    context: { sessionQueryClient: new QueryClient() },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultStaleTime: 300_000,
    defaultPendingComponent: RouteLoading,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultErrorComponent: RouteError,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

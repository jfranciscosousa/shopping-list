import { QueryClient } from "@tanstack/react-query";
import { getCurrentUserOptional } from "@/server/auth.actions";

export function getSessionUser(client: QueryClient, preload: boolean) {
  return client.fetchQuery({
    queryKey: ["current-user"],
    queryFn: () => getCurrentUserOptional(),
    // Preloads reuse UI identity; navigation must check the current session cookie.
    staleTime: preload ? 300_000 : 0,
    retry: false,
  });
}

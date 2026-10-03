"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { isAuthError } from "@/lib/auth-error";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const mutationErrorToast = (error: unknown) => {
  toast({
    title: "Request failed",
    description:
      error instanceof Error
        ? error.message
        : "We couldn't complete that request. Please try again.",
    variant: "destructive",
  });
};

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => {
    let resettingSession = false;

    async function handleAuthError(error: unknown) {
      if (!isAuthError(error) || resettingSession) return;
      resettingSession = true;
      try {
        const sessionQueryClient = router.options.context.sessionQueryClient;
        await Promise.all([client.cancelQueries(), sessionQueryClient.cancelQueries()]);
        client.clear();
        sessionQueryClient.clear();
        router.clearCache();
        await router.invalidate();
      } catch (resetError) {
        console.error("Unable to refresh session", resetError);
      } finally {
        resettingSession = false;
      }
    }

    const client = new QueryClient({
      queryCache: new QueryCache({ onError: handleAuthError }),
      mutationCache: new MutationCache({
        onError: (error) => {
          if (isAuthError(error)) return handleAuthError(error);
          mutationErrorToast(error);
        },
      }),
      defaultOptions: {
        queries: { retry: (failureCount, error) => !isAuthError(error) && failureCount < 1 },
      },
    });
    return client;
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

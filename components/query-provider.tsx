"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({ onError: mutationErrorToast }),
        defaultOptions: {
          queries: { retry: 1 },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

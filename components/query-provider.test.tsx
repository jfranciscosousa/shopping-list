import { useEffect } from "react";
import { act, render, waitFor } from "@testing-library/react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth-error";
import QueryProvider from "./query-provider";

const { router, toast } = vi.hoisted(() => ({
  router: {
    options: {
      context: {
        sessionQueryClient: {
          cancelQueries: vi.fn().mockResolvedValue(undefined),
          clear: vi.fn(),
        },
      },
    },
    clearCache: vi.fn(),
    invalidate: vi.fn().mockResolvedValue(undefined),
  },
  toast: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => router }));
vi.mock("@/hooks/use-toast", () => ({ toast }));

function mountClient() {
  let client: QueryClient;
  function CaptureClient() {
    const queryClient = useQueryClient();
    useEffect(() => {
      client = queryClient;
    }, [queryClient]);
    return null;
  }
  render(
    <QueryProvider>
      <CaptureClient />
    </QueryProvider>,
  );
  client!.setQueryData(["private"], "private data");
  return client!;
}

it.each(["query", "mutation"])(
  "resets auth caches after an expired %s without an error toast",
  async (kind) => {
    const client = mountClient();
    const request = vi.fn().mockRejectedValue(new Error(SESSION_EXPIRED_MESSAGE));

    await act(async () => {
      if (kind === "query") {
        await expect(
          client.fetchQuery({ queryKey: ["expired"], queryFn: request }),
        ).rejects.toThrow(SESSION_EXPIRED_MESSAGE);
      } else {
        const mutation = client.getMutationCache().build(client, { mutationFn: request });
        await expect(mutation.execute(undefined)).rejects.toThrow(SESSION_EXPIRED_MESSAGE);
      }
    });

    await waitFor(() => expect(router.invalidate).toHaveBeenCalledOnce());
    expect(router.clearCache).toHaveBeenCalledOnce();
    expect(router.options.context.sessionQueryClient.cancelQueries).toHaveBeenCalledOnce();
    expect(router.options.context.sessionQueryClient.clear).toHaveBeenCalledOnce();
    expect(client.getQueryData(["private"])).toBeUndefined();
    expect(request).toHaveBeenCalledOnce();
    expect(toast).not.toHaveBeenCalled();
    client.clear();
  },
);

it("does not log out on a database/network error", async () => {
  const client = mountClient();
  await expect(
    client.fetchQuery({
      queryKey: ["failed"],
      queryFn: () => Promise.reject(new Error("Database unavailable")),
      retry: false,
    }),
  ).rejects.toThrow("Database unavailable");
  expect(router.invalidate).not.toHaveBeenCalled();
  expect(client.getQueryData(["private"])).toBe("private data");
  client.clear();
});

it("deduplicates concurrent session resets", async () => {
  const client = mountClient();
  let finishReset!: () => void;
  router.invalidate.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishReset = resolve;
      }),
  );
  await Promise.allSettled(
    ["first", "second"].map((key) =>
      client.fetchQuery({
        queryKey: [key],
        queryFn: () => Promise.reject(new Error(SESSION_EXPIRED_MESSAGE)),
      }),
    ),
  );
  await waitFor(() => expect(router.invalidate).toHaveBeenCalledOnce());
  finishReset();
  client.clear();
});

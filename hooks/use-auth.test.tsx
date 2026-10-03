import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useLogin, useLogout, useSignup } from "./use-auth";

const router = vi.hoisted(() => ({
  options: { context: { sessionQueryClient: null as unknown as QueryClient } },
  clearCache: vi.fn(),
  navigate: vi.fn().mockResolvedValue(undefined),
  invalidate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => router }));
vi.mock("@/server/auth.actions", () => ({
  login: vi.fn().mockResolvedValue({ success: true }),
  signup: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue({ success: true }),
}));

const clients: QueryClient[] = [];
afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
});

const actions = {
  useLogin: () => {
    const mutation = useLogin();
    return () => mutation.mutateAsync(new FormData());
  },
  useSignup: () => {
    const mutation = useSignup();
    return () => mutation.mutateAsync(new FormData());
  },
  useLogout: () => {
    const mutation = useLogout();
    return () => mutation.mutateAsync();
  },
};

it.each(Object.entries(actions))(
  "clears identity and private data on %s",
  async (_name, useAuth) => {
    const client = new QueryClient();
    const sessionQueryClient = new QueryClient();
    clients.push(client, sessionQueryClient);
    router.options.context.sessionQueryClient = sessionQueryClient;
    client.setQueryData(["private"], "first user's data");
    sessionQueryClient.setQueryData(["current-user"], { id: "first-user" });
    const cancelSessionQueries = vi.spyOn(sessionQueryClient, "cancelQueries");
    const { result } = renderHook(useAuth, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(() => result.current());
    expect(cancelSessionQueries).toHaveBeenCalled();
    expect(client.getQueryData(["private"])).toBeUndefined();
    expect(sessionQueryClient.getQueryData(["current-user"])).toBeUndefined();
    expect(router.clearCache).toHaveBeenCalledOnce();
    expect(router.invalidate).toHaveBeenCalledOnce();
  },
);

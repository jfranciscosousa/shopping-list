import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { getCurrentUserOptional } from "@/server/auth.actions";
import { getRouter } from "../src/router";
import { getSessionUser } from "./session-query";

vi.mock("@/server/auth.actions", () => ({ getCurrentUserOptional: vi.fn() }));
vi.mock("../src/routeTree.gen", async () => {
  const { createRootRoute } = await import("@tanstack/react-router");
  return { routeTree: createRootRoute() };
});

const user = {
  id: "first-user",
  email: "first@example.test",
  name: "First User",
  config: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};
const clients: QueryClient[] = [];
function client() {
  const queryClient = new QueryClient();
  clients.push(queryClient);
  return queryClient;
}
afterEach(() => {
  for (const queryClient of clients.splice(0)) queryClient.clear();
  vi.resetAllMocks();
});

it("deduplicates concurrent and repeated hover lookups", async () => {
  const queryClient = client();
  vi.mocked(getCurrentUserOptional).mockResolvedValue(user);
  await Promise.all([getSessionUser(queryClient, true), getSessionUser(queryClient, true)]);
  expect(await getSessionUser(queryClient, true)).toEqual(user);
  expect(getCurrentUserOptional).toHaveBeenCalledOnce();
});

it("revalidates on navigation and after the hover cache expires", async () => {
  const queryClient = client();
  vi.mocked(getCurrentUserOptional).mockResolvedValue(user);
  await getSessionUser(queryClient, true);
  vi.mocked(getCurrentUserOptional).mockResolvedValue(null);
  expect(await getSessionUser(queryClient, false)).toBeNull();
  queryClient.setQueryData(["current-user"], user, { updatedAt: Date.now() - 300_001 });
  expect(await getSessionUser(queryClient, true)).toBeNull();
  expect(getCurrentUserOptional).toHaveBeenCalledTimes(3);
});

it("allocates a separate session cache for every router / SSR request", async () => {
  const first = getRouter().options.context.sessionQueryClient;
  const second = getRouter().options.context.sessionQueryClient;
  clients.push(first, second);
  expect(first).not.toBe(second);
  vi.mocked(getCurrentUserOptional).mockResolvedValueOnce(user).mockResolvedValueOnce(null);
  expect(await getSessionUser(first, true)).toEqual(user);
  expect(await getSessionUser(second, true)).toBeNull();
  expect(getCurrentUserOptional).toHaveBeenCalledTimes(2);
});

it("does not restore old identity from a pending lookup after a session reset", async () => {
  const queryClient = client();
  let finish!: (value: typeof user) => void;
  vi.mocked(getCurrentUserOptional).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = getSessionUser(queryClient, true);
  const rejected = expect(pending).rejects.toThrow();
  await queryClient.cancelQueries();
  queryClient.clear();
  finish(user);
  await rejected;
  vi.mocked(getCurrentUserOptional).mockResolvedValue(null);
  expect(await getSessionUser(queryClient, true)).toBeNull();
  expect(queryClient.getQueryData(["current-user"])).toBeNull();
});

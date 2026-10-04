import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import UserProfileForm from "./user-profile-form";

const router = vi.hoisted(() => ({
  options: {
    context: {
      sessionQueryClient: {
        cancelQueries: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn(),
      },
    },
  },
  clearCache: vi.fn(),
  navigate: vi.fn().mockResolvedValue(undefined),
  invalidate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => router }));
vi.mock("@/server/auth.actions", () => ({ login: vi.fn(), logout: vi.fn(), signup: vi.fn() }));
vi.mock("@/server/user.actions", () => ({
  updateUser: vi.fn().mockResolvedValue({ success: true }),
}));

it.each([false, true])(
  "clears both auth caches only on password changes (%s)",
  async (changePassword) => {
    const client = new QueryClient();
    client.setQueryData(["private"], "cached data");
    const cancelQueries = vi.spyOn(client, "cancelQueries");
    render(
      <QueryClientProvider client={client}>
        <UserProfileForm
          user={{
            id: "test-user",
            email: "test@example.test",
            name: "Test User",
            config: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
        />
      </QueryClientProvider>,
    );
    if (changePassword) {
      fireEvent.change(screen.getByLabelText("New Password"), {
        target: { value: "new-password" },
      });
    }
    fireEvent.submit(screen.getByRole("button", { name: "Save Changes" }).closest("form")!);

    await waitFor(() => expect(router.invalidate).toHaveBeenCalledOnce());
    expect(cancelQueries).toHaveBeenCalledTimes(changePassword ? 1 : 0);
    expect(router.clearCache).toHaveBeenCalledTimes(changePassword ? 1 : 0);
    expect(router.options.context.sessionQueryClient.cancelQueries).toHaveBeenCalledTimes(
      changePassword ? 1 : 0,
    );
    expect(router.options.context.sessionQueryClient.clear).toHaveBeenCalledTimes(
      changePassword ? 1 : 0,
    );
    expect(client.getQueryData(["private"])).toBe(changePassword ? undefined : "cached data");
    client.clear();
  },
);

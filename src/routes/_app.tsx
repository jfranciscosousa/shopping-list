import { createFileRoute, Outlet } from "@tanstack/react-router";
import LoginForm from "@/components/login-form";
import Navbar from "@/components/navbar";
import QueryProvider from "@/components/query-provider";
import { getSessionUser } from "@/lib/session-query";
import useAccountSync from "@/hooks/use-account-sync";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context: { sessionQueryClient }, preload }) => ({
    user: await getSessionUser(sessionQueryClient, preload),
  }),
  component: AppLayout,
});

function SyncedOutlet() {
  useAccountSync();
  return <Outlet />;
}

function AppLayout() {
  const { user } = Route.useRouteContext();

  return (
    <QueryProvider key={user?.id ?? "anonymous"}>
      <Navbar user={user} />
      {user ? <SyncedOutlet /> : <LoginForm />}
    </QueryProvider>
  );
}

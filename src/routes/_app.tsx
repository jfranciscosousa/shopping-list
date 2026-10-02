import { createFileRoute, Outlet } from "@tanstack/react-router";
import LoginForm from "@/components/login-form";
import Navbar from "@/components/navbar";
import QueryProvider from "@/components/query-provider";
import { getCurrentUserOptional } from "@/server/auth.actions";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => ({ user: await getCurrentUserOptional() }),
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();

  return (
    <QueryProvider key={user?.id ?? "anonymous"}>
      <Navbar user={user} />
      {user ? <Outlet /> : <LoginForm />}
    </QueryProvider>
  );
}

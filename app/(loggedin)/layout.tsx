import LoginForm from "@/components/login-form";
import Navbar from "@/components/navbar";
import QueryProvider from "@/components/query-provider";
import { getCurrentUserOptional } from "@/server/auth.actions";
import { Suspense } from "react";
import Loading from "./loading";

export const dynamic = "force-dynamic";

const loadingFallback = (
  <QueryProvider>
    <Navbar />
    <Loading />
  </QueryProvider>
);

async function LayoutWithUser({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOptional();

  return (
    <QueryProvider key={user?.id ?? "anonymous"}>
      <Navbar user={user} />

      {user ? children : <LoginForm />}
    </QueryProvider>
  );
}

export default function LoggedInLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={loadingFallback}>
      <LayoutWithUser>{children}</LayoutWithUser>
    </Suspense>
  );
}

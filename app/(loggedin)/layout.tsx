import LoginForm from "@/components/login-form";
import Navbar from "@/components/navbar";
import QueryProvider from "@/components/query-provider";
import { getCurrentUserOptional } from "@/server/auth.actions";
import { Suspense } from "react";
import Loading from "./loading";

export const dynamic = "force-dynamic";

async function LayoutWithUser({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOptional();

  return (
    <>
      <Navbar user={user} />

      {user ? <QueryProvider key={user.id}>{children}</QueryProvider> : <LoginForm />}
    </>
  );
}

export default function LoggedInLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />

          <Loading />
        </>
      }
    >
      <LayoutWithUser>{children}</LayoutWithUser>
    </Suspense>
  );
}

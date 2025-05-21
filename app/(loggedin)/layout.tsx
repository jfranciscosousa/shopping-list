import LoginForm from "@/components/login-form";
import Navbar from "@/components/navbar";
import { getCurrentUserOptional } from "@/server/auth.actions";
import { Suspense } from "react";
import Loading from "./loading";

export const runtime = "edge";

async function LayoutWithUser({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOptional();

  return (
    <>
      <Navbar user={user} />

      {user ? children : <LoginForm />}
    </>
  );
}

export default function LoggedInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

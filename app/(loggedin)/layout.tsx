import Navbar from "@/components/navbar";
import { getCurrentUser } from "@/server/auth.actions";
import { Suspense } from "react";
import Loading from "./loading";

export const runtime = "edge";

async function NavbarWithUser() {
  const user = await getCurrentUser();

  return <Navbar user={user} />;
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
      <NavbarWithUser />
      {children}
    </Suspense>
  );
}

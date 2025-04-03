import Navbar from "@/components/navbar";
import { getCurrentUser } from "@/server/auth.actions";

export const runtime = "edge";

export default async function LoggedInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar user={user} />
      {children}
    </>
  );
}

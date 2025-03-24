import LoginForm from "@/components/login-form";
import { getCurrentUser } from "@/server/auth.actions";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) redirect("/dashboard");

  return <LoginForm />;
}

import Profile from "@/components/profile";
import { getCategories } from "@/server/categories.actions";
import { getCurrentUser } from "@/server/auth.actions";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  const initialCategories = await getCategories();

  return <Profile user={user} initialCategories={initialCategories} />;
}

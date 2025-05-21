import Profile from "@/components/profile";
import { getCategories } from "@/server/categories.actions";
import { getCurrentUser } from "@/server/auth.actions";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const initialCategories = await getCategories();

  return <Profile user={user} initialCategories={initialCategories} />;
}

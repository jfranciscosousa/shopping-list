import Profile from "@/components/profile";
import { getCategories } from "@/server/categories.actions";
import { getCurrentUserOptional } from "@/server/auth.actions";

export default async function ProfilePage() {
  const user = await getCurrentUserOptional();
  if (!user) return null;
  const initialCategories = await getCategories();

  return <Profile user={user} initialCategories={initialCategories} />;
}

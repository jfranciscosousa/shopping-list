import ShoppingListApp from "@/components/shopping-list-app";
import { getItems } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  return <ShoppingListApp shoppingItems={await getItems()} />;
}

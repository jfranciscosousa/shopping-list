import ShoppingListApp from "@/components/shopping-list-app";
import { getItems } from "@/server/actions";
import { getCurrentUser } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  return <ShoppingListApp initialShoppingItems={await getItems()} />;
}

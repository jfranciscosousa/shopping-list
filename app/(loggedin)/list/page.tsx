import ShoppingList from "@/components/shopping-list";
import { getItems } from "@/server/shopping-items.actions";
import { getCurrentUser } from "@/server/auth.actions";
import { redirect } from "next/navigation";

export default async function ListPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  return <ShoppingList initialShoppingItems={await getItems()} />;
}

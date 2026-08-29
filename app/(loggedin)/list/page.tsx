import ShoppingList from "@/components/shopping-list";
import { getCurrentUserOptional } from "@/server/auth.actions";
import { getItems } from "@/server/shopping-items.actions";

export default async function ListPage() {
  const user = await getCurrentUserOptional();
  if (!user) return null;

  return <ShoppingList initialShoppingItems={await getItems()} />;
}

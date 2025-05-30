import ShoppingList from "@/components/shopping-list";
import { getItems } from "@/server/shopping-items.actions";

export default async function ListPage() {
  return <ShoppingList initialShoppingItems={await getItems()} />;
}

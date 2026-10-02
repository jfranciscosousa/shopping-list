import ShoppingList from "@/components/shopping-list";
import type { getItems } from "@/server/shopping-items.actions";

export default function ShoppingListPage({
  data,
}: {
  data: { items: Awaited<ReturnType<typeof getItems>>; introDismissed: boolean } | null;
}) {
  if (!data) return null;

  return (
    <ShoppingList initialShoppingItems={data.items} initialIntroDismissed={data.introDismissed} />
  );
}

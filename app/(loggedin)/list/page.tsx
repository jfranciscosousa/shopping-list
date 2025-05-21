import ShoppingList from "@/components/shopping-list";
import { getItems } from "@/server/shopping-items.actions";
import { getCurrentUser } from "@/server/auth.actions";
import LoginForm from "@/components/login-form";

export default async function ListPage() {
  const user = await getCurrentUser();

  if (!user) return <LoginForm />;

  return <ShoppingList initialShoppingItems={await getItems()} />;
}

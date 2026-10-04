import { createFileRoute } from "@tanstack/react-router";
import ShoppingListPage from "@/components/shopping-list-page";
import { getItems } from "@/server/shopping-items.actions";

export const Route = createFileRoute("/_app/list")({
  loader: async ({ context: { user } }) =>
    user ? { items: await getItems(), introDismissed: user.config.introDismissed === true } : null,
  component: ShoppingPage,
});

function ShoppingPage() {
  return <ShoppingListPage data={Route.useLoaderData()} />;
}

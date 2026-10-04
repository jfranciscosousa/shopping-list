import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/components/profile";
import { getCategories } from "@/server/categories.actions";

export const Route = createFileRoute("/_app/profile")({
  loader: async ({ context: { user } }) =>
    user ? { user, categories: await getCategories() } : null,
  component: ProfilePage,
});

function ProfilePage() {
  const data = Route.useLoaderData();
  return data ? <Profile user={data.user} initialCategories={data.categories} /> : null;
}

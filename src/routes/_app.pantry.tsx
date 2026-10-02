import { createFileRoute } from "@tanstack/react-router";
import Pantry from "@/components/pantry/pantry";
import { getAreasAndItems } from "@/server/pantry.actions";

export const Route = createFileRoute("/_app/pantry")({
  loader: ({ context: { user } }) => (user ? getAreasAndItems() : null),
  component: PantryPage,
});

function PantryPage() {
  const areas = Route.useLoaderData();
  return areas ? <Pantry initialAreas={areas} /> : null;
}

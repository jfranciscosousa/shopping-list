import { getAreasAndItems } from "@/server/pantry.actions";
import Pantry from "@/components/pantry/pantry";
import { getCurrentUserOptional } from "@/server/auth.actions";

export default async function PantryPage() {
  const user = await getCurrentUserOptional();
  if (!user) return null;

  const initialAreas = await getAreasAndItems();

  return <Pantry initialAreas={initialAreas} />;
}

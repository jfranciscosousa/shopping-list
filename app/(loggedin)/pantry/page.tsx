import { getAreasAndItems } from "@/server/pantry.actions";
import Pantry from "@/components/pantry/pantry";

export default async function PantryPage() {
  const initialAreas = await getAreasAndItems();

  return <Pantry initialAreas={initialAreas} />;
}

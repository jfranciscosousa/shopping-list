"use client";

import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AreaDialog from "./area-dialog";
import ItemDialog from "./item-dialog";
import PantryAreaCard from "./pantry-area-card";
import { usePantryAreas } from "@/hooks/use-pantry";
import { PantryAreaWithItems } from "@/server/pantry.actions";
import { PantryArea, PantryItem } from "@prisma/client";
import { isExpired } from "./helpers";

type Props = {
  initialAreas: PantryAreaWithItems[];
};

export default function PantryManager({ initialAreas }: Props) {
  const { data: areas = [] } = usePantryAreas(initialAreas);
  const [itemDialog, setItemDialog] = useState<
    PantryItem | boolean | undefined
  >();
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>(
    undefined,
  );
  const [areaDialog, setAreaDialog] = useState<
    PantryArea | boolean | undefined
  >(undefined);

  const expiredItems = areas
    .flatMap((area) => area.pantryItems)
    .filter((item) => isExpired(item.expiresAt));

  const openAddItemDialog = (areaId?: number) => {
    setSelectedAreaId(areaId);
    setItemDialog(true);
  };

  const openEditItemDialog = (item: PantryItem) => {
    setSelectedAreaId(item.pantryAreaId);
    setItemDialog(item);
  };

  const openEditAreaDialog = (area: PantryArea) => {
    setAreaDialog(area);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6 sm:flex-row flex-col text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-bold">Pantry Manager</h1>
          <p className="text-muted-foreground">
            Keep track of pantry items and their expiry dates
          </p>
        </div>

        <div className="flex gap-2 mt-4 sm:mt-0 text-nowrap">
          <Button onClick={() => setAreaDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Area
          </Button>
          <Button onClick={() => openAddItemDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Expired Items Alert */}
      {expiredItems.length > 0 && (
        <Alert className="mb-6 border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> You have {expiredItems.length} expired
            item{expiredItems.length > 1 ? "s" : ""}:{" "}
            {expiredItems.map((item) => item.name).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => (
          <PantryAreaCard
            key={area.id}
            area={area}
            onEditArea={() => openEditAreaDialog(area)}
            onAddItem={() => openAddItemDialog(area.id)}
            onEditItem={openEditItemDialog}
          />
        ))}

        {areas.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">
              No areas created yet. Add your first area to get started!
            </p>
            <Button onClick={() => setAreaDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Area
            </Button>
          </div>
        )}
      </div>

      <AreaDialog
        open={!!areaDialog}
        onOpenChange={setAreaDialog}
        area={typeof areaDialog === "object" ? areaDialog : undefined}
      />

      <ItemDialog
        open={!!itemDialog}
        onOpenChange={setItemDialog}
        areas={areas}
        selectedAreaId={selectedAreaId}
        item={typeof itemDialog === "object" ? itemDialog : undefined}
      />
    </div>
  );
}

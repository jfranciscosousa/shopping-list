"use client";

import type React from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePantryItemsAdd, usePantryItemsUpdate } from "@/hooks/use-pantry";
import { PantryArea, PantryItem } from "@prisma/client";
import { toast } from "@/hooks/use-toast";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PantryItem;
  areas?: PantryArea[];
  selectedAreaId?: number;
}

export default function EditItemDialog({
  open,
  onOpenChange,
  item,
  areas,
  selectedAreaId,
}: EditItemDialogProps) {
  const createMutation = usePantryItemsAdd();
  const updateMutation = usePantryItemsUpdate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isEdit = !!item;
    const formData = new FormData(e.currentTarget);

    if (isEdit) {
      updateMutation.mutate(formData, {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: () => {
          toast({
            title: "Failed to update item",
            variant: "destructive",
          });
        },
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: () => {
          toast({
            title: "Failed to create item",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {item ? "Edit Item" : "Add Item"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {item
                ? "Update the item details and expiry information."
                : "Add a new item to your pantry."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {item && <input type="hidden" name="id" value={item.id} />}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-item-name">Item Name</Label>
              <Input
                name="name"
                placeholder="e.g., Milk, Bread, Chicken"
                defaultValue={item?.name}
                required
              />
            </div>

            {areas && item && (
              <div className="grid gap-2">
                <Label htmlFor="edit-item-area">Storage Area</Label>
                <Select
                  name="pantryAreaId"
                  defaultValue={item?.pantryAreaId.toString()}
                  value={selectedAreaId?.toString()}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!item && (
              <input
                type="hidden"
                name="pantryAreaId"
                value={selectedAreaId?.toString() || ""}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-made-date">Made/Bought Date</Label>
                <Input
                  name="producedAt"
                  type="date"
                  defaultValue={item?.producedAt.toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-expiry-date">Expiry Date</Label>
                <Input
                  name="expiresAt"
                  type="date"
                  defaultValue={item?.expiresAt.toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <Button
              type="button"
              onClick={handleCancel}
              isLoading={createMutation.isPending || updateMutation.isPending}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save Changes
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

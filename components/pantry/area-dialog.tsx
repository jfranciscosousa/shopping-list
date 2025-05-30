"use client";

import type { FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePantryAreasAdd, usePantryAreasUpdate } from "@/hooks/use-pantry";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { PantryArea } from "@prisma/client";

interface AreaDialogProps {
  open: boolean;
  area?: PantryArea;
  onOpenChange: (open: boolean) => void;
}

export default function AreaDialog({
  open,
  area,
  onOpenChange,
}: AreaDialogProps) {
  const addAreaMutation = usePantryAreasAdd();
  const updateAreaMutation = usePantryAreasUpdate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    if (area) {
      updateAreaMutation.mutate(formData, {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: () => {
          toast({
            title: "Failed to update area",
            variant: "destructive",
          });
        },
      });
    } else {
      addAreaMutation.mutate(formData, {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: () => {
          toast({
            title: "Failed to add area",
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
              {area ? "Edit Area" : "Add New Area"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {area
                ? "Update the area name."
                : "Create a new storage area for your pantry items."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {area && <input type="hidden" name="id" value={area.id} />}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="area-name">Area Name</Label>
              <Input
                name="name"
                placeholder="e.g., Refrigerator, Freezer, Pantry"
                required
                defaultValue={area?.name}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              isLoading={
                addAreaMutation.isPending || updateAreaMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={
                addAreaMutation.isPending || updateAreaMutation.isPending
              }
            >
              {area ? "Save Changes" : "Add Area"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

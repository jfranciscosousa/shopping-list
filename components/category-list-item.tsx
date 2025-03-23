"use client";

import { Button } from "@/components/ui/button";
import {
  useCategories,
  useCategoriesDelete,
  useCategoriesUpdate,
} from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@prisma/client";
import { ArrowDown, ArrowUp, Edit, X } from "lucide-react";
import { useState } from "react";
import { CategoryListItemUpdate } from "./category-list-item-update";

type Props = {
  index: number;
  category: Category;
};

export default function CategoryListItem({ index, category }: Props) {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories([]);
  const updateCategoriesMutation = useCategoriesUpdate();
  const deleteCategoriesMutation = useCategoriesDelete();

  function handleRemoveCategory() {
    deleteCategoriesMutation.trigger(category.id, {
      onSuccess: () => toast({ title: "Category deleted" }),
      onError: () =>
        toast({ title: "Failed to delete category", variant: "destructive" }),
    });
  }

  function handleMoveCategory(direction: "up" | "down") {
    // Get a sorted copy of the categories by sortIndex
    const sortedCategories = categories
      .slice()
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));

    // Find the current position of the category by its id
    const currentIndex = sortedCategories.findIndex(
      (category) => category.id === category.id
    );
    if (currentIndex === -1) return; // id not found

    // Determine the new index based on direction
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    // Remove the category from its current position
    const [movedCategory] = sortedCategories.splice(currentIndex, 1);
    // Insert it into its new position
    sortedCategories.splice(targetIndex, 0, movedCategory);

    // Reassign sortIndex values based on the new order
    sortedCategories.forEach((category, index) => {
      if (category.sortIndex !== index) {
        updateCategoriesMutation.trigger({ id: category.id, sortIndex: index });
      }
    });
  }

  function handleEditCategory() {}

  return (
    <li key={category.id} className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between">
          <div className="font-medium">{category.name}</div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMoveCategory("up")}
            disabled={index === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMoveCategory("down")}
            disabled={index === categories.length - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <CategoryListItemUpdate category={category} />
          <Button variant="ghost" size="icon" onClick={handleRemoveCategory}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {category.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          {category.description}
        </div>
      )}
    </li>
  );
}

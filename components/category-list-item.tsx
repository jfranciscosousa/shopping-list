"use client";

import { Button } from "@/components/ui/button";
import { useCategoriesDelete } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Category } from "@prisma/client";
import { GripVertical, X } from "lucide-react";
import { CategoryListItemUpdate } from "./category-list-item-update";
import { cn } from "@/lib/utils";

type Props = {
  id: number;
  category: Category;
};

export default function CategoryListItem({ id, category }: Props) {
  const { toast } = useToast();
  const deleteCategoriesMutation = useCategoriesDelete();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleRemoveCategory() {
    deleteCategoriesMutation.trigger(category.id, {
      onSuccess: () => toast({ title: "Category deleted" }),
      onError: () =>
        toast({ title: "Failed to delete category", variant: "destructive" }),
    });
  }

  return (
    <li className="select-none" ref={setNodeRef} style={style}>
      <div className="flex items-center justify-between">
        <div
          className={cn("p-4 grow cursor-grab", {
            "cursor-grabbing": isDragging,
          })}
          {...attributes}
          {...listeners}
        >
          <div className="flex items-center gap-1">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <div className="font-medium">{category.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
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

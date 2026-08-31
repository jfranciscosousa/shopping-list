"use client";

import { Button } from "@/components/ui/button";
import { useCategoriesDelete } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "@/server/db/schema";
import { GripVertical, X } from "lucide-react";
import { CategoryListItemUpdate } from "./category-list-item-update";
import { CATEGORY_EMOJI_FALLBACK } from "@/lib/category-emojis";
import { cn } from "@/lib/utils";

type Props = {
  id: number;
  category: Category;
};

export default function CategoryListItem({ id, category }: Props) {
  const { toast } = useToast();
  const deleteCategoriesMutation = useCategoriesDelete();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleRemoveCategory() {
    deleteCategoriesMutation.mutate(category.id, {
      onSuccess: () => toast({ title: "Category deleted" }),
    });
  }

  return (
    <li
      className={cn("touch-none bg-card/40 transition-colors hover:bg-secondary/25", {
        "relative z-10 bg-card shadow-lg": isDragging,
      })}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <div
              className={cn("cursor-grab p-3", {
                "cursor-grabbing": isDragging,
              })}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4 cursor-move text-muted-foreground" />
            </div>
            <span className="text-lg" aria-hidden="true">
              {category.emoji ?? CATEGORY_EMOJI_FALLBACK}
            </span>
            <div className="truncate font-medium">{category.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <CategoryListItemUpdate category={category} />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={handleRemoveCategory}
            aria-label={`Delete ${category.name}`}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {category.description && (
        <div className="px-12 pb-4 pr-4 text-sm leading-6 text-muted-foreground">
          {category.description}
        </div>
      )}
    </li>
  );
}

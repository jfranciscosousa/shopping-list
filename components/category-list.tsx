"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CATEGORIES_QUERY_KEY,
  useCategories,
  useCategoriesAdd,
  useCategoriesUpdateBulk,
} from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/server/db/schema";
import { GripVertical, Plus } from "lucide-react";
import type React from "react";
import { useId } from "react";
import CategoryListItem from "./category-list-item";
import { Textarea } from "./ui/textarea";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  initialCategories: Category[];
};

export default function CategoryList({ initialCategories }: Props) {
  const queryClient = useQueryClient();
  const id = useId();
  const { toast } = useToast();
  const { data: categories = [] } = useCategories(initialCategories);
  const addCategoriesMutation = useCategoriesAdd();
  const updateCategoriesBulkMutation = useCategoriesUpdateBulk();

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  function handleAddCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);

    addCategoriesMutation.mutate(formData, {
      onError: (error) => {
        toast({
          title: "Failed to add new category",
          description: (error as Error).message,
          variant: "destructive",
        });
      },
    });

    formEl.reset();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex((category) => category.id === active.id);
      const newIndex = categories.findIndex((category) => category.id === over?.id);
      const newCategories = arrayMove(categories, oldIndex, newIndex);

      queryClient.setQueryData(CATEGORIES_QUERY_KEY, newCategories);

      const formData = new FormData();
      // Update sortIndex on the server
      newCategories.forEach((category, index) => {
        if (category.sortIndex !== index) {
          formData.append(String(category.id), index.toString());
        }
      });

      updateCategoriesBulkMutation.mutate(formData);
    }
  }

  return (
    <div>
      <CardHeader className="px-0 pt-0">
        <CardTitle className="font-display text-3xl font-normal">Shopping categories</CardTitle>
        <CardDescription>Customize the aisles used to organize your shopping list.</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <form
          className="mb-8 space-y-5 rounded-2xl border border-border/70 bg-secondary/25 p-4 sm:p-5"
          onSubmit={handleAddCategory}
        >
          <div>
            <h3 className="font-semibold">Add a new aisle</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A good description helps AI sort each item correctly.
            </p>
          </div>
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Category name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Electronics"
              className="mt-2 h-11 rounded-xl bg-background/70"
              required
            />
          </div>

          <div>
            <label htmlFor="new-category-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what items belong in this category..."
              className="mt-2 rounded-xl bg-background/70"
              rows={3}
            />
          </div>

          <Button type="submit" className="h-10 rounded-xl">
            <Plus className="size-4" /> Add category
          </Button>
        </form>

        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">Your aisle order</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag categories to match your usual route through the store.
            </p>
          </div>
          <GripVertical className="hidden size-5 text-muted-foreground sm:block" />
        </div>

        <DndContext
          id={id}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={categories} strategy={verticalListSortingStrategy}>
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-background/40">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No categories defined. Add some categories to get started.
                </div>
              ) : (
                <ul className="divide-y">
                  {categories.map((category) => (
                    <CategoryListItem key={category.id} id={category.id} category={category} />
                  ))}
                </ul>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </div>
  );
}

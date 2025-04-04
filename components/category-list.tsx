"use client";

import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useCategories,
  useCategoriesAdd,
  useCategoriesUpdate,
} from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@prisma/client";
import { Plus } from "lucide-react";
import { FormEvent, useId } from "react";
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
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

type Props = {
  initialCategories: Category[];
};

export default function CategoryList({ initialCategories }: Props) {
  const id = useId();
  const { toast } = useToast();
  const { data: categories = [], mutate } = useCategories(initialCategories);
  const addCategoriesMutation = useCategoriesAdd();
  const updateCategoriesMutation = useCategoriesUpdate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);

    addCategoriesMutation.trigger(formData, {
      onSuccess: () => {
        toast({ title: "New category added" });
        formEl.reset();
      },
      onError: (error) => {
        toast({
          title: "Failed to add new category",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex(
        (category) => category.id === active.id,
      );
      const newIndex = categories.findIndex(
        (category) => category.id === over?.id,
      );
      const newCategories = arrayMove(categories, oldIndex, newIndex);

      mutate(newCategories, false);

      // Update sortIndex on the server
      newCategories.forEach((category, index) => {
        if (category.sortIndex !== index) {
          const formData = new FormData();
          formData.set("id", category.id.toString());
          formData.set("sortIndex", index.toString());

          updateCategoriesMutation.trigger(formData);
        }
      });
    }
  }

  return (
    <div>
      <CardHeader className="px-0">
        <CardTitle>Shopping Categories</CardTitle>
        <CardDescription>
          Customize the categories used to organize your shopping list
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <form className="space-y-4 mb-6" onSubmit={handleAddCategory}>
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              New Category Name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Electronics"
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="new-category-description"
              className="text-sm font-medium"
            >
              Description (helps the AI categorize items)
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what items belong in this category..."
              className="mt-1"
              rows={3}
            />
          </div>

          <Button disabled={addCategoriesMutation.isMutating} type="submit">
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </form>

        <DndContext
          id={id}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories}
            strategy={verticalListSortingStrategy}
          >
            <div className="border rounded-md">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No categories defined. Add some categories to get started.
                </div>
              ) : (
                <ul className="divide-y">
                  {categories.map((category) => (
                    <CategoryListItem
                      key={category.id}
                      id={category.id}
                      category={category}
                    />
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

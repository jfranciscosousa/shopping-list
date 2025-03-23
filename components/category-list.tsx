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
  useCategoriesAdd
} from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@prisma/client";
import { Plus } from "lucide-react";
import { FormEvent } from "react";
import CategoryListItem from "./category-list-item";
import { Textarea } from "./ui/textarea";

type Props = {
  initialCategories: Category[];
};

export default function CategoryList({ initialCategories }: Props) {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories(initialCategories);
  const addCategoriesMutation = useCategoriesAdd();

  function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name.trim()) return;

    addCategoriesMutation.trigger(
      { name, description },
      {
        onSuccess: () => {
          toast({ title: "New category added" });
          formEl.reset();
        },
      }
    );
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

        <div className="border rounded-md">
          {categories.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No categories defined. Add some categories to get started.
            </div>
          ) : (
            <ul className="divide-y">
              {categories.map((category, index) => (
                <CategoryListItem key={index} {...{ category, index }} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </div>
  );
}

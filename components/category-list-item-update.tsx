import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCategoriesUpdate } from "@/hooks/use-categories";
import { toast } from "@/hooks/use-toast";
import { Category } from "@/generated/prisma";
import { Edit2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { InputField } from "./ui/input-field";
import { TextareaField } from "./ui/textarea-field";

interface UpdateMealModalProps {
  category: Category;
}

function Form({ category, setOpen }: UpdateMealModalProps & { setOpen: (open: boolean) => void }) {
  const updateCategoriesMutation = useCategoriesUpdate();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    updateCategoriesMutation.mutate(formData, {
      onError: () => {
        toast({ title: "Failed to update category", variant: "destructive" });
      },
    });

    setOpen(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <AlertDialogHeader>
        <AlertDialogTitle>Edit category</AlertDialogTitle>
        <AlertDialogDescription>
          Make changes to the category here. Click save when you&apos;re done.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="py-6 space-y-4">
        <input type="hidden" name="id" defaultValue={category.id} />

        <InputField label="Name" name="name" defaultValue={category.name} />

        <TextareaField
          label="Description"
          name="description"
          defaultValue={category.description || ""}
        />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
        <Button type="submit" name="_action" value="update">
          Save Changes
        </Button>
      </AlertDialogFooter>
    </form>
  );
}

export function CategoryListItemUpdate(props: UpdateMealModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground"
          onClick={() => setOpen(true)}
          aria-label={`Edit ${props.category.name}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>{open && <Form {...props} setOpen={setOpen} />}</AlertDialogContent>
    </AlertDialog>
  );
}

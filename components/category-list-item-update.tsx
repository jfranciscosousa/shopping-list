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
import { Category } from "@prisma/client";
import { Edit2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { InputField } from "./ui/input-field";
import { TextareaField } from "./ui/textarea-field";

interface UpdateMealModalProps {
  category: Category;
}

function Form({
  category,
  setOpen,
}: UpdateMealModalProps & { setOpen: (open: boolean) => void }) {
  const updateCategoriesMutation = useCategoriesUpdate();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    updateCategoriesMutation.trigger(formData, {
      onSuccess: () => {
        toast({ title: "Category updated" });
        setOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to update category", variant: "destructive" });
      },
    });
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
        <Button
          type="submit"
          name="_action"
          value="update"
          isLoading={updateCategoriesMutation.isMutating}
        >
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
          className="h-8 w-8"
          onClick={() => setOpen(true)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {open && <Form {...props} setOpen={setOpen} />}
      </AlertDialogContent>
    </AlertDialog>
  );
}

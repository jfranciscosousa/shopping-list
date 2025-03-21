"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useShoppingListDeleteItem,
  useShoppingListUpdateItem,
} from "@/hooks/use-shopping-list";
import { useToast } from "@/hooks/use-toast";
import { deleteItem, editItem } from "@/server/actions";
import { ShoppingItem } from "@prisma/client";
import { Edit, Save, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";

type Props = {
  item: ShoppingItem;
};

export default function ShoppingListItem({ item }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const updateItemMutation = useShoppingListUpdateItem();
  const deleteItemMutation = useShoppingListDeleteItem();
  const isMutating =
    updateItemMutation.isMutating || deleteItemMutation.isMutating;

  const saveEditItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newItem = new FormData(event.currentTarget).get("item") as string;

    if (!newItem.trim()) {
      deleteItemMutation.trigger(item.id);
      return;
    }

    try {
      const result = await updateItemMutation.trigger({
        itemId: item.id,
        newItem: newItem,
      });

      if (result.success && result.item) {
        setEditing(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to edit item",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error editing item:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <li className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
      {editing ? (
        <form
          className="flex items-center gap-2 flex-1"
          onSubmit={saveEditItem}
        >
          <Input
            name="item"
            defaultValue={item.name}
            autoFocus
            disabled={isMutating}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={isMutating}
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setEditing(false)}
            disabled={isMutating}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <>
          <span className="flex-1">
            {false ? <Skeleton className="h-6 w-full" /> : item.name}
          </span>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteItemMutation.trigger(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

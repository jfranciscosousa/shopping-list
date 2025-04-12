"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useShoppingListDeleteItem,
  useShoppingListUpdateItem,
} from "@/hooks/use-shopping-list";
import { useToast } from "@/hooks/use-toast";
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

  const saveEditItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newItem = new FormData(event.currentTarget).get("item") as string;

    if (!newItem.trim()) {
      deleteItemMutation.mutate(item.id);
      return;
    }

    updateItemMutation.mutate(
      {
        id: item.id,
        newName: newItem,
      },
      {
        onError: (error) => {
          toast({
            title: "Error",
            description: (error as Error).message || "Failed to edit item",
            variant: "destructive",
          });
        },
      },
    );

    setEditing(false);
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
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <Button type="submit" size="icon" variant="ghost">
            <Save className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <>
          <span className="flex-1">{item.name}</span>
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
              onClick={() => deleteItemMutation.mutate(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

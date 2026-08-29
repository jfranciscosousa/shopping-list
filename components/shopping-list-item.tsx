"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShoppingListDeleteItem, useShoppingListUpdateItem } from "@/hooks/use-shopping-list";
import type { ShoppingItem } from "@/server/db/schema";
import { Check, Pencil, Save, Trash2, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

type Props = {
  item: ShoppingItem;
};

export default function ShoppingListItem({ item }: Props) {
  const [editing, setEditing] = useState(false);
  const updateItemMutation = useShoppingListUpdateItem();
  const deleteItemMutation = useShoppingListDeleteItem();

  const saveEditItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newItem = new FormData(event.currentTarget).get("item") as string;

    if (!newItem.trim()) {
      deleteItemMutation.mutate(item.id);
      return;
    }

    updateItemMutation.mutate({ id: item.id, newName: newItem });

    setEditing(false);
  };

  return (
    <li className="group flex min-h-14 items-center justify-between border-b border-border/60 py-2.5 last:border-0">
      {editing ? (
        <form className="flex flex-1 items-center gap-1" onSubmit={saveEditItem}>
          <Input
            name="item"
            defaultValue={item.name}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <Button type="submit" size="icon" variant="ghost" aria-label="Save item">
            <Save className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setEditing(false)}
            aria-label="Cancel editing"
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <>
          <span className="flex flex-1 items-center gap-3 font-medium">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/5 text-primary">
              <Check className="size-3" />
            </span>
            {item.name}
          </span>
          <div className="flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 rounded-full text-muted-foreground"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${item.name}`}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => deleteItemMutation.mutate(item.id)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

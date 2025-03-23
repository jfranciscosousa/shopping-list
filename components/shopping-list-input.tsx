"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (newItem: string) => Promise<void>;
};

export default function ShoppingListInput({ onSubmit }: Props) {
  const [newItem, setNewItem] = useState("");
  const { toast } = useToast();

  async function handleAddItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemToSubmit = newItem;
    setNewItem("");
    (
      event.currentTarget.querySelector("input[name=item]") as HTMLInputElement
    ).focus();

    try {
      await onSubmit(itemToSubmit);
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={handleAddItemSubmit} className="flex gap-2">
      <Input
        name="item"
        placeholder="Add an item (e.g., eggs, milk, bread)"
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        className="flex-1"
      />
      <Button type="submit">
        <Plus className="mr-2 h-4 w-4" /> Add
      </Button>
    </form>
  );
}

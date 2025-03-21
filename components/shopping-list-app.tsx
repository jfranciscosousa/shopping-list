"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addItem, deleteAllItems, deleteItem } from "@/server/actions";
import { ShoppingItem } from "@prisma/client";
import { Loader, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import ListReset from "./list-reset";
import ShoppingListItem from "./shopping-list-item";

export default function ShoppingListApp({
  shoppingItems,
}: {
  shoppingItems: ShoppingItem[];
}) {
  const [newItem, setNewItem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleAddItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemToSubmit = newItem;
    setNewItem("");
    setIsLoading(true);

    try {
      await addItem(itemToSubmit);
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const resetList = async () => {
    await deleteAllItems();
    toast({
      title: "List Reset",
      description: "Your shopping list has been cleared.",
    });
  };

  // Group items by category
  const groupedItems = shoppingItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Smart Shopping List
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        <CardFooter className="flex justify-between">
          {isLoading ? <Loader className="animate-spin" /> : <div />}

          <ListReset resetList={resetList} />
        </CardFooter>
      </Card>

      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Your shopping list is empty. Add some items to get started!
        </div>
      ) : (
        Object.entries(groupedItems).map(([category, categoryItems]) => (
          <Card key={category} className="mb-4">
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center">
                <Badge variant="outline" className="mr-2">
                  {categoryItems.length}
                </Badge>
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <ul className="space-y-2">
                {categoryItems.map((item) => (
                  <ShoppingListItem key={item.id} item={item} />
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}

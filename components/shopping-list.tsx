"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useShoppingListItems,
  useShoppingListDeleteItemsByCategory,
} from "@/hooks/use-shopping-list";
import { useToast } from "@/hooks/use-toast";
import useWakeLock from "@/hooks/use-wake-lock";
import { getItems } from "@/server/shopping-items.actions";
import { Trash2 } from "lucide-react";
import ShoppingListInput from "./shopping-list-input";
import ShoppingListItem from "./shopping-list-item";

type Props = {
  initialShoppingItems: Awaited<ReturnType<typeof getItems>>;
};

export default function ShoppingList({ initialShoppingItems }: Props) {
  useWakeLock(useIsMobile());
  const { toast } = useToast();
  const { data = [] } = useShoppingListItems(initialShoppingItems);
  const deleteItemsByCategoryMutation = useShoppingListDeleteItemsByCategory();

  const handleDeleteCategory = (categoryId: number, categoryName: string) => {
    deleteItemsByCategoryMutation.mutate(categoryId, {
      onError: (error) => {
        toast({
          title: "Failed to delete items",
          description: (error as Error).message,
          variant: "destructive",
        });
      },
      onSuccess: () => {
        toast({
          title: "Items deleted",
          description: `All items in "${categoryName}" have been deleted.`,
        });
      },
    });
  };

  return (
    <main className="container mx-auto px-2 md:px-4 py-8 max-w-3xl">
      <ShoppingListInput />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">
            Total entries:{" "}
            {data.reduce(
              (acc, { shoppingItems }) => acc + shoppingItems.length,
              0,
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {Object.keys(data).length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Your shopping list is empty. Add some items to get started!
        </div>
      ) : (
        data.map(({ id, name, shoppingItems }) => (
          <Card key={name} className="mb-4">
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {shoppingItems.length}
                  </Badge>
                  {name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(id, name)}
                  disabled={deleteItemsByCategoryMutation.isPending}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  title={`Delete all items in ${name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <ul className="space-y-2">
                {shoppingItems.map((item) => (
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

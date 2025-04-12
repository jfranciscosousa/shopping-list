"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useShoppingListItems } from "@/hooks/use-shopping-list";
import useWakeLock from "@/hooks/use-wake-lock";
import { getItems } from "@/server/shopping-items.actions";
import ShoppingListInput from "./shopping-list-input";
import ShoppingListItem from "./shopping-list-item";

type Props = {
  initialShoppingItems: Awaited<ReturnType<typeof getItems>>;
};

export default function ShoppingList({ initialShoppingItems }: Props) {
  useWakeLock(useIsMobile());
  const { data = [] } = useShoppingListItems(initialShoppingItems);

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
        data.map(({ name, shoppingItems }) => (
          <Card key={name} className="mb-4">
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center">
                <Badge variant="outline" className="mr-2">
                  {shoppingItems.length}
                </Badge>
                {name}
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

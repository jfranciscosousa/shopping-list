"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useShoppingListAddItem,
  useShoppingListDeleteAllItems,
  useShoppingListItems,
} from "@/hooks/use-shopping-list";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import ListReset from "./list-reset";
import ShoppingListInput from "./shopping-list-input";
import ShoppingListItem from "./shopping-list-item";
import { getItems } from "@/server/shopping-items.actions";

type Props = {
  initialShoppingItems: Awaited<ReturnType<typeof getItems>>;
};

export default function ShoppingListApp({ initialShoppingItems }: Props) {
  const { toast } = useToast();
  const { data = [], isLoading: isLoadingItems } =
    useShoppingListItems(initialShoppingItems);
  const addItemMutation = useShoppingListAddItem();
  const deleteAllItemsMutation = useShoppingListDeleteAllItems();
  const isLoading =
    isLoadingItems ||
    addItemMutation.isMutating ||
    deleteAllItemsMutation.isMutating;

  const resetList = async () => {
    await deleteAllItemsMutation.trigger();
    toast({
      title: "List Reset",
      description: "Your shopping list has been cleared.",
    });
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Smart Shopping List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ShoppingListInput
            onSubmit={(newItem) => addItemMutation.trigger(newItem)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          {isLoading ? <Loader className="animate-spin" /> : <div />}

          <ListReset resetList={resetList} />
        </CardFooter>
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

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useShoppingListItems,
  useShoppingListDeleteItemsByCategory,
} from "@/hooks/use-shopping-list";
import { useToast } from "@/hooks/use-toast";
import useWakeLock from "@/hooks/use-wake-lock";
import { getItems } from "@/server/shopping-items.actions";
import { Leaf, ListChecks, ShoppingBasket, Trash2 } from "lucide-react";
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
  const itemCount = data.reduce((total, { shoppingItems }) => total + shoppingItems.length, 0);

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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-10 max-w-3xl">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Leaf className="size-4" />
          This week&apos;s market run
        </div>
        <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl lg:text-6xl">
          Everything you need,
          <span className="text-primary"> beautifully sorted.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Add a quick item or describe the whole plan. Smart Shopping will organize the rest into an
          aisle-ready list.
        </p>
      </header>

      <div className="mb-12 grid gap-5 lg:grid-cols-12">
        <ShoppingListInput />

        <Card className="overflow-hidden border-primary/15 bg-primary text-primary-foreground shadow-lg shadow-primary/10 lg:col-span-4">
          <CardHeader className="relative flex h-full min-h-48 flex-col justify-between">
            <div className="absolute -right-8 -top-8 size-36 rounded-full border border-primary-foreground/15" />
            <div className="absolute -bottom-16 -right-1 size-40 rounded-full bg-primary-foreground/5" />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">
                List overview
              </span>
              <ListChecks className="size-5 text-primary-foreground/70" />
            </div>
            <div className="relative mt-8">
              <CardTitle className="font-display text-5xl font-normal">{itemCount}</CardTitle>
              <CardDescription className="mt-1 text-primary-foreground/70">
                {itemCount === 1 ? "item" : "items"} across {data.length}{" "}
                {data.length === 1 ? "category" : "categories"}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      {Object.keys(data).length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
            <ShoppingBasket className="size-6" />
          </span>
          <h2 className="font-display text-2xl">Your basket is waiting</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Start with one ingredient above, or use the smart list to turn a meal plan into a full
            shop.
          </p>
        </div>
      ) : (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Aisle by aisle
              </p>
              <h2 className="mt-1 font-display text-3xl">Your shopping list</h2>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">Tap an item to edit it</p>
          </div>

          <div className="grid items-start gap-5 md:grid-cols-2">
            {data.map(({ id, name, shoppingItems }) => (
              <Card
                key={id}
                className="overflow-hidden border-border/80 bg-card/80 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="border-b border-border/70 bg-secondary/35 py-4">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="min-w-7 justify-center rounded-full bg-primary/10 text-primary shadow-none hover:bg-primary/10">
                        {shoppingItems.length}
                      </Badge>
                      <span className="font-display text-xl font-normal">{name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(id, name)}
                      disabled={deleteItemsByCategoryMutation.isPending}
                      className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title={`Delete all items in ${name}`}
                      aria-label={`Delete all items in ${name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-2">
                  <ul>
                    {shoppingItems.map((item) => (
                      <ShoppingListItem key={item.id} item={item} />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

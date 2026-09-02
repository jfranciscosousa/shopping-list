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
import { CATEGORY_EMOJI_FALLBACK } from "@/lib/category-emojis";
import { Leaf, ShoppingBasket, Trash2, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import ShoppingListInput from "./shopping-list-input";
import ShoppingListItem from "./shopping-list-item";
import QueryErrorAlert from "./query-error-alert";

const INTRO_DISMISSED_KEY = "smart-shopping:intro-dismissed";
const INTRO_PREFERENCE_EVENT = "smart-shopping:intro-preference-change";

function subscribeToIntroPreference(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(INTRO_PREFERENCE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(INTRO_PREFERENCE_EVENT, onStoreChange);
  };
}

function getIntroPreference() {
  return localStorage.getItem(INTRO_DISMISSED_KEY) !== "true";
}

type Props = {
  initialShoppingItems: Awaited<ReturnType<typeof getItems>>;
};

export default function ShoppingList({ initialShoppingItems }: Props) {
  useWakeLock(useIsMobile());
  const { toast } = useToast();
  const { data = [], isError, refetch } = useShoppingListItems(initialShoppingItems);
  const deleteItemsByCategoryMutation = useShoppingListDeleteItemsByCategory();
  const showIntro = useSyncExternalStore(
    subscribeToIntroPreference,
    getIntroPreference,
    () => true,
  );

  function dismissIntro() {
    localStorage.setItem(INTRO_DISMISSED_KEY, "true");
    window.dispatchEvent(new Event(INTRO_PREFERENCE_EVENT));
  }

  const handleDeleteCategory = (categoryId: number, categoryName: string) => {
    deleteItemsByCategoryMutation.mutate(categoryId, {
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
      {showIntro && (
        <Card className="relative mb-10 w-full rounded-[2rem] border-border/80 bg-card/80 p-6 pr-14 shadow-sm backdrop-blur-sm sm:p-8 sm:pr-16 lg:p-10 lg:pr-20">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-5 top-5 size-9 rounded-full text-muted-foreground sm:right-6 sm:top-6"
            onClick={dismissIntro}
            aria-label="Dismiss introduction"
          >
            <X className="size-4" />
          </Button>
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Leaf className="size-4" />
            This week&apos;s market run
          </div>
          <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl lg:text-6xl">
            Everything you need,
            <span className="text-primary"> beautifully sorted.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Add a quick item or describe the whole plan. Smart Shopping will organize the rest into
            an aisle-ready list.
          </p>
        </Card>
      )}

      <div className="mb-12">
        <ShoppingListInput />
      </div>

      {isError && <QueryErrorAlert retry={() => void refetch()} />}

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

          <div className="columns-[20rem] gap-5">
            {data.map(({ id, name, emoji, shoppingItems }) => (
              <Card
                key={id}
                className="mb-5 inline-block w-full break-inside-avoid overflow-hidden border-border/80 bg-card/80 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="border-b border-border/70 bg-secondary/35 py-4">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="min-w-7 justify-center rounded-full bg-primary/10 text-primary shadow-none hover:bg-primary/10">
                        {shoppingItems.length}
                      </Badge>
                      <span className="text-xl" aria-hidden="true">
                        {emoji ?? CATEGORY_EMOJI_FALLBACK}
                      </span>
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

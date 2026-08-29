"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShoppingListAddItem, useShoppingListAddMultiItem } from "@/hooks/use-shopping-list";
import useTabs from "@/hooks/use-tabs";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Plus, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import ShoppingListReset from "./shopping-list-reset";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function ShoppingListInput() {
  const { toast } = useToast();
  const { activeTab, setActiveTab } = useTabs("single");
  const [singleInput, setSingleInput] = useState("");
  const [multiInput, setMultiInput] = useState("");
  const addItemMutation = useShoppingListAddItem();
  const addMultiItemMutation = useShoppingListAddMultiItem();
  const isLoading = addItemMutation.isPending || addMultiItemMutation.isPending;

  async function handleSingle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemToSubmit = singleInput;
    setSingleInput("");
    (event.currentTarget.querySelector("input[name=item]") as HTMLInputElement).focus();

    addItemMutation.mutate(itemToSubmit, {
      onError: (error) => {
        console.error("Error adding single item:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      },
    });
  }

  async function handleMultiSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemToSubmit = multiInput;
    setMultiInput("");
    (event.currentTarget.querySelector("input[name=item]") as HTMLInputElement).focus();

    addMultiItemMutation.mutate(itemToSubmit, {
      onError: (error) => {
        console.error("Error adding multi item:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      },
    });
  }

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-sm lg:col-span-8">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Plus className="size-5" />
          </span>
          <div>
            <CardTitle className="font-display text-2xl font-normal">Build your list</CardTitle>
            <CardDescription className="mt-1">
              Add a staple or let AI unpack a whole meal plan.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl bg-muted/70 p-1">
            <TabsTrigger value="single" className="rounded-lg">
              Quick item
            </TabsTrigger>
            <TabsTrigger value="multi" className="rounded-lg gap-2">
              <Sparkles className="size-3.5" /> Smart list
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <form onSubmit={handleSingle} className="flex flex-col gap-3 sm:flex-row">
              <Input
                name="item"
                placeholder="Add an item (e.g., eggs, milk, bread)"
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                className="h-12 flex-1 rounded-xl bg-background/70 px-4"
                required
              />
              <Button type="submit" className="h-12 rounded-xl px-6" disabled={isLoading}>
                <Plus className="size-4" /> Add item
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="multi">
            <form onSubmit={handleMultiSubmit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                name="item"
                placeholder="Add a recipe, weekly shopping items, etc"
                value={multiInput}
                onChange={(e) => setMultiInput(e.target.value)}
                className="h-12 flex-1 rounded-xl bg-background/70 px-4"
                required
              />
              <Button type="submit" className="h-12 rounded-xl px-6" disabled={isLoading}>
                <Sparkles className="size-4" /> Organize
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-border/60 pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isLoading ? (
            <>
              <LoaderCircle className="size-4 animate-spin text-primary" /> Sorting your items...
            </>
          ) : (
            "AI categorizes every item automatically"
          )}
        </div>

        <ShoppingListReset />
      </CardFooter>
    </Card>
  );
}

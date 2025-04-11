"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import useTabs from "@/hooks/use-tabs";

type Props = {
  onSingleItemSubmit: (newItem: string) => Promise<void>;
  onMultiItemSubmit: (multiPrompt: string) => Promise<void>;
};

export default function ShoppingListInput({
  onSingleItemSubmit,
  onMultiItemSubmit,
}: Props) {
  const { activeTab, setActiveTab } = useTabs("single");
  const [singleInput, setSingleInput] = useState("");
  const [multiInput, setMultiInput] = useState("");

  const { toast } = useToast();

  async function handleSingle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemToSubmit = singleInput;
    setSingleInput("");
    (
      event.currentTarget.querySelector("input[name=item]") as HTMLInputElement
    ).focus();

    try {
      await onSingleItemSubmit(itemToSubmit);
    } catch (error) {
      console.error("Error adding single item:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  async function handleMultiSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemToSubmit = multiInput;
    setMultiInput("");
    (
      event.currentTarget.querySelector("input[name=item]") as HTMLInputElement
    ).focus();

    try {
      await onMultiItemSubmit(itemToSubmit);
    } catch (error) {
      console.error("Error adding multi item:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="single">Single</TabsTrigger>
        <TabsTrigger value="multi">Multiple</TabsTrigger>
      </TabsList>

      <TabsContent value="single">
        <form onSubmit={handleSingle} className="flex gap-2">
          <Input
            name="item"
            placeholder="Add an item (e.g., eggs, milk, bread)"
            value={singleInput}
            onChange={(e) => setSingleInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="multi">
        <form onSubmit={handleMultiSubmit} className="flex gap-2">
          <Input
            name="item"
            placeholder="Add a recipe, weekly shopping items, etc"
            value={multiInput}
            onChange={(e) => setMultiInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}

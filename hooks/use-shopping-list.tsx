"use client";

import {
  addItem,
  addMultiItem,
  deleteAllItems,
  deleteItem,
  editItem,
  getItems,
} from "@/server/shopping-items.actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useOptimisticUpdate from "./use-optimistic-update";

export const SHOPPING_QUERY_KEY = ["shopping-items"];

type ShoppingItem = Awaited<ReturnType<typeof getItems>>[number];

export function useShoppingListItems(
  initialShoppingItems: Awaited<ReturnType<typeof getItems>>,
) {
  return useQuery({
    queryKey: SHOPPING_QUERY_KEY,
    queryFn: getItems,
    initialData: initialShoppingItems,
  });
}

export function useShoppingListAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addItem,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: SHOPPING_QUERY_KEY }),
  });
}

export function useShoppingListAddMultiItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMultiItem,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: SHOPPING_QUERY_KEY }),
  });
}

export function useShoppingListUpdateItem() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<ShoppingItem>(SHOPPING_QUERY_KEY);

  return useMutation({
    mutationFn: ({ id, newName }: { id: number; newName: string }) =>
      editItem(id, newName),
    onMutate: async ({ id, newName }) =>
      optimisticUpdate((categories) =>
        categories.map((category) => ({
          ...category,
          shoppingItems: category.shoppingItems.map((item) =>
            id === item.id ? { ...item, name: newName } : item,
          ),
        })),
      ),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function useShoppingListDeleteAllItems() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<ShoppingItem>(SHOPPING_QUERY_KEY);

  return useMutation({
    mutationFn: deleteAllItems,
    onMutate: async () => optimisticUpdate(() => []),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function useShoppingListDeleteItem() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<ShoppingItem>(SHOPPING_QUERY_KEY);

  return useMutation({
    mutationFn: deleteItem,
    onMutate: async (id) =>
      optimisticUpdate((categories) =>
        categories.map((category) => ({
          ...category,
          shoppingItems: category.shoppingItems.filter(
            (item) => item.id !== id,
          ),
        })),
      ),
    onError: handleError,
    onSettled: handleSettled,
  });
}

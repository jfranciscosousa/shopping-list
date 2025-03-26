"use client";

import {
  addItem,
  deleteAllItems,
  deleteItem,
  editItem,
  getItems,
} from "@/server/shopping-items.actions";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

export function useShoppingListItems(
  initialShoppingItems: Awaited<ReturnType<typeof getItems>>,
) {
  return useSWR("getItems", getItems, {
    fallbackData: initialShoppingItems,
    refreshInterval: 300,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
  });
}

export function useShoppingListAddItem() {
  const addItemFn = (_url: string, { arg }: { arg: string }) => addItem(arg);

  return useSWRMutation("getItems", addItemFn);
}

export function useShoppingListUpdateItem() {
  const updateItemFn = (
    _url: string,
    { arg: { itemId, newItem } }: { arg: { itemId: number; newItem: string } },
  ) => editItem(itemId, newItem);

  return useSWRMutation("getItems", updateItemFn);
}

export function useShoppingListDeleteAllItems() {
  return useSWRMutation("getItems", deleteAllItems);
}

export function useShoppingListDeleteItem() {
  const deleteItemFn = (_url: string, { arg }: { arg: number }) =>
    deleteItem(arg);

  return useSWRMutation("getItems", deleteItemFn);
}

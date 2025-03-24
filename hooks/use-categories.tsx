"use client";

import {
  addCategory,
  deleteAllCategories,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/server/categories.actions";
import { Category } from "@prisma/client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const KEY = "categories";

export function useCategories(initialCategories: Category[]) {
  return useSWR(KEY, getCategories, {
    fallbackData: initialCategories,
    refreshInterval: 300,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
  });
}

type CategoryAddArgs = {
  arg: FormData;
};

export function useCategoriesAdd() {
  const fn = (_url: string, { arg }: CategoryAddArgs) => addCategory(arg);

  return useSWRMutation(KEY, fn);
}

type CategoryUpdateArgs = {
  arg: FormData;
};

export function useCategoriesUpdate() {
  const fn = (_url: string, { arg }: CategoryUpdateArgs) => updateCategory(arg);

  return useSWRMutation(KEY, fn);
}

export function useCategoriesDeleteAll() {
  return useSWRMutation(KEY, deleteAllCategories);
}

type CategoryDeleteArg = { arg: number };

export function useCategoriesDelete() {
  const fn = (_url: string, { arg }: CategoryDeleteArg) => deleteCategory(arg);

  return useSWRMutation(KEY, fn);
}

"use client";

import {
  addCategory,
  deleteAllCategories,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/server/actions";
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
  arg: {
    name: string;
    description?: string;
  };
};

export function useCategoriesAdd() {
  const fn = (_url: string, { arg: { name, description } }: CategoryAddArgs) =>
    addCategory(name, description);

  return useSWRMutation(KEY, fn);
}

type CategoryUpdateArgs = {
  arg: {
    id: number;
    name?: string;
    description?: string;
    sortIndex?: number;
  };
};

export function useCategoriesUpdate() {
  const fn = (
    _url: string,
    { arg: { id, name, description, sortIndex } }: CategoryUpdateArgs
  ) => updateCategory(id, name, description, sortIndex);

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

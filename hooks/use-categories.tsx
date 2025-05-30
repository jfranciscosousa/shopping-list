"use client";

import {
  addCategory,
  deleteAllCategories,
  deleteCategory,
  getCategories,
  updateCategory,
  updateCategoryBulk,
} from "@/server/categories.actions";
import { Category } from "@prisma/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import useOptimisticUpdate from "./use-optimistic-update";

export const CATEGORIES_QUERY_KEY = ["categories"];

export function useCategories(initialCategories: Category[]) {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: getCategories,
    initialData: initialCategories,
    refetchInterval: process.env.NODE_ENV === "production" ? 500 : false,
  });
}

export function useCategoriesAdd() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<Category>(CATEGORIES_QUERY_KEY);

  return useMutation({
    mutationFn: addCategory,
    onMutate: async (newCategory) =>
      optimisticUpdate((old: Category[]) => [
        {
          id: new Date().getTime(),
          userId: 0,
          name: newCategory.get("name") as string,
          description: newCategory.get("description") as string,
          sortIndex: Infinity,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...old,
      ]),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function useCategoriesUpdate() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<Category>(CATEGORIES_QUERY_KEY);

  return useMutation({
    mutationFn: updateCategory,
    onMutate: async (newCategory) =>
      optimisticUpdate((old: Category[]) =>
        old.map((category) =>
          category.id === Number(newCategory.get("id"))
            ? {
                ...category,
                name: newCategory.get("name") as string,
                description: newCategory.get("description") as string,
              }
            : category,
        ),
      ),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function useCategoriesUpdateBulk() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<Category>(CATEGORIES_QUERY_KEY);

  return useMutation({
    mutationFn: updateCategoryBulk,
    onMutate: async (newCategories) =>
      optimisticUpdate((old: Category[]) =>
        old.map((category) => {
          const newCategory = newCategories.find(
            (newCategory) => newCategory.get("id") === category.id.toString(),
          );

          if (!newCategory) return category;

          return category.id === Number(newCategory.get("id"))
            ? {
                ...category,
                sortIndex: Number(newCategory.get("sortIndex") as string),
              }
            : category;
        }),
      ),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function useCategoriesDeleteAll() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<Category>(CATEGORIES_QUERY_KEY);

  return useMutation({
    mutationFn: deleteAllCategories,
    onMutate: async () => optimisticUpdate(() => []),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function useCategoriesDelete() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<Category>(CATEGORIES_QUERY_KEY);

  return useMutation({
    mutationFn: deleteCategory,
    onMutate: async (id) =>
      optimisticUpdate((old) => old.filter((c) => c.id !== id)),
    onError: handleError,
    onSettled: handleSettled,
  });
}

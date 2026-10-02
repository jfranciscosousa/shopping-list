import {
  createArea,
  createItem,
  deleteArea,
  deleteItem,
  getAreasAndItems,
  PantryAreaWithItems,
  updateArea,
  updateItem,
} from "@/server/pantry.actions";
import { parseDateFromInput } from "@/lib/date-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requireSuccess } from "./action-result";
import useOptimisticUpdate from "./use-optimistic-update";

export const PANTRY_AREAS_QUERY_KEY = ["pantry-areas"];

export function usePantryAreas(initialAreas: PantryAreaWithItems[]) {
  return useQuery({
    queryKey: PANTRY_AREAS_QUERY_KEY,
    queryFn: () => getAreasAndItems(),
    initialData: initialAreas,
    refetchInterval: process.env.NODE_ENV === "production" ? 500 : false,
  });
}

export function usePantryAreasAdd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => requireSuccess(createArea({ data: formData })),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PANTRY_AREAS_QUERY_KEY,
      });
    },
  });
}

export function usePantryAreasUpdate() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<PantryAreaWithItems>(PANTRY_AREAS_QUERY_KEY);

  return useMutation({
    mutationFn: (formData: FormData) => requireSuccess(updateArea({ data: formData })),
    onMutate: async (newArea) =>
      optimisticUpdate((old: PantryAreaWithItems[]) =>
        old.map((area) =>
          area.id === newArea.get("id")
            ? {
                ...area,
                name: newArea.get("name") as string,
              }
            : area,
        ),
      ),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function usePantryAreasDelete() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<PantryAreaWithItems>(PANTRY_AREAS_QUERY_KEY);

  return useMutation({
    mutationFn: (id: string) => requireSuccess(deleteArea({ data: id })),
    onMutate: async (id) => optimisticUpdate((old) => old.filter((area) => area.id !== id)),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function usePantryItemsAdd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => requireSuccess(createItem({ data: formData })),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PANTRY_AREAS_QUERY_KEY,
      });
    },
  });
}

export function usePantryItemsUpdate() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<PantryAreaWithItems>(PANTRY_AREAS_QUERY_KEY);

  return useMutation({
    mutationFn: (formData: FormData) => requireSuccess(updateItem({ data: formData })),
    onMutate: async (newItem) =>
      optimisticUpdate((old: PantryAreaWithItems[]) =>
        old.map((area) =>
          area.id === newItem.get("pantryAreaId")
            ? {
                ...area,
                pantryItems: area.pantryItems.map((item) =>
                  item.id === newItem.get("id")
                    ? {
                        ...item,
                        name: newItem.get("name") as string,
                        producedAt: parseDateFromInput(newItem.get("producedAt")),
                        expiresAt: parseDateFromInput(newItem.get("expiresAt")),
                      }
                    : item,
                ),
              }
            : area,
        ),
      ),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function usePantryItemsDelete() {
  const { optimisticUpdate, handleError, handleSettled } =
    useOptimisticUpdate<PantryAreaWithItems>(PANTRY_AREAS_QUERY_KEY);

  return useMutation({
    mutationFn: (id: string) => requireSuccess(deleteItem({ data: id })),
    onMutate: async (id) =>
      optimisticUpdate((old: PantryAreaWithItems[]) =>
        old.map((area) => ({
          ...area,
          pantryItems: area.pantryItems.filter((item) => item.id !== id),
        })),
      ),
    onError: handleError,
    onSettled: handleSettled,
  });
}

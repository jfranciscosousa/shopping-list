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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    mutationFn: createArea,
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
    mutationFn: updateArea,
    onMutate: async (newArea) =>
      optimisticUpdate((old: PantryAreaWithItems[]) =>
        old.map((area) =>
          area.id === Number(newArea.get("id"))
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
    mutationFn: deleteArea,
    onMutate: async (id) =>
      optimisticUpdate((old) => old.filter((area) => area.id !== id)),
    onError: handleError,
    onSettled: handleSettled,
  });
}

export function usePantryItemsAdd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
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
    mutationFn: updateItem,
    onMutate: async (newItem) =>
      optimisticUpdate((old: PantryAreaWithItems[]) =>
        old.map((area) =>
          area.id === Number(newItem.get("pantryAreaId"))
            ? {
                ...area,
                pantryItems: area.pantryItems.map((item) =>
                  item.id === Number(newItem.get("id"))
                    ? {
                        ...item,
                        name: newItem.get("name") as string,
                        producedAt: new Date(
                          newItem.get("producedAt") as string,
                        ),
                        expiresAt: new Date(newItem.get("expiresAt") as string),
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
    mutationFn: deleteItem,
    onMutate: async (id) =>
      optimisticUpdate((old: PantryAreaWithItems[]) =>
        old.map((area) =>
          area.id === Number(id)
            ? {
                ...area,
                pantryItems: area.pantryItems.filter(
                  (item) => item.id !== Number(id),
                ),
              }
            : area,
        ),
      ),
    onError: handleError,
    onSettled: handleSettled,
  });
}

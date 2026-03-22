import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export default function useOptimisticUpdate<T>(queryKey: string[]) {
  const queryClient = useQueryClient();

  type UpdateFn = (oldCategories: T[]) => T[];

  const optimisticUpdate = useCallback(
    async (updateFn: UpdateFn) => {
      await queryClient.cancelQueries({ queryKey });

      const previousCategories = queryClient.getQueryData(queryKey) as T[] | undefined;

      queryClient.setQueryData(queryKey, updateFn);

      return { previousCategories };
    },
    [queryClient, queryKey],
  );

  const handleError = useCallback(
    (_err: unknown, _category: unknown, context?: Record<string, unknown>) => {
      queryClient.setQueryData(queryKey, context?.previousCategories);
    },
    [queryClient, queryKey],
  );

  const handleSettled = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { optimisticUpdate, handleError, handleSettled };
}

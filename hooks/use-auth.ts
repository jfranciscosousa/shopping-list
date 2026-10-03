"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { login, logout, signup } from "@/server/auth.actions";
import { requireSuccess } from "./action-result";

export function useResetAuthCache() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async () => {
    const sessionQueryClient = router.options.context.sessionQueryClient;
    await Promise.all([queryClient.cancelQueries(), sessionQueryClient.cancelQueries()]);
    queryClient.clear();
    sessionQueryClient.clear();
    router.clearCache();
    await router.navigate({ to: ".", search: {}, replace: true });
    await router.invalidate();
  };
}

export function useLogin() {
  const resetCache = useResetAuthCache();

  return useMutation({
    mutationFn: (formData: FormData) => requireSuccess(login({ data: formData })),
    onSuccess: resetCache,
  });
}

export function useSignup() {
  const resetCache = useResetAuthCache();

  return useMutation({
    mutationFn: (formData: FormData) => requireSuccess(signup({ data: formData })),
    onSuccess: resetCache,
  });
}

export function useLogout() {
  const resetCache = useResetAuthCache();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => requireSuccess(logout()),
    onMutate: () =>
      Promise.all([
        queryClient.cancelQueries(),
        router.options.context.sessionQueryClient.cancelQueries(),
      ]),
    onSuccess: async () => {
      await resetCache();
      await router.navigate({ to: "/", replace: true });
    },
  });
}

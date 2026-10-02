"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { login, logout, signup } from "@/server/auth.actions";
import { requireSuccess } from "./action-result";

function useResetAuthCache() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
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
    onMutate: () => queryClient.cancelQueries(),
    onSuccess: async () => {
      await resetCache();
      await router.navigate({ to: "/", replace: true });
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { login, logout, signup } from "@/server/auth.actions";
import { requireSuccess } from "./action-result";

function useResetAuthCache() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
  };
}

export function useLogin() {
  const resetCache = useResetAuthCache();

  return useMutation({
    mutationFn: (formData: FormData) => requireSuccess(login(formData)),
    onSuccess: resetCache,
  });
}

export function useSignup() {
  const resetCache = useResetAuthCache();

  return useMutation({
    mutationFn: (formData: FormData) => requireSuccess(signup(formData)),
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
      router.replace("/");
    },
  });
}

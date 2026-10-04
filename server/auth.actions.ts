import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as auth from "./auth.server";

export type { UserWithoutPassword } from "./auth.server";

export const getCurrentUserOptional = createServerFn({ method: "GET" }).handler(() =>
  auth.getCurrentUserOptional(),
);

export const login = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => auth.login(data));

export const signup = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => auth.signup(data));

export const logout = createServerFn({ method: "POST" }).handler(() => auth.logout());

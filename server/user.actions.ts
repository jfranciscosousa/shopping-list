import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { updateUser as update } from "./user.server";

export const updateUser = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => update(data));

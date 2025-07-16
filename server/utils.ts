import { z } from "zod";
import { getCurrentUser } from "./auth.actions";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export function validateFormData<T extends z.ZodType>(
  formData: FormData,
  schema: T,
): z.ZodSafeParseResult<z.core.output<T>> {
  const obj = Object.fromEntries(formData);

  return schema.safeParse(obj);
}

import { z } from "zod";
import { getCurrentUser } from "./auth.actions";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function validateFormData<T extends z.ZodType>(
  formData: FormData,
  schema: T,
): Promise<z.SafeParseReturnType<T["_input"], T["_output"]>> {
  const obj = Object.fromEntries(formData);

  return schema.safeParse(obj);
}

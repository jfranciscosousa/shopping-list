"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./password";
import { db } from "./db";
import { users } from "./db/schema";
import { requireAuth, validateFormData } from "./utils";
import { withActionHandling } from "./error-handler";

const updateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.email("Invalid email address").optional(),
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").or(z.literal("")),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
    message: "Confirm password must match password",
    path: ["confirmPassword"],
  });

export const updateUser = withActionHandling("updateUser", async (formData: FormData) => {
  const user = await requireAuth();

  if (!user) return { success: false, error: "Must be logged in" };

  const validateResult = validateFormData(formData, updateUserSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, email, currentPassword, newPassword, confirmPassword } = validateResult.data;

  const [userWithPassword] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!userWithPassword) return { success: false, error: "User not found" };

  if (newPassword && !(await verifyPassword(userWithPassword!.password, currentPassword))) {
    return { success: false, error: "Current password is incorrect" };
  }

  if (newPassword && newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  await db
    .update(users)
    .set({
      email,
      name,
      password: newPassword ? await hashPassword(newPassword) : userWithPassword.password,
    })
    .where(eq(users.id, user.id));

  return { success: true };
});

"use server";

import { z } from "zod";
import { hashPassword, verifyPassword } from "./password";
import prisma from "./prisma";
import { requireAuth, validateFormData } from "./utils";

const updateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.email("Invalid email address").optional(),
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .or(z.literal("")),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.newPassword || data.newPassword === data.confirmPassword,
    {
      message: "Confirm password must match password",
      path: ["confirmPassword"],
    },
  );

export async function updateUser(formData: FormData) {
  const user = await requireAuth();

  if (!user) return { success: false, error: "Must be logged in" };

  const validateResult = validateFormData(formData, updateUserSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, email, currentPassword, newPassword, confirmPassword } =
    validateResult.data;

  const userWithPassword = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (
    newPassword &&
    !(await verifyPassword(userWithPassword!.password, currentPassword))
  ) {
    return { success: false, error: "Current password is incorrect" };
  }

  if (newPassword && newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email,
      name,
      password: newPassword
        ? await hashPassword(newPassword)
        : userWithPassword!.password,
    },
  });

  return { success: true };
}

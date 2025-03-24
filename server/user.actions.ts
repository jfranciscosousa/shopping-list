"use server";

import argon2 from "argon2";
import prisma from "./prisma";
import { requireAuth } from "./utils";

export async function updateUser(formData: FormData) {
  const user = await requireAuth();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!user) return { success: false, error: "Must be logged in" };

  const userWithPassword = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (
    newPassword &&
    !(await argon2.verify(userWithPassword!.password, currentPassword))
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
        ? await argon2.hash(newPassword)
        : userWithPassword!.password,
    },
  });

  return { success: true };
}

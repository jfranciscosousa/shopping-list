"use server";

import argon2 from "argon2";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import prisma from "./prisma";
import { Category } from "@prisma/client";

async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

async function categoryFromAI(
  item: string,
  user: { id: number }
): Promise<Category> {
  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
    },
  });

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `
      Categorize this grocery item: "${item}"

      Return ONLY ONE of these category IDs (not the description) without any explanation or additional text.

      Categories: ${JSON.stringify(categories)}
    `,
    temperature: 0.1,
    maxTokens: 10,
  });

  const category = await prisma.category.findUnique({
    where: { id: Number(text) },
  });

  if (!category) throw new Error("AI returned an unknown category");

  return category;
}

export async function addItem(item: string): Promise<void> {
  const user = await requireAuth();

  try {
    try {
      await prisma.shoppingItem.create({
        data: {
          name: item,
          categoryId: (await categoryFromAI(item, user)).id,
          userId: user.id,
        },
      });

      revalidatePath("/dashboard");
    } catch (error) {
      console.error("Error with OpenAI API:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in categorization:", error);
    throw error;
  }
}

export async function editItem(id: number, newName: string) {
  const user = await requireAuth();

  if (!newName || !newName.trim()) {
    return { success: false, error: "Item name is required" };
  }

  try {
    const category = await categoryFromAI(newName, user);

    await prisma.shoppingItem.update({
      where: { id, userId: user.id },
      data: {
        name: newName,
        categoryId: (await categoryFromAI(newName, user)).id,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      item: {
        id,
        name: newName,
        category,
      },
    };
  } catch (error) {
    console.error("Error editing item:", error);
    return { success: false, error: "Failed to edit item" };
  }
}

export async function deleteItem(id: number) {
  const user = await requireAuth();

  await prisma.shoppingItem.delete({
    where: { id, userId: user.id },
  });

  revalidatePath("/dashboard");
}

export async function deleteAllItems() {
  const user = await requireAuth();

  await prisma.shoppingItem.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/dashboard");
}

export async function getItems() {
  const user = await requireAuth();

  const items = await prisma.category.findMany({
    where: {
      userId: user.id,
      shoppingItems: {
        some: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      sortIndex: "asc",
    },
    include: {
      shoppingItems: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return items;
}

export async function updateUser(formData: FormData) {
  const user = await requireAuth();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  console.log({ name, email, currentPassword, newPassword, confirmPassword });

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
      name,
      email,
      password: newPassword
        ? await argon2.hash(newPassword)
        : userWithPassword!.password,
    },
  });

  return { success: true };
}

export async function getCategories() {
  const user = await requireAuth();

  return prisma.category.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      sortIndex: "asc",
    },
  });
}

export async function addCategory(category: string, description?: string) {
  const user = await requireAuth();

  return prisma.category.create({
    data: {
      name: category,
      description,
      userId: user.id,
      sortIndex:
        (await prisma.category.count({ where: { userId: user.id } })) + 1,
    },
  });
}

export async function updateCategory(
  id: number,
  name?: string,
  description?: string,
  sortIndex?: number
) {
  const user = await requireAuth();

  return prisma.category.update({
    where: { id, userId: user.id },
    data: {
      name,
      description,
      sortIndex,
    },
  });
}

export async function deleteAllCategories() {
  const user = await requireAuth();

  await prisma.category.deleteMany({
    where: { userId: user.id },
  });
}

export async function deleteCategory(id: number) {
  const user = await requireAuth();

  await prisma.category.delete({
    where: { id, userId: user.id },
  });
}

"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { requireAuth } from "./utils";
import { categorizeItem, generateShoppingList } from "../services/ai";
import { withErrorHandling } from "./error-handler";

async function categoryFromAI(item: string, user: { id: number }) {
  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
    },
  });

  return await categorizeItem(item, categories);
}

async function buildItemsFromPrompt(prompt: string, user: { id: number }) {
  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
    },
  });
  const items = await getItems();
  const existingItems = items.flatMap((category) =>
    category.shoppingItems.map((item) => item.name),
  );

  return await generateShoppingList(prompt, categories, existingItems);
}

export const addItem = withErrorHandling(async (item: string) => {
  const user = await requireAuth();

  const category = await categoryFromAI(item, user);

  const newItem = await prisma.shoppingItem.create({
    data: {
      name: item,
      categoryId: category.id,
      userId: user.id,
    },
  });

  revalidatePath("/");
  return { success: true, data: newItem };
});

export const addMultiItem = withErrorHandling(async (prompt: string) => {
  const user = await requireAuth();
  const list = await buildItemsFromPrompt(prompt, user);

  const result = await prisma.shoppingItem.createMany({
    data: list.items.map((item) => ({
      name: item.name,
      categoryId: item.categoryId,
      userId: user.id,
    })),
  });

  revalidatePath("/");
  return { success: true, data: result };
});

export const editItem = withErrorHandling(async (id: number, newName: string) => {
  const user = await requireAuth();

  if (!newName || !newName.trim()) {
    return { success: false, error: "Item name is required" };
  }

  const item = await prisma.shoppingItem.update({
    where: { id, userId: user.id },
    data: {
      name: newName,
    },
  });

  revalidatePath("/");

  return { success: true, data: item };
});

export const deleteItem = withErrorHandling(async (id: number) => {
  const user = await requireAuth();

  await prisma.shoppingItem.delete({
    where: { id, userId: user.id },
  });

  revalidatePath("/");
  return { success: true };
});

export const deleteAllItems = withErrorHandling(async () => {
  const user = await requireAuth();

  await prisma.shoppingItem.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/");
  return { success: true };
});

export const deleteItemsByCategory = withErrorHandling(async (categoryId: number) => {
  const user = await requireAuth();

  await prisma.shoppingItem.deleteMany({
    where: {
      userId: user.id,
      categoryId: categoryId,
    },
  });

  revalidatePath("/");
  return { success: true };
});

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

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
  const existingItems = items.flatMap((item) =>
    item.shoppingItems.map((item) => item.name),
  );

  return await generateShoppingList(prompt, categories, existingItems);
}

export const addItem = withErrorHandling(
  async (item: string): Promise<void> => {
    const user = await requireAuth();

    const category = await categoryFromAI(item, user);

    await prisma.shoppingItem.create({
      data: {
        name: item,
        categoryId: category.id,
        userId: user.id,
      },
    });

    revalidatePath("/");
  },
);

export const addMultiItem = withErrorHandling(
  async (prompt: string): Promise<void> => {
    const user = await requireAuth();
    const list = await buildItemsFromPrompt(prompt, user);

    await prisma.shoppingItem.createMany({
      data: list.items.map((item) => ({
        name: item.name,
        categoryId: item.categoryId,
        userId: user.id,
      })),
    });

    revalidatePath("/");
  },
);

export const editItem = withErrorHandling(
  async (id: number, newName: string) => {
    const user = await requireAuth();

    if (!newName || !newName.trim()) {
      throw new Error("Item name is required");
    }

    const item = await prisma.shoppingItem.update({
      where: { id, userId: user.id },
      data: {
        name: newName,
      },
    });

    revalidatePath("/");

    return item;
  },
);

export const deleteItem = withErrorHandling(
  async (id: number): Promise<void> => {
    const user = await requireAuth();

    await prisma.shoppingItem.delete({
      where: { id, userId: user.id },
    });

    revalidatePath("/");
  },
);

export const deleteAllItems = withErrorHandling(async (): Promise<void> => {
  const user = await requireAuth();

  await prisma.shoppingItem.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/");
});

export const deleteItemsByCategory = withErrorHandling(
  async (categoryId: number): Promise<void> => {
    const user = await requireAuth();

    await prisma.shoppingItem.deleteMany({
      where: {
        userId: user.id,
        categoryId: categoryId,
      },
    });

    revalidatePath("/");
  },
);

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

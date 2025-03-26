"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { Category } from "@prisma/client";
import { requireAuth } from "./utils";

async function categoryFromAI(
  item: string,
  user: { id: number },
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

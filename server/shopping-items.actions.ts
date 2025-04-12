"use server";

import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { Category } from "@prisma/client";
import { requireAuth } from "./utils";
import { z } from "zod";

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

async function buildItemsFromPrompt(prompt: string, user: { id: number }) {
  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
    },
  });
  const items = await getItems();

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    prompt: `
      Build categorized shopping items from this prompt ${prompt}

      Do not repeat any items found in the shopping list already: ${JSON.stringify(items.flatMap((item) => item.shoppingItems.map((item) => item.name)))}

      Categories: ${JSON.stringify(categories)}
    `,
    temperature: 0.1,
    schema: z.object({
      items: z.array(
        z.object({
          name: z.string().describe("the item name"),
          categoryId: z.number(),
        }),
      ),
    }),
  });

  return object;
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

      revalidatePath("/list");
    } catch (error) {
      console.error("Error with OpenAI API:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in categorization:", error);
    throw error;
  }
}

export async function addMultiItem(prompt: string): Promise<void> {
  const user = await requireAuth();
  const list = await buildItemsFromPrompt(prompt, user).catch((e) => {
    console.error("Error with OpenAI API:", e);
    throw e;
  });

  try {
    await prisma.shoppingItem.createMany({
      data: list.items.map((item) => ({
        name: item.name,
        categoryId: item.categoryId,
        userId: user.id,
      })),
    });
  } catch (error) {
    console.error("Error while saving multi prompt:", error);
  }

  revalidatePath("/list");
}

export async function editItem(id: number, newName: string) {
  const user = await requireAuth();

  if (!newName || !newName.trim()) {
    return { success: false, error: "Item name is required" };
  }

  try {
    const item = await prisma.shoppingItem.update({
      where: { id, userId: user.id },
      data: {
        name: newName,
      },
    });

    revalidatePath("/list");

    return {
      success: true,
      item,
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

  revalidatePath("/list");
}

export async function deleteAllItems() {
  const user = await requireAuth();

  await prisma.shoppingItem.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/list");
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

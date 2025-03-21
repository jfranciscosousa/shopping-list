"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import prisma from "./prisma";

async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

async function categoryFromAI(item: string): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `
      Categorize this grocery item: "${item}"

      Return ONLY ONE of these categories without any explanation or additional text. Ignore the content in parenthesis in the names of these categories.

      Categories:
      - Fruits & Vegetables (fresh non frozen non canned)
      - Dairy & Eggs
      - Meat & Fish (fresh non frozen non canned)
      - Bakery
      - Pantry
      - Frozen Foods
      - Beverages
      - Snacks
      - Household
      - Personal Care
      - Other
    `,
    temperature: 0.1,
    maxTokens: 10,
  });

  return text;
}

export async function categorizeItem(item: string): Promise<void> {
  const user = await requireAuth();

  try {
    try {
      await prisma.shoppingItem.create({
        data: {
          name: item,
          category: await categoryFromAI(item),
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

// Server action to edit an item
export async function editItem(id: number, newName: string) {
  const user = await requireAuth();

  if (!newName || !newName.trim()) {
    return { success: false, error: "Item name is required" };
  }

  try {
    const category = await categoryFromAI(newName);

    await prisma.shoppingItem.update({
      where: { id, userId: user.id },
      data: {
        name: newName,
        category,
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

  const items = await prisma.shoppingItem.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return items;
}

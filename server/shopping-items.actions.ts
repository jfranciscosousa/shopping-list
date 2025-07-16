"use server";

import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { Category } from "@prisma/client";
import { requireAuth } from "./utils";
import { z } from "zod";

const model = openai("gpt-4.1-mini");

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
    model,
    system: `You are an expert shopping list categorization assistant. Your role is to analyze grocery items and assign them to the most appropriate category from a user's predefined categories.

Guidelines:
- Analyze the item based on its typical grocery store placement and usage
- Consider the item's primary purpose and common consumer categorization
- If the item could fit multiple categories, choose the most specific and appropriate one
- Always return a valid category ID from the provided list
- If no perfect match exists, choose the closest logical category`,
    prompt: `Categorize this grocery item: "${item}"

IMPORTANT INSTRUCTIONS:
- You must return ONLY the numeric category ID
- Do not include any explanation, reasoning, or additional text
- Do not include quotes, spaces, or other characters
- The response must be a single integer that exists in the categories list

Available categories:
${categories.map((cat) => `ID: ${cat.id} - ${cat.name} (${cat.description || "No description"})`).join("\n")}

Item to categorize: "${item}"
Response format: [category_id_number_only]`,
    temperature: 0.1,
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
    model,
    system: `You are an expert shopping list assistant. Your role is to interpret user requests and generate a well-organized shopping list with properly categorized items.

Core responsibilities:
- Parse natural language requests for shopping items
- Extract individual grocery items from the input
- Categorize each item using the user's predefined categories
- Ensure no duplicate items are added to existing lists
- Generate clear, specific item names that are commonly found in stores

Guidelines:
- Focus on commonly available grocery store items
- Use standard grocery item naming conventions
- Choose the most appropriate category for each item
- If an item could fit multiple categories, select the most specific one
- Avoid vague or overly generic item names
- Consider typical shopping patterns and store organization`,
    prompt: `Generate a shopping list from this user request: "${prompt}"

REQUIREMENTS:
1. Extract individual grocery items from the user's request
2. Assign each item to the most appropriate category ID from the available categories
3. Use clear, specific item names (e.g., "whole milk" instead of "milk")
4. Do not include items that are already on the shopping list
5. Generate reasonable quantities/specifications when needed

EXISTING ITEMS TO AVOID:
${JSON.stringify(items.flatMap((item) => item.shoppingItems.map((item) => item.name)))}

AVAILABLE CATEGORIES:
${categories.map((cat) => `ID: ${cat.id} - ${cat.name} (${cat.description || "No description"})`).join("\n")}

User request: "${prompt}"

Please generate a structured list of new shopping items with their category assignments.`,
    temperature: 0.1,
    schema: z.object({
      items: z.array(
        z.object({
          name: z
            .string()
            .describe(
              "Specific grocery item name (e.g., 'organic bananas', '2% milk', 'whole grain bread')",
            ),
          categoryId: z
            .number()
            .describe("The ID of the most appropriate category for this item"),
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

      revalidatePath("/");
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

  revalidatePath("/");
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

    revalidatePath("/");

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

  revalidatePath("/");
}

export async function deleteAllItems() {
  const user = await requireAuth();

  await prisma.shoppingItem.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/");
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

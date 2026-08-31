"use server";

import { generateText, Output } from "ai";
import {
  CATEGORY_EMOJIS,
  CATEGORY_EMOJI_FALLBACK,
  type CategoryEmoji,
} from "@/lib/category-emojis";
import type { Category } from "@/server/db/schema";
import { z } from "zod";

export interface ShoppingItem {
  name: string;
  categoryId: number;
}

export interface ShoppingListGenerationResult {
  items: ShoppingItem[];
}

type CategoryForEmoji = Pick<Category, "id" | "name" | "description"> & {
  items?: string[];
};

export async function generateCategoryEmojis(
  categories: CategoryForEmoji[],
): Promise<Map<number, CategoryEmoji>> {
  if (categories.length === 0) return new Map();

  const validIds = new Set(categories.map((category) => category.id));
  const requestAssignments = async () => {
    const {
      output: { assignments },
    } = await generateText({
      model: "gpt-oss-20b",
      system: "Select the single best emoji for each shopping category.",
      prompt: `Choose one emoji from this exact allowlist for every category. Do not invent emojis. Return one assignment for every category ID.\n\nAllowlist: ${CATEGORY_EMOJIS.join(" ")}\n\nCategories:\n${categories
        .map(
          ({ id, name, description, items = [] }) =>
            `ID: ${id}\nName: ${name}\nDescription: ${description || "None"}\nItems: ${items.join(", ") || "None"}`,
        )
        .join("\n\n")}`,
      temperature: 0,
      output: Output.object({
        schema: z.object({
          assignments: z.array(
            z.object({
              id: z.number().int(),
              emoji: z.enum(CATEGORY_EMOJIS),
            }),
          ),
        }),
      }),
    });

    const emojis = new Map(
      assignments
        .filter((assignment) => validIds.has(assignment.id))
        .map((assignment) => [assignment.id, assignment.emoji]),
    );

    if (emojis.size !== categories.length) throw new Error("Incomplete emoji assignments");
    return emojis;
  };

  return requestAssignments()
    .catch(requestAssignments)
    .catch(requestAssignments)
    .catch(() => new Map());
}

export async function generateCategoryEmoji(category: CategoryForEmoji): Promise<CategoryEmoji> {
  return (await generateCategoryEmojis([category])).get(category.id) ?? CATEGORY_EMOJI_FALLBACK;
}

/**
 * Categorizes a single grocery item using AI
 */
export async function categorizeItem(item: string, categories: Category[]): Promise<Category> {
  const { text } = await generateText({
    model: "gpt-oss-120b",
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

  const categoryId = Number(text);
  const category = categories.find((cat) => cat.id === categoryId);

  if (!category) {
    throw new Error(`AI returned an unknown category ID: ${categoryId}`);
  }

  return category;
}

/**
 * Generates a shopping list from a natural language prompt
 */
export async function generateShoppingList(
  prompt: string,
  categories: Category[],
  existingItems: string[],
): Promise<ShoppingListGenerationResult> {
  const {
    output: { items },
  } = await generateText({
    model: "gpt-oss-120b",
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
${JSON.stringify(existingItems)}

AVAILABLE CATEGORIES:
${categories.map((cat) => `ID: ${cat.id} - ${cat.name} (${cat.description || "No description"})`).join("\n")}

User request: "${prompt}"

Please generate a structured list of new shopping items with their category assignments.`,
    temperature: 0.1,
    output: Output.object({
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
    }),
  });

  return { items };
}

"use server";

import { experimental_evaluate as evaluate, generateText, Output } from "ai";
import {
  CATEGORY_EMOJIS,
  CATEGORY_EMOJI_FALLBACK,
  type CategoryEmoji,
} from "@/lib/category-emojis";
import type { Category } from "@/server/db/schema";
import { z } from "zod";

const AI_MODEL = "google/gemini-2.5-flash-lite";
const JEV_MODEL = "typesafe-ai/jev-latest";

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
      model: AI_MODEL,
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
 * Categorizes a single grocery item using Jev only.
 * Jev has no reasoning: it returns a typed choice plus probabilities.
 * Low-confidence and failed evaluations throw.
 */
export async function categorizeItem(item: string, categories: Category[]): Promise<Category> {
  if (categories.length === 0) throw new Error("No categories available for categorization");
  if (categories.length === 1 && categories[0]) return categories[0];

  return await categorizeItemWithJev(item, categories);
}

/**
 * Fast probabilistic categorization via TypeSafe Jev on AI Gateway.
 */
async function categorizeItemWithJev(item: string, categories: Category[]): Promise<Category> {
  const criteria = Object.fromEntries(
    categories.map((cat) => [
      String(cat.id),
      `${cat.name}${cat.description ? `: ${cat.description}` : ""}`,
    ]),
  );

  const result = await evaluate({
    model: JEV_MODEL,
    state: `Grocery item: "${item}"`,
    questions: {
      category: {
        type: "choice",
        instructions:
          "Select the grocery category this item belongs in, based on typical grocery store placement and usage. Choose the most specific match.",
        criteria,
      },
    },
    providerOptions: { gateway: { zeroDataRetention: true } },
  });

  const answer = result.answers.category;

  // Highest probability wins; ties keep the first category in user order.
  let category = categories.find((cat) => String(cat.id) === answer.choice);
  if (answer.probabilities) {
    let best = -Infinity;
    for (const cat of categories) {
      const probability = answer.probabilities[String(cat.id)] ?? -Infinity;
      if (probability > best) {
        best = probability;
        category = cat;
      }
    }
  }

  if (!category) {
    throw new Error(`Jev returned an unknown category: ${answer.choice}`);
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
    model: AI_MODEL,
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

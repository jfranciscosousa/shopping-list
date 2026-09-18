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
const JEV_MODEL = "typesafe-ai/jev";
const JEV_ENABLED = true;
const JEV_MIN_TOP_PROBABILITY = 0.8;
const JEV_MIN_PROBABILITY_MARGIN = 0.15;
const AI_CATEGORIZATION_DEBUG =
  process.env.NODE_ENV === "development" || process.env.AI_CATEGORIZATION_DEBUG === "true";

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

type JevCategorizationResult = {
  category: Category;
  fallbackReason?: string;
  isConfident: boolean;
  probabilityMargin?: number;
  rankedCategories: Array<{ id: number; name: string; probability: number }>;
  topProbability?: number;
};

function logCategorization(event: string, details: Record<string, unknown>) {
  if (AI_CATEGORIZATION_DEBUG) console.info(`[ai.categorization] ${event}`, details);
}

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
 * Categorizes a single grocery item using AI.
 */
export async function categorizeItem(item: string, categories: Category[]): Promise<Category> {
  if (categories.length === 0) throw new Error("No categories available for categorization");
  if (categories.length === 1 && categories[0]) return categories[0];
  if (!JEV_ENABLED) {
    const category = await categorizeItemWithLlm(item, categories);
    logCategorization("llm-only", { item, category: category.name, categoryId: category.id });
    return category;
  }

  try {
    const result = await categorizeItemWithJev(item, categories);
    logCategorization("jev", {
      item,
      category: result.category.name,
      categoryId: result.category.id,
      fallbackReason: result.fallbackReason,
      isConfident: result.isConfident,
      probabilityMargin: result.probabilityMargin,
      rankedCategories: result.rankedCategories,
      topProbability: result.topProbability,
    });
    if (result.isConfident) return result.category;

    const category = await categorizeItemWithLlm(item, categories);
    logCategorization("llm-fallback", {
      item,
      category: category.name,
      categoryId: category.id,
      fallbackReason: result.fallbackReason,
    });
    return category;
  } catch (error) {
    logCategorization("jev-error", {
      item,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const category = await categorizeItemWithLlm(item, categories);
  logCategorization("llm-fallback", {
    item,
    category: category.name,
    categoryId: category.id,
    fallbackReason: "jev-error",
  });
  return category;
}

async function categorizeItemWithLlm(item: string, categories: Category[]): Promise<Category> {
  const {
    output: { categoryId },
  } = await generateText({
    model: AI_MODEL,
    system: `You are an expert shopping list categorization assistant. Your role is to analyze grocery items and assign them to the most appropriate category from a user's predefined categories.

Guidelines:
- Analyze the item based on its typical grocery store placement and usage
- Consider the item's primary purpose and common consumer categorization
- Use explicit product-form words before the generic item name: frozen, canned, dried, chips, ready-made, and fresh
- For an unqualified ingredient, prefer its fresh-produce category when one exists
- If the item could fit multiple categories, choose the most specific and appropriate one
- Always return a valid category ID from the provided list
- If no perfect match exists, choose the closest logical category`,
    prompt: `Categorize this grocery item: "${item}"

IMPORTANT INSTRUCTIONS:
- Return the category ID of the best matching category

Available categories:
${categories.map((cat) => `ID: ${cat.id} - ${cat.name} (${cat.description || "No description"})`).join("\n")}

Item to categorize: "${item}"`,
    temperature: 0.1,
    output: Output.object({
      schema: z.object({
        categoryId: z.number().int().describe("The ID of the best matching category"),
      }),
    }),
  });

  const category = categories.find((cat) => cat.id === categoryId);

  if (!category) {
    throw new Error(`AI returned an unknown category ID: ${categoryId}`);
  }

  return category;
}

async function categorizeItemWithJev(
  item: string,
  categories: Category[],
): Promise<JevCategorizationResult> {
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
          "Select the grocery category based on typical store placement and product form. Explicit form words take priority over the generic item name: frozen, canned, dried, chips, ready-made, and fresh. For an unqualified ingredient, choose its fresh-produce category when available. Choose the most specific match from the supplied category definitions.",
        criteria,
      },
    },
  });
  const answer = result.answers.category;

  const rankedCategories = categories
    .map((category) => ({
      category,
      probability: answer.probabilities?.[String(category.id)],
    }))
    .filter(
      (candidate): candidate is { category: Category; probability: number } =>
        typeof candidate.probability === "number" && Number.isFinite(candidate.probability),
    )
    .sort((left, right) => right.probability - left.probability);

  const bestCandidate = rankedCategories[0];
  const runnerUp = rankedCategories[1];
  const category =
    bestCandidate?.category ?? categories.find((cat) => String(cat.id) === answer.choice);

  if (!category) {
    throw new Error(`Jev returned an unknown category: ${answer.choice}`);
  }

  const isConfident =
    bestCandidate !== undefined &&
    runnerUp !== undefined &&
    bestCandidate.probability >= JEV_MIN_TOP_PROBABILITY &&
    bestCandidate.probability - runnerUp.probability >= JEV_MIN_PROBABILITY_MARGIN;

  const fallbackReason = !bestCandidate
    ? "probabilities-unavailable"
    : !runnerUp
      ? "runner-up-unavailable"
      : bestCandidate.probability < JEV_MIN_TOP_PROBABILITY
        ? "top-probability-below-threshold"
        : bestCandidate.probability - runnerUp.probability < JEV_MIN_PROBABILITY_MARGIN
          ? "probability-margin-below-threshold"
          : undefined;

  return {
    category,
    fallbackReason,
    isConfident,
    probabilityMargin:
      bestCandidate && runnerUp ? bestCandidate.probability - runnerUp.probability : undefined,
    rankedCategories: rankedCategories.map(({ category: candidateCategory, probability }) => ({
      id: candidateCategory.id,
      name: candidateCategory.name,
      probability,
    })),
    topProbability: bestCandidate?.probability,
  };
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

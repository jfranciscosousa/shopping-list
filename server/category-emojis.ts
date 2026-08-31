import { and, asc, eq, isNull } from "drizzle-orm";
import { generateCategoryEmojis } from "@/services/ai";
import { db } from "./db";
import { categories, shoppingItems } from "./db/schema";
import { CATEGORY_EMOJI_FALLBACK } from "@/lib/category-emojis";

export async function backfillCategoryEmojis(limit: number) {
  const missingCategories = await db
    .select()
    .from(categories)
    .where(isNull(categories.emoji))
    .orderBy(asc(categories.id))
    .limit(limit);

  if (missingCategories.length === 0) return { updated: 0, remaining: 0 };

  const categoriesWithItems = await Promise.all(
    missingCategories.map(async (category) => ({
      ...category,
      items: (
        await db
          .select({ name: shoppingItems.name })
          .from(shoppingItems)
          .where(
            and(
              eq(shoppingItems.categoryId, category.id),
              eq(shoppingItems.userId, category.userId),
            ),
          )
          .limit(5)
      ).map((item) => item.name),
    })),
  );
  const generatedEmojis = await generateCategoryEmojis(categoriesWithItems);

  await Promise.all(
    missingCategories.map((category) =>
      db
        .update(categories)
        .set({
          emoji: generatedEmojis.get(category.id) ?? CATEGORY_EMOJI_FALLBACK,
          updatedAt: new Date(),
        })
        .where(and(eq(categories.id, category.id), isNull(categories.emoji))),
    ),
  );

  const [nextCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(isNull(categories.emoji))
    .limit(1);

  return { updated: missingCategories.length, remaining: nextCategory ? 1 : 0 };
}

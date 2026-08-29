"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "./db";
import { categories, shoppingItems } from "./db/schema";
import { requireAuth } from "./utils";
import { categorizeItem, generateShoppingList } from "../services/ai";
import { withActionHandling, withServerLogging } from "./error-handler";

async function categoryFromAI(item: string, user: { id: number }) {
  const userCategories = await db.select().from(categories).where(eq(categories.userId, user.id));

  return await categorizeItem(item, userCategories);
}

async function buildItemsFromPrompt(prompt: string, user: { id: number }) {
  const userCategories = await db.select().from(categories).where(eq(categories.userId, user.id));
  const items = await getItems();
  const existingItems = items.flatMap((category) =>
    category.shoppingItems.map((item) => item.name),
  );

  return await generateShoppingList(prompt, userCategories, existingItems);
}

export const addItem = withActionHandling("addItem", async (item: string) => {
  const user = await requireAuth();

  const category = await categoryFromAI(item, user);

  const [newItem] = await db
    .insert(shoppingItems)
    .values({
      name: item,
      categoryId: category.id,
      userId: user.id,
    })
    .returning();

  revalidatePath("/");
  return { success: true, data: newItem };
});

export const addMultiItem = withActionHandling("addMultiItem", async (prompt: string) => {
  const user = await requireAuth();
  const list = await buildItemsFromPrompt(prompt, user);

  const createdItems = await db
    .insert(shoppingItems)
    .values(
      list.items.map((item) => ({
        name: item.name,
        categoryId: item.categoryId,
        userId: user.id,
      })),
    )
    .returning();

  revalidatePath("/");
  return { success: true, data: { count: createdItems.length } };
});

export const editItem = withActionHandling("editItem", async (id: number, newName: string) => {
  const user = await requireAuth();

  if (!newName || !newName.trim()) {
    return { success: false, error: "Item name is required" };
  }

  const [item] = await db
    .update(shoppingItems)
    .set({
      name: newName,
    })
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, user.id)))
    .returning();

  if (!item) throw new Error("Shopping item not found");

  revalidatePath("/");

  return { success: true, data: item };
});

export const deleteItem = withActionHandling("deleteItem", async (id: number) => {
  const user = await requireAuth();

  const deletedItems = await db
    .delete(shoppingItems)
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, user.id)))
    .returning({ id: shoppingItems.id });

  if (deletedItems.length === 0) throw new Error("Shopping item not found");

  revalidatePath("/");
  return { success: true };
});

export const deleteAllItems = withActionHandling("deleteAllItems", async () => {
  const user = await requireAuth();

  await db.delete(shoppingItems).where(eq(shoppingItems.userId, user.id));

  revalidatePath("/");
  return { success: true };
});

export const deleteItemsByCategory = withActionHandling(
  "deleteItemsByCategory",
  async (categoryId: number) => {
    const user = await requireAuth();

    await db
      .delete(shoppingItems)
      .where(and(eq(shoppingItems.userId, user.id), eq(shoppingItems.categoryId, categoryId)));

    revalidatePath("/");
    return { success: true };
  },
);

export const getItems = withServerLogging("getItems", async () => {
  const user = await requireAuth();

  const rows = await db
    .select({ category: categories, shoppingItem: shoppingItems })
    .from(categories)
    .innerJoin(
      shoppingItems,
      and(eq(shoppingItems.categoryId, categories.id), eq(shoppingItems.userId, user.id)),
    )
    .where(eq(categories.userId, user.id))
    .orderBy(asc(categories.sortIndex), asc(shoppingItems.createdAt));

  const groupedItems = new Map<
    number,
    {
      category: typeof categories.$inferSelect;
      shoppingItems: (typeof shoppingItems.$inferSelect)[];
    }
  >();
  for (const { category, shoppingItem } of rows) {
    const group = groupedItems.get(category.id);
    if (group) group.shoppingItems.push(shoppingItem);
    else groupedItems.set(category.id, { category, shoppingItems: [shoppingItem] });
  }

  return Array.from(groupedItems.values()).map(({ category, shoppingItems: categoryItems }) => ({
    ...category,
    shoppingItems: categoryItems,
  }));
});

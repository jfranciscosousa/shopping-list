"use server";

import { z } from "zod";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { categories } from "./db/schema";
import { generateCategoryEmoji } from "@/services/ai";
import { requireAuth, validateFormData } from "./utils";
import { withActionHandling, withServerLogging } from "./error-handler";

export const getCategories = withServerLogging("getCategories", async () => {
  const user = await requireAuth();

  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id))
    .orderBy(asc(categories.sortIndex));
});

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

export const addCategory = withActionHandling("addCategory", async (formData: FormData) => {
  const validateResult = validateFormData(formData, categorySchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, description } = validateResult.data;
  const user = await requireAuth();
  const emoji = await generateCategoryEmoji({ id: 0, name, description: description ?? null });

  const [category] = await db
    .insert(categories)
    .values({
      name,
      description,
      emoji,
      userId: user.id,
      sortIndex:
        sql<number>`-((select count(*) from "Category" where "userId" = ${user.id}) + 1)`.mapWith(
          Number,
        ),
    })
    .returning();

  if (!category) throw new Error("Unable to create category");

  return { success: true, data: category };
});

const categoryUpdateSchema = categorySchema.partial().extend({
  id: z.preprocess(Number, z.number().int().positive()),
  sortIndex: z.preprocess(Number, z.number().int().optional()).optional(),
});

export const updateCategory = withActionHandling("updateCategory", async (formData: FormData) => {
  const validateResult = validateFormData(formData, categoryUpdateSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, description, id, sortIndex } = validateResult.data;
  const user = await requireAuth();
  const emoji = await generateCategoryEmoji({
    id,
    name: name ?? "",
    description: description ?? null,
  });

  const [category] = await db
    .update(categories)
    .set({
      name,
      description,
      emoji,
      sortIndex,
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning();

  if (!category) throw new Error("Category not found");

  return { success: true, data: category };
});

// Only updates sort index
export const updateCategoryBulk = withActionHandling(
  "updateCategoryBulk",
  async (formData: FormData) => {
    const user = await requireAuth();

    await db.transaction((tx) => {
      return Promise.all(
        formData.entries().map(([key, value]) =>
          tx
            .update(categories)
            .set({
              sortIndex: Number(value),
              updatedAt: new Date(),
            })
            .where(and(eq(categories.id, Number(key)), eq(categories.userId, user.id))),
        ),
      );
    });

    return { success: true };
  },
);

export const deleteAllCategories = withActionHandling("deleteAllCategories", async () => {
  const user = await requireAuth();

  await db.delete(categories).where(eq(categories.userId, user.id));

  return { success: true };
});

export const deleteCategory = withActionHandling("deleteCategory", async (id: number) => {
  const user = await requireAuth();

  const deletedCategories = await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning({ id: categories.id });

  if (deletedCategories.length === 0) throw new Error("Category not found");

  return { success: true };
});

"use server";

import { z } from "zod";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { categories } from "./db/schema";
import { requireAuth, validateFormData } from "./utils";
import { withErrorHandling } from "./error-handler";

export async function getCategories() {
  const user = await requireAuth();

  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id))
    .orderBy(asc(categories.sortIndex));
}

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

export const addCategory = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, categorySchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, description } = validateResult.data;
  const user = await requireAuth();

  const [category] = await db
    .insert(categories)
    .values({
      name,
      description,
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

export const updateCategory = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, categoryUpdateSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, description, id, sortIndex } = validateResult.data;
  const user = await requireAuth();

  const [category] = await db
    .update(categories)
    .set({
      name,
      description,
      sortIndex,
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning();

  if (!category) throw new Error("Category not found");

  return { success: true, data: category };
});

// Only updates sort index
export const updateCategoryBulk = withErrorHandling(async (formData: FormData) => {
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
});

export const deleteAllCategories = withErrorHandling(async () => {
  const user = await requireAuth();

  await db.delete(categories).where(eq(categories.userId, user.id));

  return { success: true };
});

export const deleteCategory = withErrorHandling(async (id: number) => {
  const user = await requireAuth();

  const deletedCategories = await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning({ id: categories.id });

  if (deletedCategories.length === 0) throw new Error("Category not found");

  return { success: true };
});

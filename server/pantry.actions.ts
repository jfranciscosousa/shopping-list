"use server";

import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { requireAuth, validateFormData } from "./utils";
import { db } from "./db";
import { pantryAreas, pantryItems, type PantryArea, type PantryItem } from "./db/schema";
import { withErrorHandling } from "./error-handler";

export type PantryAreaWithItems = PantryArea & {
  pantryItems: PantryItem[];
};

export async function getAreasAndItems(): Promise<PantryAreaWithItems[]> {
  const user = await requireAuth();

  const rows = await db
    .select({ area: pantryAreas, pantryItem: pantryItems })
    .from(pantryAreas)
    .leftJoin(
      pantryItems,
      and(eq(pantryItems.pantryAreaId, pantryAreas.id), eq(pantryItems.userId, user.id)),
    )
    .where(eq(pantryAreas.userId, user.id))
    .orderBy(desc(pantryAreas.createdAt), asc(pantryItems.createdAt));

  const groupedAreas = new Map<number, PantryAreaWithItems>();
  for (const { area, pantryItem } of rows) {
    const group = groupedAreas.get(area.id);
    if (group) {
      if (pantryItem) group.pantryItems.push(pantryItem);
    } else {
      groupedAreas.set(area.id, { ...area, pantryItems: pantryItem ? [pantryItem] : [] });
    }
  }

  return Array.from(groupedAreas.values());
}

const areaSchema = z.object({
  name: z.string().min(1, "Area name is required"),
});

export const createArea = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, areaSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name } = validateResult.data;
  const user = await requireAuth();

  const [area] = await db
    .insert(pantryAreas)
    .values({
      name,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!area) throw new Error("Unable to create pantry area");

  return { success: true, data: area };
});

const updateAreaSchema = areaSchema.partial().extend({
  id: z.preprocess(Number, z.number().int().positive()),
});

export const updateArea = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, updateAreaSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, id } = validateResult.data;
  const user = await requireAuth();

  const [area] = await db
    .update(pantryAreas)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(and(eq(pantryAreas.id, id), eq(pantryAreas.userId, user.id)))
    .returning();

  if (!area) throw new Error("Pantry area not found");

  return { success: true, data: area };
});

export const deleteArea = withErrorHandling(async (id: number) => {
  const user = await requireAuth();

  const deletedAreas = await db
    .delete(pantryAreas)
    .where(and(eq(pantryAreas.id, id), eq(pantryAreas.userId, user.id)))
    .returning({ id: pantryAreas.id });

  if (deletedAreas.length === 0) throw new Error("Pantry area not found");

  return { success: true };
});

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  producedAt: z
    .preprocess((v) => (typeof v === "string" ? new Date(v) : undefined), z.date())
    .optional(),
  expiresAt: z.preprocess((v) => (typeof v === "string" ? new Date(v) : undefined), z.date()),
  pantryAreaId: z.preprocess(Number, z.number().int().positive()),
});

async function assertAreaOwnership(areaId: number, userId: number) {
  const [area] = await db
    .select({ id: pantryAreas.id })
    .from(pantryAreas)
    .where(and(eq(pantryAreas.id, areaId), eq(pantryAreas.userId, userId)))
    .limit(1);

  if (!area) throw new Error("Pantry area not found");
}

export const createItem = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, itemSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, pantryAreaId, producedAt, expiresAt } = validateResult.data;
  const user = await requireAuth();
  await assertAreaOwnership(pantryAreaId, user.id);

  const [item] = await db
    .insert(pantryItems)
    .values({
      name,
      producedAt: producedAt ?? new Date(),
      expiresAt,
      pantryAreaId,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!item) throw new Error("Unable to create pantry item");

  return { success: true, data: item };
});

const updateItemSchema = itemSchema.partial().extend({
  id: z.preprocess(Number, z.number().int().positive()),
});

export const updateItem = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, updateItemSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, pantryAreaId, producedAt, expiresAt, id } = validateResult.data;
  const user = await requireAuth();
  if (pantryAreaId) await assertAreaOwnership(pantryAreaId, user.id);

  const [item] = await db
    .update(pantryItems)
    .set({
      name,
      producedAt,
      expiresAt,
      pantryAreaId,
      updatedAt: new Date(),
    })
    .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)))
    .returning();

  if (!item) throw new Error("Pantry item not found");

  return { success: true, data: item };
});

export const deleteItem = withErrorHandling(async (id: number) => {
  const user = await requireAuth();

  const deletedItems = await db
    .delete(pantryItems)
    .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)))
    .returning({ id: pantryItems.id });

  if (deletedItems.length === 0) throw new Error("Pantry item not found");

  return { success: true };
});

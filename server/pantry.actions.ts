"use server";

import { z } from "zod";
import { requireAuth, validateFormData } from "./utils";
import prisma from "./prisma";
import { PantryArea, PantryItem } from "@prisma/client";
import { withErrorHandling } from "./error-handler";

export type PantryAreaWithItems = PantryArea & {
  pantryItems: PantryItem[];
};

export async function getAreasAndItems(): Promise<PantryAreaWithItems[]> {
  const user = await requireAuth();

  return prisma.pantryArea.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      pantryItems: true,
    },
  });
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

  const area = await prisma.pantryArea.create({
    data: {
      name,
      userId: user.id,
    },
  });

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

  const area = await prisma.pantryArea.update({
    where: { id, userId: user.id },
    data: {
      name,
    },
  });

  return { success: true, data: area };
});

export const deleteArea = withErrorHandling(async (id: number) => {
  const user = await requireAuth();

  await prisma.pantryArea.delete({
    where: { id, userId: user.id },
  });

  return { success: true };
});

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  producedAt: z
    .preprocess(
      (v) => (typeof v === "string" ? new Date(v) : undefined),
      z.date(),
    )
    .optional(),
  expiresAt: z.preprocess(
    (v) => (typeof v === "string" ? new Date(v) : undefined),
    z.date(),
  ),
  pantryAreaId: z.preprocess(Number, z.number().int().positive()),
});

export const createItem = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, itemSchema);

  if (!validateResult.success) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { name, pantryAreaId, producedAt, expiresAt } = validateResult.data;
  const user = await requireAuth();

  const item = await prisma.pantryItem.create({
    data: {
      name,
      producedAt,
      expiresAt,
      pantryAreaId,
      userId: user.id,
    },
  });

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

  const item = await prisma.pantryItem.update({
    where: { id, userId: user.id },
    data: {
      name,
      producedAt,
      expiresAt,
      pantryAreaId,
    },
  });

  return { success: true, data: item };
});

export const deleteItem = withErrorHandling(async (id: number) => {
  const user = await requireAuth();

  await prisma.pantryItem.delete({
    where: { id, userId: user.id },
  });

  return { success: true };
});

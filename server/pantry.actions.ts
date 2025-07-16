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
  const { name } = validateFormData(formData, areaSchema);
  const user = await requireAuth();

  return prisma.pantryArea.create({
    data: {
      name,
      userId: user.id,
    },
  });
});

const updateAreaSchema = areaSchema.partial().extend({
  id: z.preprocess(Number, z.number().int().positive()),
});

export const updateArea = withErrorHandling(async (formData: FormData) => {
  const { name, id } = validateFormData(formData, updateAreaSchema);
  const user = await requireAuth();

  return prisma.pantryArea.update({
    where: { id, userId: user.id },
    data: {
      name,
    },
  });
});

export const deleteArea = withErrorHandling(async (id: number) => {
  const user = await requireAuth();

  return prisma.pantryArea.delete({
    where: { id, userId: user.id },
  });
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
  const { name, pantryAreaId, producedAt, expiresAt } = validateFormData(
    formData,
    itemSchema,
  );
  const user = await requireAuth();

  return prisma.pantryItem.create({
    data: {
      name,
      producedAt,
      expiresAt,
      pantryAreaId,
      userId: user.id,
    },
  });
});

const updateItemSchema = itemSchema.partial().extend({
  id: z.preprocess(Number, z.number().int().positive()),
});

export const updateItem = withErrorHandling(async (formData: FormData) => {
  const { name, pantryAreaId, producedAt, expiresAt, id } = validateFormData(
    formData,
    updateItemSchema,
  );
  const user = await requireAuth();

  return prisma.pantryItem.update({
    where: { id, userId: user.id },
    data: {
      name,
      producedAt,
      expiresAt,
      pantryAreaId,
    },
  });
});

export const deleteItem = withErrorHandling(async (id: number) => {
  const user = await requireAuth();

  return prisma.pantryItem.delete({
    where: { id, userId: user.id },
  });
});

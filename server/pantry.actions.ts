"use server";

import { z } from "zod";
import { requireAuth, validateFormData } from "./utils";
import prisma from "./prisma";
import { PantryArea, PantryItem } from "@prisma/client";

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

export async function createArea(formData: FormData) {
  const result = await validateFormData(formData, areaSchema);

  if (!result.success) throw new Error(result.error.errors[0].message);

  const { name } = result.data;
  const user = await requireAuth();

  return prisma.pantryArea.create({
    data: {
      name,
      userId: user.id,
    },
  });
}

const updateAreaSchema = areaSchema.partial().merge(
  z.object({
    id: z.preprocess(Number, z.number().int().positive()),
  }),
);

export async function updateArea(formData: FormData) {
  const result = await validateFormData(formData, updateAreaSchema);

  if (!result.success) throw new Error(result.error.errors[0].message);

  const { name, id } = result.data;
  const user = await requireAuth();

  return prisma.pantryArea.update({
    where: { id, userId: user.id },
    data: {
      name,
    },
  });
}

export async function deleteArea(id: number) {
  const user = await requireAuth();

  return prisma.pantryArea.delete({
    where: { id, userId: user.id },
  });
}

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

export async function createItem(formData: FormData) {
  const result = await validateFormData(formData, itemSchema);

  if (!result.success) throw new Error(result.error.errors[0].message);

  const { name, pantryAreaId, producedAt, expiresAt } = result.data;
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
}

const updateItemSchema = itemSchema.partial().merge(
  z.object({
    id: z.preprocess(Number, z.number().int().positive()),
  }),
);

export async function updateItem(formData: FormData) {
  const result = await validateFormData(formData, updateItemSchema);

  if (!result.success) throw new Error(result.error as unknown as string);

  const { name, pantryAreaId, producedAt, expiresAt, id } = result.data;
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
}

export async function deleteItem(id: number) {
  const user = await requireAuth();

  return prisma.pantryItem.delete({
    where: { id, userId: user.id },
  });
}

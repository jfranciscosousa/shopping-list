"use server";

import { z } from "zod";
import prisma from "./prisma";
import { requireAuth, validateFormData } from "./utils";

export async function getCategories() {
  const user = await requireAuth();

  return prisma.category.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      sortIndex: "asc",
    },
  });
}

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

export async function addCategory(formData: FormData) {
  const result = await validateFormData(formData, categorySchema);

  if (!result.success) throw new Error(result.error.errors[0].message);

  const { name, description } = result.data;
  const user = await requireAuth();

  return prisma.category.create({
    data: {
      name,
      description,
      userId: user.id,
      sortIndex:
        (await prisma.category.count({ where: { userId: user.id } })) + 1,
    },
  });
}

const categoryUpdateSchema = categorySchema.partial().merge(
  z.object({
    id: z.preprocess(Number, z.number().int().positive()),
    sortIndex: z.number().optional(),
  }),
);

export async function updateCategory(formData: FormData) {
  const result = await validateFormData(formData, categoryUpdateSchema);

  if (!result.success) throw new Error(result.error.errors[0].message);

  const { name, description, id, sortIndex } = result.data;
  const user = await requireAuth();

  return prisma.category.update({
    where: { id, userId: user.id },
    data: {
      name,
      description,
      sortIndex,
    },
  });
}

export async function deleteAllCategories() {
  const user = await requireAuth();

  await prisma.category.deleteMany({
    where: { userId: user.id },
  });
}

export async function deleteCategory(id: number) {
  const user = await requireAuth();

  await prisma.category.delete({
    where: { id, userId: user.id },
  });
}

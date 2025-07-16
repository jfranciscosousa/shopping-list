"use server";

import { z } from "zod";
import prisma from "./prisma";
import { requireAuth, validateFormData } from "./utils";
import { withErrorHandling } from "./error-handler";

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

export const addCategory = withErrorHandling(async (formData: FormData) => {
  const { name, description } = validateFormData(formData, categorySchema);
  const user = await requireAuth();

  return prisma.category.create({
    data: {
      name,
      description,
      userId: user.id,
      sortIndex:
        ((await prisma.category.count({ where: { userId: user.id } })) + 1) *
        -1,
    },
  });
});

const categoryUpdateSchema = categorySchema.partial().extend({
  id: z.preprocess(Number, z.number().int().positive()),
  sortIndex: z.preprocess(Number, z.number().int().optional()).optional(),
});

export const updateCategory = withErrorHandling(async (formData: FormData) => {
  const { name, description, id, sortIndex } = validateFormData(
    formData,
    categoryUpdateSchema,
  );
  const user = await requireAuth();

  return prisma.category.update({
    where: { id, userId: user.id },
    data: {
      name,
      description,
      sortIndex,
    },
  });
});

// Only updates sort index
export const updateCategoryBulk = withErrorHandling(
  async (formData: FormData): Promise<void> => {
    const user = await requireAuth();

    await prisma.$transaction((tx) => {
      return Promise.all(
        formData.entries().map(([key, value]) =>
          tx.category.update({
            where: { id: Number(key), userId: user.id },
            data: {
              sortIndex: Number(value),
            },
          }),
        ),
      );
    });
  },
);

export const deleteAllCategories = withErrorHandling(
  async (): Promise<void> => {
    const user = await requireAuth();

    await prisma.category.deleteMany({
      where: { userId: user.id },
    });
  },
);

export const deleteCategory = withErrorHandling(
  async (id: number): Promise<void> => {
    const user = await requireAuth();

    await prisma.category.delete({
      where: { id, userId: user.id },
    });
  },
);

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as categories from "./categories.server";

export const getCategories = createServerFn({ method: "GET" }).handler(() =>
  categories.getCategories(),
);

export const addCategory = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => categories.addCategory(data));

export const updateCategory = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => categories.updateCategory(data));

export const updateCategoryBulk = createServerFn({ method: "POST" })
  .validator((data: FormData) => {
    const formData = z.instanceof(FormData).parse(data);
    for (const [id, index] of formData) {
      z.uuid().parse(id);
      z.coerce.number().int().parse(index);
    }
    return formData;
  })
  .handler(({ data }) => categories.updateCategoryBulk(data));

export const deleteAllCategories = createServerFn({ method: "POST" }).handler(() =>
  categories.deleteAllCategories(),
);

export const deleteCategory = createServerFn({ method: "POST" })
  .validator(z.uuid())
  .handler(({ data }) => categories.deleteCategory(data));

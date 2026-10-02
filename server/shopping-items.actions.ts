import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as items from "./shopping-items.server";

export const getItems = createServerFn({ method: "GET" }).handler(() => items.getItems());

export const addItem = createServerFn({ method: "POST" })
  .validator(z.string().trim().min(1))
  .handler(({ data }) => items.addItem(data));

export const addMultiItem = createServerFn({ method: "POST" })
  .validator(z.string().trim().min(1))
  .handler(({ data }) => items.addMultiItem(data));

export const editItem = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive(), newName: z.string() }))
  .handler(({ data }) => items.editItem(data.id, data.newName));

export const deleteItem = createServerFn({ method: "POST" })
  .validator(z.number().int().positive())
  .handler(({ data }) => items.deleteItem(data));

export const deleteAllItems = createServerFn({ method: "POST" }).handler(() =>
  items.deleteAllItems(),
);

export const deleteItemsByCategory = createServerFn({ method: "POST" })
  .validator(z.number().int().positive())
  .handler(({ data }) => items.deleteItemsByCategory(data));

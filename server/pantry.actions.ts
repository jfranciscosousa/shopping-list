import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as pantry from "./pantry.server";

export type { PantryAreaWithItems } from "./pantry.server";

export const getAreasAndItems = createServerFn({ method: "GET" }).handler(() =>
  pantry.getAreasAndItems(),
);

export const createArea = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => pantry.createArea(data));

export const updateArea = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => pantry.updateArea(data));

export const deleteArea = createServerFn({ method: "POST" })
  .validator(z.number().int().positive())
  .handler(({ data }) => pantry.deleteArea(data));

export const createItem = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => pantry.createItem(data));

export const updateItem = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(({ data }) => pantry.updateItem(data));

export const deleteItem = createServerFn({ method: "POST" })
  .validator(z.number().int().positive())
  .handler(({ data }) => pantry.deleteItem(data));

import { createServerFn } from "@tanstack/react-start";
import { dismissShoppingListIntro as dismiss } from "./user-config.server";

export const dismissShoppingListIntro = createServerFn({ method: "POST" }).handler(() => dismiss());

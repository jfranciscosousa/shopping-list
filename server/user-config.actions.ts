"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { type UserConfig, users } from "./db/schema";
import { withActionHandling } from "./error-handler";
import { requireAuth } from "./utils";

export const dismissShoppingListIntro = withActionHandling("dismissShoppingListIntro", async () => {
  const user = await requireAuth();

  await db
    .update(users)
    .set({
      config: sql<UserConfig>`coalesce(${users.config}, '{}'::jsonb) || '{"introDismissed": true}'::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/list");
  return { success: true } as const;
});

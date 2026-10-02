import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { expect, it, vi } from "vitest";
import { db } from "./db";
import { categories, shoppingItems, users } from "./db/schema";
import { requireAuth } from "./utils";
import { addMultiItem } from "./shopping-items.server";

vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("./utils", () => ({ requireAuth: vi.fn() }));
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: vi.fn(),
}));

it.each(["owned", "foreign", "unknown"])(
  "accepts only owned AI category IDs (%s)",
  async (categorySource) => {
    const userId = randomUUID();
    const otherUserId = randomUUID();
    const ownedCategoryId = randomUUID();
    const foreignCategoryId = randomUUID();
    await db.insert(users).values([
      { id: userId, email: `${userId}@example.test`, password: "test-only" },
      { id: otherUserId, email: `${otherUserId}@example.test`, password: "test-only" },
    ]);
    await db.insert(categories).values([
      { id: ownedCategoryId, name: "Owned", userId },
      { id: foreignCategoryId, name: "Foreign", userId: otherUserId },
    ]);
    vi.mocked(requireAuth).mockResolvedValue({
      id: userId,
      email: `${userId}@example.test`,
      name: null,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const categoryId =
      categorySource === "owned"
        ? ownedCategoryId
        : categorySource === "foreign"
          ? foreignCategoryId
          : randomUUID();
    vi.mocked(generateText).mockResolvedValue({
      output: {
        items: [
          { name: "Milk", categoryId: ownedCategoryId },
          { name: "Bread", categoryId },
        ],
      },
    } as Awaited<ReturnType<typeof generateText>>);

    const result = await addMultiItem("Milk and bread");
    const inserted = await db.select().from(shoppingItems).where(eq(shoppingItems.userId, userId));
    if (categorySource === "owned") {
      expect(result).toEqual({ success: true, data: { count: 2 } });
      expect(inserted).toHaveLength(2);
      expect(inserted.every((item) => item.categoryId === ownedCategoryId)).toBe(true);
    } else {
      expect(result).toMatchObject({ success: false });
      expect(inserted).toEqual([]);
    }
  },
);

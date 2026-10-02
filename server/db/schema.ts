import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export type UserConfig = {
  introDismissed?: boolean;
};

export const users = pgTable(
  "User",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    name: text("name"),
    config: jsonb("config").$type<UserConfig>().notNull().default({}),
    createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("User_email_key").on(table.email)],
);

export const categories = pgTable("Category", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji"),
  sortIndex: integer("sortIndex"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const shoppingItems = pgTable("ShoppingItem", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  categoryId: uuid("categoryId")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const pantryAreas = pgTable("PantryArea", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export const pantryItems = pgTable("PantryItem", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  producedAt: timestamp("producedAt", { precision: 3 }).defaultNow().notNull(),
  expiresAt: timestamp("expiresAt", { precision: 3 }).notNull(),
  pantryAreaId: uuid("pantryAreaId")
    .notNull()
    .references(() => pantryAreas.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type PantryArea = typeof pantryAreas.$inferSelect;
export type PantryItem = typeof pantryItems.$inferSelect;

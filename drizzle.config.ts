import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
  schemaFilter: ["public"],
});

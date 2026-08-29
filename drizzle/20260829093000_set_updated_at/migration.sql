-- Keep updatedAt DB-owned on every UPDATE. The application no longer sets any timestamps;
-- createdAt/updatedAt defaults are provided by the earlier migration, and this trigger keeps
-- updatedAt current whenever a row is edited (there is no database default that fires on UPDATE).
CREATE OR REPLACE FUNCTION "set_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "set_updated_at_User" ON "User";
CREATE TRIGGER "set_updated_at_User" BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "set_updated_at_Category" ON "Category";
CREATE TRIGGER "set_updated_at_Category" BEFORE UPDATE ON "Category" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "set_updated_at_PantryArea" ON "PantryArea";
CREATE TRIGGER "set_updated_at_PantryArea" BEFORE UPDATE ON "PantryArea" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "set_updated_at_PantryItem" ON "PantryItem";
CREATE TRIGGER "set_updated_at_PantryItem" BEFORE UPDATE ON "PantryItem" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "set_updated_at_ShoppingItem" ON "ShoppingItem";
CREATE TRIGGER "set_updated_at_ShoppingItem" BEFORE UPDATE ON "ShoppingItem" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

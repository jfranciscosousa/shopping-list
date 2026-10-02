-- Drizzle runs this migration and its migration-log insert in one transaction.
-- Lock before taking the ID map so concurrent writes cannot escape the conversion.
LOCK TABLE "User", "Category", "ShoppingItem", "PantryArea", "PantryItem" IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
CREATE TEMP TABLE uuid_id_map (
  table_name text NOT NULL,
  old_id integer NOT NULL,
  new_id uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY (table_name, old_id),
  UNIQUE (new_id)
) ON COMMIT DROP;
INSERT INTO uuid_id_map (table_name, old_id)
SELECT 'User', id FROM "User"
UNION ALL SELECT 'Category', id FROM "Category"
UNION ALL SELECT 'ShoppingItem', id FROM "ShoppingItem"
UNION ALL SELECT 'PantryArea', id FROM "PantryArea"
UNION ALL SELECT 'PantryItem', id FROM "PantryItem";
--> statement-breakpoint
CREATE FUNCTION pg_temp.mapped_uuid(source_table text, source_id integer)
RETURNS uuid LANGUAGE sql STABLE STRICT AS $$
  SELECT new_id FROM pg_temp.uuid_id_map
  WHERE table_name = source_table AND old_id = source_id;
$$;
--> statement-breakpoint
-- Keep the installed constraint names and actions, including Prisma-era names.
CREATE TEMP TABLE uuid_foreign_keys ON COMMIT DROP AS
SELECT conrelid::regclass::text AS table_name, conname AS constraint_name,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid IN ('"Category"'::regclass, '"ShoppingItem"'::regclass,
                  '"PantryArea"'::regclass, '"PantryItem"'::regclass);
DO $$
DECLARE fk record;
BEGIN
  FOR fk IN SELECT * FROM uuid_foreign_keys LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.table_name, fk.constraint_name);
  END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Category" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "ShoppingItem" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "PantryArea" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "PantryItem" ALTER COLUMN "id" DROP DEFAULT;
--> statement-breakpoint
-- ALTER TYPE does not fire UPDATE triggers, so all timestamps remain unchanged.
ALTER TABLE "User"
  ALTER COLUMN "id" TYPE uuid USING pg_temp.mapped_uuid('User', "id"),
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Category"
  ALTER COLUMN "id" TYPE uuid USING pg_temp.mapped_uuid('Category', "id"),
  ALTER COLUMN "userId" TYPE uuid USING pg_temp.mapped_uuid('User', "userId"),
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "ShoppingItem"
  ALTER COLUMN "id" TYPE uuid USING pg_temp.mapped_uuid('ShoppingItem', "id"),
  ALTER COLUMN "categoryId" TYPE uuid USING pg_temp.mapped_uuid('Category', "categoryId"),
  ALTER COLUMN "userId" TYPE uuid USING pg_temp.mapped_uuid('User', "userId"),
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "PantryArea"
  ALTER COLUMN "id" TYPE uuid USING pg_temp.mapped_uuid('PantryArea', "id"),
  ALTER COLUMN "userId" TYPE uuid USING pg_temp.mapped_uuid('User', "userId"),
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "PantryItem"
  ALTER COLUMN "id" TYPE uuid USING pg_temp.mapped_uuid('PantryItem', "id"),
  ALTER COLUMN "pantryAreaId" TYPE uuid USING pg_temp.mapped_uuid('PantryArea', "pantryAreaId"),
  ALTER COLUMN "userId" TYPE uuid USING pg_temp.mapped_uuid('User', "userId"),
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
--> statement-breakpoint
DO $$
DECLARE fk record;
BEGIN
  FOR fk IN SELECT * FROM uuid_foreign_keys LOOP
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',
                   fk.table_name, fk.constraint_name, fk.definition);
  END LOOP;
END $$;
--> statement-breakpoint
DROP SEQUENCE IF EXISTS "User_id_seq", "Category_id_seq", "ShoppingItem_id_seq", "PantryArea_id_seq", "PantryItem_id_seq";
DROP FUNCTION pg_temp.mapped_uuid(text, integer);

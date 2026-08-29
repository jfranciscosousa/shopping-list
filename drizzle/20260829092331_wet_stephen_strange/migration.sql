CREATE TABLE IF NOT EXISTS "Category" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"sortIndex" integer,
	"userId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PantryArea" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PantryItem" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"producedAt" timestamp(3) DEFAULT now() NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"pantryAreaId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ShoppingItem" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"categoryId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Ensure timestamp defaults exist. On Vercel the tables were originally created by
-- Prisma, which leaves `updatedAt` (and sometimes `createdAt`) without a database
-- DEFAULT, causing null-violation inserts. `SET DEFAULT` is a no-op when the default
-- is already present, so this is safe to re-run on existing tables.
ALTER TABLE "Category" ALTER COLUMN "createdAt" SET DEFAULT now(), ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "PantryArea" ALTER COLUMN "createdAt" SET DEFAULT now(), ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "PantryItem" ALTER COLUMN "producedAt" SET DEFAULT now(), ALTER COLUMN "createdAt" SET DEFAULT now(), ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "ShoppingItem" ALTER COLUMN "createdAt" SET DEFAULT now(), ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT now(), ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint

-- Add the unique index and foreign keys only when missing, so re-running this on the
-- Prisma-created production schema does not duplicate constraints.
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_email_key') THEN
		CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
		JOIN pg_class t ON t.oid = c.conrelid
		JOIN pg_class ft ON ft.oid = c.confrelid
		WHERE t.relname = 'Category' AND a.attname = 'userId' AND ft.relname = 'User' AND c.contype = 'f'
	) THEN
		ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
		JOIN pg_class t ON t.oid = c.conrelid
		JOIN pg_class ft ON ft.oid = c.confrelid
		WHERE t.relname = 'PantryArea' AND a.attname = 'userId' AND ft.relname = 'User' AND c.contype = 'f'
	) THEN
		ALTER TABLE "PantryArea" ADD CONSTRAINT "PantryArea_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
		JOIN pg_class t ON t.oid = c.conrelid
		JOIN pg_class ft ON ft.oid = c.confrelid
		WHERE t.relname = 'PantryItem' AND a.attname = 'pantryAreaId' AND ft.relname = 'PantryArea' AND c.contype = 'f'
	) THEN
		ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_pantryAreaId_PantryArea_id_fkey" FOREIGN KEY ("pantryAreaId") REFERENCES "PantryArea"("id") ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
		JOIN pg_class t ON t.oid = c.conrelid
		JOIN pg_class ft ON ft.oid = c.confrelid
		WHERE t.relname = 'PantryItem' AND a.attname = 'userId' AND ft.relname = 'User' AND c.contype = 'f'
	) THEN
		ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
		JOIN pg_class t ON t.oid = c.conrelid
		JOIN pg_class ft ON ft.oid = c.confrelid
		WHERE t.relname = 'ShoppingItem' AND a.attname = 'categoryId' AND ft.relname = 'Category' AND c.contype = 'f'
	) THEN
		ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_categoryId_Category_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
		JOIN pg_class t ON t.oid = c.conrelid
		JOIN pg_class ft ON ft.oid = c.confrelid
		WHERE t.relname = 'ShoppingItem' AND a.attname = 'userId' AND ft.relname = 'User' AND c.contype = 'f'
	) THEN
		ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
	END IF;
END $$;

CREATE TABLE "Category" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"sortIndex" integer,
	"userId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PantryArea" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PantryItem" (
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
CREATE TABLE "ShoppingItem" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"categoryId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");--> statement-breakpoint
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "PantryArea" ADD CONSTRAINT "PantryArea_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_pantryAreaId_PantryArea_id_fkey" FOREIGN KEY ("pantryAreaId") REFERENCES "PantryArea"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_categoryId_Category_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
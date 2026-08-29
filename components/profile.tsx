"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserProfileForm from "@/components/user-profile-form";
import useTabs from "@/hooks/use-tabs";
import { cn } from "@/lib/utils";
import { UserWithoutPassword } from "@/server/auth.actions";
import type { Category } from "@/server/db/schema";
import { ArrowLeft, Settings2, Tags, UserRound } from "lucide-react";
import Link from "next/link";
import CategoryList from "./category-list";

type Props = { user: UserWithoutPassword; initialCategories: Category[] };

export default function Profile({ user, initialCategories }: Props) {
  const { activeTab, setActiveTab } = useTabs("profile");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8">
        <Link
          href="/"
          className={cn(
            "-ml-3 mb-5 flex w-fit items-center gap-2 rounded-full text-muted-foreground",
            buttonVariants({ variant: "ghost", size: "sm" }),
          )}
        >
          <ArrowLeft className="size-4" /> Back to shopping list
        </Link>
        <div className="flex items-start gap-4">
          <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
            <Settings2 className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Your space
            </p>
            <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">Settings</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Keep your account details current and teach Smart Shopping how you like your aisles
              organized.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-border/80 bg-card/80 shadow-lg shadow-primary/5 backdrop-blur-sm">
        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full lg:grid lg:grid-cols-[15rem_1fr]"
        >
          <div className="border-b border-border/70 bg-secondary/25 p-4 lg:min-h-[36rem] lg:border-r lg:border-b-0 lg:p-5">
            <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:block">
              Preferences
            </p>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-transparent p-0 lg:grid-cols-1">
              <TabsTrigger
                value="profile"
                className="h-11 justify-start gap-2 rounded-xl px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <UserRound className="size-4" /> Profile
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="h-11 justify-start gap-2 rounded-xl px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Tags className="size-4" /> Categories
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="m-0 p-5 sm:p-8 lg:p-10">
            <UserProfileForm user={user} />
          </TabsContent>

          <TabsContent value="categories" className="m-0 p-5 sm:p-8 lg:p-10">
            <CategoryList initialCategories={initialCategories} />
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}

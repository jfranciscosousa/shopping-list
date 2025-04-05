"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserProfileForm from "@/components/user-profile-form";
import { Category, User } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CategoryList from "./category-list";
import useTabs from "@/hooks/use-tabs";

type Props = { user: Omit<User, "password">; initialCategories: Category[] };

export default function Profile({ user, initialCategories }: Props) {
  const { activeTab, setActiveTab } = useTabs("profile");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" asChild>
          <Link href="/list" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Shopping List
          </Link>
        </Button>
      </div>

      <Card>
        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="p-4 pt-6">
            <UserProfileForm user={user} />
          </TabsContent>

          <TabsContent value="categories" className="p-4 pt-6">
            <CategoryList initialCategories={initialCategories} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

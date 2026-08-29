"use client";

import { LoadingButton } from "@/components/ui/loading-button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateUser } from "@/server/user.actions";
import type { User } from "@/server/db/schema";
import type React from "react";
import { useState } from "react";

export default function UserProfileForm({ user }: { user: Omit<User, "password"> }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const data = await updateUser(formData);

      if (data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader className="px-0 pt-0">
        <CardTitle className="font-display text-3xl font-normal">Your profile</CardTitle>
        <CardDescription>Update the details connected to your account.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-0">
        <div className="space-y-2.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={user.name || ""}
            className="h-11 rounded-xl bg-background/60"
            required
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email}
            className="h-11 rounded-xl bg-background/60"
            required
          />
        </div>

        <div className="border-t border-border/70 pt-7">
          <CardTitle className="mb-2 font-display text-2xl font-normal">Change password</CardTitle>
          <CardDescription className="mb-5">
            Leave blank to keep your current password
          </CardDescription>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className="h-11 rounded-xl bg-background/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                className="h-11 rounded-xl bg-background/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="h-11 rounded-xl bg-background/60"
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-0 pb-0 pt-6">
        <LoadingButton
          type="submit"
          className="h-11 rounded-xl px-6"
          isLoading={isLoading}
          loadingText="Saving..."
        >
          Save Changes
        </LoadingButton>
      </CardFooter>
    </form>
  );
}

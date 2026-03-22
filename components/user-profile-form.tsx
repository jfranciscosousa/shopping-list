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
import { User } from "@prisma/client";
import { FormEvent, useState } from "react";

export default function UserProfileForm({ user }: { user: Omit<User, "password"> }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
      <CardHeader className="px-0">
        <CardTitle>User Information</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-0">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={user.name || ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={user.email} required />
        </div>

        <div className="pt-4">
          <CardTitle className="text-lg mb-2">Change Password</CardTitle>
          <CardDescription className="mb-4">
            Leave blank to keep your current password
          </CardDescription>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-0">
        <LoadingButton type="submit" isLoading={isLoading} loadingText="Saving...">
          Save Changes
        </LoadingButton>
      </CardFooter>
    </form>
  );
}

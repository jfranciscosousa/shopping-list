"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { login, signup } from "@/server/auth.actions";
import { useState } from "react";
import useTabs from "@/hooks/use-tabs";

export default function LoginForm() {
  const { activeTab, setActiveTab } = useTabs("login");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = await login(formData);

    if (!data.success) {
      toast({
        title: "Error",
        description: data.error || "Invalid email or password",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = await signup(formData);

    if (!data.success) {
      toast({
        title: "Error",
        description: data.error || "Failed to create account",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Smart Shopping List</CardTitle>
          <CardDescription className="text-center">
            Sign in to manage your shopping list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input type="email" name="email" placeholder="Email" required />
                </div>
                <div className="space-y-2">
                  <Input type="password" name="password" placeholder="Password" required />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="login-remember" name="rememberMe" />
                  <Label htmlFor="login-remember">Remember me</Label>
                </div>
                <LoadingButton
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  loadingText="Logging in..."
                >
                  Login
                </LoadingButton>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 flex flex-col gap-2">
                <Input type="text" name="name" placeholder="Name" required aria-label="Name" />

                <Input type="email" name="email" placeholder="Email" required aria-label="Email" />

                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  aria-label="Password"
                />

                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  required
                  aria-label="Confirm password"
                />

                <Input
                  type="text"
                  name="inviteToken"
                  placeholder="Invite token"
                  aria-label="Invite token"
                />

                <div className="flex items-center space-x-2">
                  <Checkbox id="signup-remember" name="rememberMe" />
                  <Label htmlFor="signup-remember">Remember me</Label>
                </div>

                <LoadingButton
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                >
                  Create Account
                </LoadingButton>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          {activeTab === "login" ? (
            <p>
              Don&apos;t have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("signup")}>
                Sign up
              </Button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>
                Login
              </Button>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

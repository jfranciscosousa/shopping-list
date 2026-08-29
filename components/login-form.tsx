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
import { Check, Sparkles } from "lucide-react";

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
    <main className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-16">
      <section className="max-w-2xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="size-3.5" />
          A calmer way to shop
        </div>
        <h1 className="font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
          Plan less.
          <br />
          <span className="text-primary">Remember everything.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          Turn scattered ideas, weekly recipes, and last-minute essentials into one beautifully
          organized market list.
        </p>
        <div className="mt-9 grid gap-3 text-sm sm:grid-cols-3">
          {["Instantly sorted", "Built for the aisle", "Simple to share"].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 font-medium">
              <span className="grid size-6 place-items-center rounded-full bg-secondary text-primary">
                <Check className="size-3.5" />
              </span>
              {benefit}
            </div>
          ))}
        </div>
      </section>

      <Card className="w-full overflow-hidden border-border/80 bg-card/85 shadow-2xl shadow-primary/10 backdrop-blur-sm">
        <CardHeader className="border-b border-border/60 pb-6">
          <CardTitle className="font-display text-3xl font-normal">
            Welcome to your market
          </CardTitle>
          <CardDescription>Sign in or create an account to start a fresh list.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl bg-muted/70 p-1">
              <TabsTrigger value="login" className="rounded-lg">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-xl bg-background/60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    className="h-11 rounded-xl bg-background/60"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="login-remember" name="rememberMe" />
                  <Label htmlFor="login-remember">Remember me</Label>
                </div>
                <LoadingButton
                  type="submit"
                  className="h-11 w-full rounded-xl"
                  isLoading={isLoading}
                  loadingText="Logging in..."
                >
                  Sign in
                </LoadingButton>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    name="name"
                    placeholder="Your name"
                    className="h-11 rounded-xl bg-background/60"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-xl bg-background/60"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      name="password"
                      placeholder="Create password"
                      className="h-11 rounded-xl bg-background/60"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      name="confirmPassword"
                      placeholder="Repeat password"
                      className="h-11 rounded-xl bg-background/60"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-invite">Invite token</Label>
                  <Input
                    id="signup-invite"
                    type="text"
                    name="inviteToken"
                    placeholder="Optional"
                    className="h-11 rounded-xl bg-background/60"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="signup-remember" name="rememberMe" />
                  <Label htmlFor="signup-remember">Remember me</Label>
                </div>

                <LoadingButton
                  type="submit"
                  className="h-11 w-full rounded-xl"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                >
                  Create Account
                </LoadingButton>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/60 py-5 text-sm text-muted-foreground">
          {activeTab === "login" ? (
            <p>
              New here?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("signup")}>
                Create an account
              </Button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>
                Sign in
              </Button>
            </p>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}

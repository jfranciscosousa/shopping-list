"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import argon2 from "argon2";
import prisma from "./prisma";
import { User } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    inviteToken: z.string().optional(),
    rememberMe: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Confirm password must match password",
    path: ["confirmPassword"],
  });

// Helper to set the auth cookie
async function setAuthCookie(user: User, rememberMe = false) {
  const cookieStore = await cookies();
  // Set expiration time - 1 hour or "forever" (1 year)
  const expiresIn = rememberMe
    ? 60 * 60 * 24 * 365 // 1 year in seconds
    : 60 * 60; // 1 hour in seconds

  const jwt = sign({ id: user.id }, process.env.SECRET_KEY_BASE as string, {
    expiresIn,
  });

  cookieStore.set("auth-token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(Date.now() + expiresIn * 1000),
    path: "/",
  });
}

// Helper to clear the auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

// Get the current user from the cookie
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");

    if (!authToken) return null;

    const { id: userId } = verify(
      authToken.value,
      process.env.SECRET_KEY_BASE as string,
    ) as JwtPayload;

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
}
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  const result = loginSchema.safeParse({ email, password, rememberMe });

  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user || !(await argon2.verify(user.password, password))) {
    return { success: false, error: "Invalid email or password" };
  }

  await setAuthCookie(user, rememberMe);

  redirect("/dashboard");
}

const DEFAULT_CATEGORIES = [
  {
    name: "Fruits & Vegetables",
    description: "fresh non frozen non canned",
  },
  {
    name: "Dairy & Eggs",
  },
  {
    name: "Meat & Fish",
    description: "fresh non frozen non canned",
  },
  {
    name: "Bakery",
  },
  {
    name: "Pantry",
  },
  {
    name: "Frozen Foods",
  },
  {
    name: "Beverages",
  },
  {
    name: "Snacks",
  },
  {
    name: "Household",
  },
  {
    name: "Personal Care",
  },
  {
    name: "Other",
  },
];

export async function signup(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const inviteToken = formData.get("inviteToken") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  const result = signupSchema.safeParse({
    name,
    email,
    password,
    confirmPassword,
    inviteToken,
    rememberMe,
  });

  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  if (process.env.INVITE_TOKEN && inviteToken !== process.env.INVITE_TOKEN) {
    return { success: false, error: "Invalid invite token" };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user) {
    return { success: false, error: "Email already exists" };
  }

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: await argon2.hash(password),
    },
  });
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({
      name: category.name,
      description: category.description || "",
      userId: newUser.id,
    })),
  });

  await setAuthCookie(newUser, rememberMe);

  redirect("/dashboard");
}

// Server action for logout
export async function logout() {
  await clearAuthCookie();
  redirect("/");
}

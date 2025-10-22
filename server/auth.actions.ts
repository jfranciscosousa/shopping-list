"use server";

import { User } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./password";
import prisma from "./prisma";
import { validateFormData } from "./utils";
import { cache } from "react";
import { withErrorHandling } from "./error-handler";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.preprocess((v) => v === "on", z.boolean().optional()),
});

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    inviteToken: z.string().optional(),
    rememberMe: z.preprocess((v) => v === "on", z.boolean().optional()),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Confirm password must match password",
    path: ["confirmPassword"],
  });

// Helper to set the auth cookie
async function setAuthCookie(user: User, rememberMe = false) {
  const cookieStore = await cookies();
  const secret = new TextEncoder().encode(process.env.SECRET_KEY_BASE);
  const expiresIn = rememberMe ? 60 * 60 * 24 * 365 : 60 * 60;

  const jwt = await new SignJWT({ id: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);

  cookieStore.set("auth-token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + expiresIn * 1000),
    path: "/",
  });
}

// Helper to clear the auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

const jwtPayloadSchema = z.object({
  id: z.number().int().positive(),
});

const getCurrentUserInner = cache(async (authToken: string) => {
  const secret = new TextEncoder().encode(process.env.SECRET_KEY_BASE);
  const { payload } = await jwtVerify(authToken, secret);

  const validatedPayload = jwtPayloadSchema.safeParse(payload);
  if (!validatedPayload.success) return null;

  const userId = validatedPayload.data.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return null;

  return user;
});

export type UserWithoutPassword = NonNullable<
  Awaited<ReturnType<typeof getCurrentUserInner>>
>;

export async function getCurrentUserOptional(): Promise<UserWithoutPassword | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");

    if (!authToken?.value) return null;

    return getCurrentUserInner(authToken.value);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getCurrentUser(): Promise<UserWithoutPassword> {
  const user = await getCurrentUserOptional();

  if (!user) throw new Error("unauthorized");

  return user;
}

export const login = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, loginSchema);

  if (validateResult.error) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { email, password, rememberMe } = validateResult.data;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user || !(await verifyPassword(user.password, password))) {
    return { success: false, error: "Invalid email or password" };
  }

  await setAuthCookie(user, rememberMe);

  return { success: true };
});

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

export const signup = withErrorHandling(async (formData: FormData) => {
  const validateResult = validateFormData(formData, signupSchema);

  if (validateResult.error) {
    return { success: false, error: validateResult.error.issues[0].message };
  }

  const { inviteToken, email, name, password, rememberMe } =
    validateResult.data;

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
      password: await hashPassword(password),
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

  return { success: true };
});

// Server action for logout
export async function logout() {
  await clearAuthCookie();
  redirect("/");
}

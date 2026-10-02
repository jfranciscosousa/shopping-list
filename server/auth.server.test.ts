import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { afterEach, expect, it, vi } from "vitest";
import { db } from "./db";
import { users } from "./db/schema";
import { hashPassword } from "./password";
import { getCurrentUserOptional, login } from "./auth.server";
import { updateUser } from "./user.server";

const cookies = vi.hoisted(() => new Map<string, string>());
vi.mock("@tanstack/react-start/server", () => ({
  getCookie: (name: string) => cookies.get(name),
  setCookie: (name: string, value: string) => cookies.set(name, value),
  deleteCookie: (name: string) => cookies.delete(name),
}));

afterEach(() => {
  cookies.clear();
  vi.unstubAllEnvs();
});

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

it.each([false, true])(
  "revokes old sessions after password changes (rememberMe: %s)",
  async (rememberMe) => {
    vi.stubEnv("SECRET_KEY_BASE", "test-session-secret");
    const id = randomUUID();
    const email = `${id}@example.test`;
    await db
      .insert(users)
      .values({ id, email, name: "Test User", password: await hashPassword("old-password") });
    const credentials = { email, password: "old-password", rememberMe: rememberMe ? "on" : "" };
    expect(await login(form(credentials))).toEqual({ success: true });
    const stolenToken = cookies.get("auth-token")!;
    expect(await getCurrentUserOptional()).toMatchObject({ id });
    expect(await getCurrentUserOptional()).not.toHaveProperty("password");

    const profile = {
      name: "Updated User",
      email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    expect(await updateUser(form(profile))).toEqual({ success: true });
    expect(await getCurrentUserOptional()).toMatchObject({ id, name: "Updated User" });

    const change = {
      ...profile,
      currentPassword: "wrong-password",
      newPassword: "new-password",
      confirmPassword: "new-password",
    };
    expect(await updateUser(form(change))).toMatchObject({ success: false });
    expect(await getCurrentUserOptional()).toMatchObject({ id });

    expect(await updateUser(form({ ...change, currentPassword: "old-password" }))).toEqual({
      success: true,
    });
    expect(cookies.has("auth-token")).toBe(false);
    cookies.set("auth-token", stolenToken);
    expect(await getCurrentUserOptional()).toBeNull();
    expect(await login(form(credentials))).toMatchObject({ success: false });
    expect(await login(form({ ...credentials, password: "new-password" }))).toEqual({
      success: true,
    });
    expect(await getCurrentUserOptional()).toMatchObject({ id });
  },
);

it("rejects legacy JWTs without a password version", async () => {
  vi.stubEnv("SECRET_KEY_BASE", "test-session-secret");
  const id = randomUUID();
  await db
    .insert(users)
    .values({ id, email: `${id}@example.test`, password: await hashPassword("old-password") });
  const token = await new SignJWT({ id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("365d")
    .sign(new TextEncoder().encode(process.env.SECRET_KEY_BASE));
  cookies.set("auth-token", token);
  expect(await getCurrentUserOptional()).toBeNull();
});

"use server";

import { compareSync, genSaltSync, hashSync } from "bcrypt-edge";

export async function hashPassword(password: string) {
  const salt = genSaltSync(12);
  return hashSync(password, salt);
}

export async function verifyPassword(hashedPassword: string, password: string) {
  return compareSync(password, hashedPassword);
}

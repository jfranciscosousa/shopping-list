import { PrismaClient } from "@/generated/prisma";

function buildClient() {
  const client = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
    log: ["query", "info", "warn", "error"],
  });

  return client;
}

/**
 * The type of the PrismaClient with extensions
 */
export type PrismaClientType = ReturnType<typeof buildClient>;

const prisma = buildClient();

export default prisma;

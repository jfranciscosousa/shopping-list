import Prisma from "@prisma/client/edge";

function buildClient() {
  const client = new Prisma.PrismaClient({
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

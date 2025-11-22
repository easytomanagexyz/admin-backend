import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

/**
 * Ensure a single PrismaClient instance for the admin (master DB)
 * Requires process.env.DATABASE_URL_MASTER to be set before importing this module
 */
export function getMasterPrisma(): PrismaClient {
  if (prisma) return prisma;
  prisma = new PrismaClient();
  return prisma;
}

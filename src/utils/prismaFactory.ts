import { PrismaClient } from "@prisma/client";

let masterPrisma: PrismaClient | null = null;

export function getMasterPrisma() {
  if (!masterPrisma) {
    masterPrisma = new PrismaClient();
  }
  return masterPrisma;
}

/**
 * Prisma singleton for server-side usage.
 * Prevents multiple client instances in development (hot-reload safe).
 */

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return createClient();
  }

  if (!global.__prisma) {
    global.__prisma = createClient();
  }

  return global.__prisma;
}

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({ adapter });
}

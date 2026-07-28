import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrisma();
    if (client) {
      const val = (client as unknown as Record<string | symbol, unknown>)[prop];
      if (typeof val === "function") {
        return val.bind(client);
      }
      return val;
    }

    if (
      prop === "$queryRaw" ||
      prop === "$queryRawUnsafe" ||
      prop === "$executeRaw" ||
      prop === "$executeRawUnsafe"
    ) {
      return async () => [];
    }

    return new Proxy({}, {
      get(_modelTarget, method: string | symbol) {
        return async () => {
          if (method === "findMany") return [];
          if (method === "count") return 0;
          return null;
        };
      },
    });
  },
});


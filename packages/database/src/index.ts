import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

const pool = globalForPrisma.pool;
const adapter = new PrismaPg(pool);

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;

export type * from "@prisma/client";

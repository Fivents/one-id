import { PrismaNeon } from '@prisma/adapter-neon';

import { PrismaClient } from '@/generated/prisma/client';

function createPrismaClient(): InstanceType<typeof PrismaClient> {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter }) as InstanceType<typeof PrismaClient>;
}

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

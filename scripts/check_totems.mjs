import { PrismaClient } from '../src/generated/prisma/client.js';
const prisma = new PrismaClient();
try {
  const totems = await prisma.totem.findMany({ take: 5, select: { id: true, name: true, accessCode: true, status: true } });
  console.log(JSON.stringify(totems, null, 2));
} finally {
  await prisma.$disconnect();
}

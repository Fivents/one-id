import { NextRequest, NextResponse } from 'next/server';

import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { prisma } from '@/core/infrastructure/prisma-client';

export const GET = withAuth(
  withRBAC(['EVENT_UPDATE'], async () => {
    const configs = await prisma.printConfig.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(configs, { status: 200 });
  }),
);

export const POST = withAuth(
  withRBAC(['EVENT_UPDATE'], async (_req: NextRequest) => {
    try {
      const config = await prisma.printConfig.create({ data: {} });

      return NextResponse.json(
        { id: config.id, createdAt: config.createdAt, updatedAt: config.updatedAt },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

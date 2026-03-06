import { NextRequest, NextResponse } from 'next/server';

import { makeBulkSoftDeleteUsersController } from '@/core/application/controller-factories';
import { bulkDeleteUsersRequestSchema } from '@/core/communication/requests/admin';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(bulkDeleteUsersRequestSchema, body);

      const controller = makeBulkSoftDeleteUsersController();
      const result = await controller.handle(data.userIds);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

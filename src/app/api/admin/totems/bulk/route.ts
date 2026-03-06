import { NextRequest, NextResponse } from 'next/server';

import { makeBulkCreateAdminTotemsController } from '@/core/application/controller-factories';
import { bulkCreateTotemsRequestSchema } from '@/core/communication/requests/admin-totems';
import { AppError } from '@/core/errors';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(bulkCreateTotemsRequestSchema, body);

      const controller = makeBulkCreateAdminTotemsController();
      const result = await controller.handle(data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

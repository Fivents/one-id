import { NextRequest, NextResponse } from 'next/server';

import { makeImportPersonsController } from '@/core/application/controller-factories';
import { importPersonsRequestSchema } from '@/core/communication/requests/person';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest) => {
    try {
      const body = await req.json();

      const parsed = parseWithZod(importPersonsRequestSchema, body);
      if (parsed instanceof AppError) {
        return NextResponse.json({ error: parsed.message }, { status: 400 });
      }

      const controller = makeImportPersonsController();
      const result = await controller.handle(parsed);

      return toNextResponse(result);
    } catch {
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

import { NextRequest, NextResponse } from 'next/server';

import { makeExportPersonsController } from '@/core/application/controller-factories';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest) => {
    const organizationId = req.nextUrl.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required.' }, { status: 400 });
    }

    const controller = makeExportPersonsController();
    const result = await controller.handle(organizationId);

    return toNextResponse(result);
  }),
);

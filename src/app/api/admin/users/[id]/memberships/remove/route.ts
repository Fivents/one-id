import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { containerService } from '@/core/application/services';
import { AppError } from '@/core/errors';
import { makeRemoveMemberUseCase } from '@/core/infrastructure/factories/make-membership.factory';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

const removeMemberSchema = z.object({
  membershipId: z.string().min(1),
});

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { id: userId } = await context.params;
      const body = await req.json();
      const data = parseWithZod(removeMemberSchema, body);

      const membershipRepository = containerService.getMembershipRepository();
      const memberships = await membershipRepository.findByUser(userId);

      if (memberships.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last membership. User must belong to at least one organization.' },
          { status: 400 },
        );
      }

      const useCase = makeRemoveMemberUseCase();
      await useCase.execute(data.membershipId);

      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

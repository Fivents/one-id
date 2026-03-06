import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { containerService } from '@/core/application/services';
import { AppError } from '@/core/errors';
import {
  makeAddMemberUseCase,
  makeUpdateMemberRoleUseCase,
} from '@/core/infrastructure/factories/make-membership.factory';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    try {
      const { id: userId } = await context.params;
      const membershipRepository = containerService.getMembershipRepository();
      const memberships = await membershipRepository.findByUser(userId);

      const organizationRepository = containerService.getOrganizationRepository();
      const orgs = await organizationRepository.findAll();
      const orgMap = new Map(orgs.map((o) => [o.id, o.name]));

      const data = memberships.map((m) => ({
        id: m.id,
        organizationId: m.organizationId,
        organizationName: orgMap.get(m.organizationId) ?? null,
        role: m.role,
        createdAt: m.createdAt,
      }));

      return NextResponse.json({ memberships: data });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

const addMemberSchema = z.object({
  organizationId: z.string().min(1),
  role: z.enum(['ORG_OWNER', 'EVENT_MANAGER']),
});

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {
    try {
      const { id: userId } = await context.params;
      const body = await req.json();
      const data = parseWithZod(addMemberSchema, body);

      const useCase = makeAddMemberUseCase();
      const membership = await useCase.execute({
        userId,
        organizationId: data.organizationId,
        role: data.role,
      });

      return NextResponse.json(
        { membership: { id: membership.id, organizationId: membership.organizationId, role: membership.role } },
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

const updateRoleSchema = z.object({
  membershipId: z.string().min(1),
  role: z.enum(['ORG_OWNER', 'EVENT_MANAGER']),
});

export const PATCH = withAuth(
  withSuperAdmin(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(updateRoleSchema, body);

      const useCase = makeUpdateMemberRoleUseCase();
      const membership = await useCase.execute(data.membershipId, data.role);

      return NextResponse.json({
        membership: { id: membership.id, organizationId: membership.organizationId, role: membership.role },
      });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

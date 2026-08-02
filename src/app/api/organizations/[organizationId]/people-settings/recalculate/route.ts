import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';
import { type CodeSourceField, resolveDerivedCodeUnique } from '@/core/utils/derived-code';

import { assertOrganizationAccess } from '../../../_lib/access';

const CHUNK_SIZE = 500;

type RecalculateTarget = 'accessCode' | 'qrCode';

function isRecalculateTarget(value: unknown): value is RecalculateTarget {
  return value === 'accessCode' || value === 'qrCode';
}

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { organizationId } = await context.params;

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const target = req.nextUrl.searchParams.get('target');
    if (!isRecalculateTarget(target)) {
      return NextResponse.json({ error: 'target must be "accessCode" or "qrCode".' }, { status: 400 });
    }

    const provenanceField = target === 'accessCode' ? 'accessCodeProvenance' : 'qrCodeProvenance';

    const eligibleCount = await prisma.person.count({
      where: {
        organizationId,
        deletedAt: null,
        [provenanceField]: { not: 'MANUAL' },
      },
    });

    return NextResponse.json({ eligibleCount }, { status: 200 });
  }),
);

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const { organizationId } = await context.params;

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const body = await req.json().catch(() => ({}));
    if (!isRecalculateTarget(body.target)) {
      return NextResponse.json({ error: 'target must be "accessCode" or "qrCode".' }, { status: 400 });
    }
    const target: RecalculateTarget = body.target;
    const cursor = typeof body.cursor === 'string' ? body.cursor : undefined;

    const peopleSettings = await prisma.organizationPeopleSettings.findUnique({
      where: { organizationId },
      select: { accessCodeSource: true, qrCodeSource: true },
    });
    const sourceField: CodeSourceField =
      target === 'accessCode'
        ? ((peopleSettings?.accessCodeSource as CodeSourceField) ?? 'NONE')
        : ((peopleSettings?.qrCodeSource as CodeSourceField) ?? 'NONE');

    const credentialLength = await resolveTotemAccessCodeLength(prisma, organizationId);
    const provenanceField = target === 'accessCode' ? 'accessCodeProvenance' : 'qrCodeProvenance';

    const eligiblePeople = await prisma.person.findMany({
      where: {
        organizationId,
        deletedAt: null,
        [provenanceField]: { not: 'MANUAL' },
      },
      select: { id: true, document: true, phone: true, email: true },
      orderBy: { id: 'asc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: CHUNK_SIZE,
    });

    const field = target === 'accessCode' ? 'accessCode' : 'qrCodeValue';
    let updatedCount = 0;
    const failedPersonIds: string[] = [];

    for (const person of eligiblePeople) {
      try {
        // Excludes this same person from the collision check — re-deriving from their own
        // unchanged phone/document/email may legitimately produce the value they already hold.
        const resolved = await resolveDerivedCodeUnique(
          {
            explicitValue: undefined,
            sourceField,
            document: person.document,
            phone: person.phone,
            email: person.email,
            credentialLength,
            uppercase: target === 'accessCode',
          },
          (value) =>
            prisma.person
              .findFirst({
                where: { organizationId, deletedAt: null, id: { not: person.id }, [field]: value },
                select: { id: true },
              })
              .then((existing) => existing !== null),
        );

        if (target === 'accessCode') {
          await prisma.person.update({
            where: { id: person.id },
            data: { accessCode: resolved.value, accessCodeProvenance: resolved.provenance },
          });

          await prisma.eventParticipant.updateMany({
            where: {
              personId: person.id,
              deletedAt: null,
              useDocumentAsAccessCode: false,
              accessCodeProvenance: { not: 'MANUAL' },
            },
            data: { accessCode: resolved.value, accessCodeProvenance: resolved.provenance },
          });
        } else {
          await prisma.person.update({
            where: { id: person.id },
            data: { qrCodeValue: resolved.value, qrCodeProvenance: resolved.provenance },
          });

          await prisma.eventParticipant.updateMany({
            where: {
              personId: person.id,
              deletedAt: null,
              qrCodeProvenance: { not: 'MANUAL' },
            },
            data: { qrCodeValue: resolved.value, qrCodeProvenance: resolved.provenance },
          });
        }

        updatedCount++;
      } catch (error) {
        // Never let one bad record abort the whole chunk — log and keep going.
        console.error(`Failed to recalculate ${target} for person ${person.id}`, error);
        failedPersonIds.push(person.id);
      }
    }

    if (updatedCount > 0) {
      const auth = getUserAuth(req);
      await prisma.auditLog.create({
        data: {
          action: 'PEOPLE_CODE_RECALCULATED',
          description: `Recalculated ${target} for ${updatedCount} people.`,
          metadata: { target, updatedCount, failedCount: failedPersonIds.length, cursor: cursor ?? null },
          organizationId,
          userId: auth.userId,
        },
      });
    }

    const nextCursor = eligiblePeople.length === CHUNK_SIZE ? eligiblePeople[eligiblePeople.length - 1].id : null;

    return NextResponse.json(
      {
        updatedCount,
        failedCount: failedPersonIds.length,
        remaining: nextCursor !== null,
        nextCursor,
      },
      { status: 200 },
    );
  }),
);

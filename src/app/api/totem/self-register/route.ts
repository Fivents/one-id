import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { AppError } from '@/core/errors';
import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { generateCheckInCredential, resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

const selfRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().min(1, 'Email is required.').email('Invalid email address.'),
  document: z.string().nullable().optional(),
  documentType: z.enum(['PASSPORT', 'ID_CARD', 'DRIVER_LICENSE', 'OTHER']).nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
});

export const POST = withAuth(
  withTotemAuth(
    withTotemRoutingGuard(async (req: NextRequest) => {
      try {
        const auth = getTotemAuth(req);
        const totemId = auth.totemId;

        const body = await req.json();
        const data = selfRegisterSchema.parse(body);

        const activeContext = await resolveActiveTotemEventContextByTotemId(totemId);

        if (!activeContext) {
          return NextResponse.json(
            { error: 'No active event assigned to this totem.', code: 'TOTEM_NO_ACTIVE_EVENT' },
            { status: 403 },
          );
        }

        if (!activeContext.event.allowSelfRegistration) {
          return NextResponse.json(
            { error: 'Self-registration is not enabled for this event.', code: 'SELF_REGISTRATION_DISABLED' },
            { status: 403 },
          );
        }

        const credentialLength = await resolveTotemAccessCodeLength(prisma, activeContext.organizationId);
        const qrCodeValue = generateCheckInCredential(credentialLength);
        const accessCode = generateCheckInCredential(credentialLength);

        const result = await prisma.$transaction(async (tx) => {
          let person = await tx.person.findFirst({
            where: {
              organizationId: activeContext.organizationId,
              email: data.email,
            },
          });

          if (person) {
            if (person.deletedAt) {
              person = await tx.person.update({
                where: { id: person.id },
                data: {
                  name: data.name,
                  document: data.document ?? null,
                  documentType: data.documentType ?? null,
                  phone: data.phone ?? null,
                  deletedAt: null,
                },
              });
            }
          } else {
            person = await tx.person.create({
              data: {
                name: data.name,
                email: data.email,
                document: data.document ?? null,
                documentType: data.documentType ?? null,
                phone: data.phone ?? null,
                organizationId: activeContext.organizationId,
              },
            });
          }

          const existingParticipant = await tx.eventParticipant.findFirst({
            where: {
              eventId: activeContext.event.id,
              personId: person.id,
            },
          });

          let eventParticipant: { id: string; company: string | null; jobTitle: string | null; accessCode: string | null; qrCodeValue: string | null; personId: string };

          if (existingParticipant) {
            if (existingParticipant.deletedAt) {
              eventParticipant = await tx.eventParticipant.update({
                where: { id: existingParticipant.id },
                data: {
                  company: data.company ?? null,
                  jobTitle: data.jobTitle ?? null,
                  qrCodeValue,
                  accessCode,
                  deletedAt: null,
                },
              });
            } else {
              return {
                error: 'Participant already registered for this event.',
                code: 'PARTICIPANT_ALREADY_REGISTERED',
              };
            }
          } else {
            eventParticipant = await tx.eventParticipant.create({
              data: {
                company: data.company ?? null,
                jobTitle: data.jobTitle ?? null,
                qrCodeValue,
                accessCode,
                personId: person.id,
                eventId: activeContext.event.id,
              },
            });
          }

          const existingCheckIn = await tx.checkIn.findFirst({
            where: {
              eventParticipantId: eventParticipant.id,
            },
          });

          if (existingCheckIn) {
            return {
              id: existingCheckIn.id,
              eventParticipantId: eventParticipant.id,
              participant: {
                name: person.name,
                company: eventParticipant.company,
                jobTitle: eventParticipant.jobTitle,
                imageUrl: null as string | null,
                accessCode: eventParticipant.accessCode,
                qrCodeValue: eventParticipant.qrCodeValue,
              },
            };
          }

          const checkIn = await tx.checkIn.create({
            data: {
              method: 'MANUAL',
              checkedInAt: new Date(),
              eventParticipantId: eventParticipant.id,
              totemEventSubscriptionId: activeContext.totemEventSubscriptionId,
            },
          });

          const firstFace = await tx.personFace.findFirst({
            where: { personId: person.id, deletedAt: null, isActive: true },
            select: { imageUrl: true },
            orderBy: { createdAt: 'desc' },
          });

          return {
            id: checkIn.id,
            eventParticipantId: eventParticipant.id,
            participant: {
              name: person.name,
              company: eventParticipant.company,
              jobTitle: eventParticipant.jobTitle,
              imageUrl: firstFace?.imageUrl ?? null,
              accessCode: eventParticipant.accessCode,
              qrCodeValue: eventParticipant.qrCodeValue,
            },
          };
        });

        if ('error' in result) {
          return NextResponse.json({ error: result.error, code: result.code }, { status: 409 });
        }

        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        if (error instanceof AppError) {
          return NextResponse.json({ error: error.message }, { status: error.httpStatus });
        }

        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
        }

        console.error('[totem-self-register] Unhandled error:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
      }
    }),
  ),
);

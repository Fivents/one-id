import { NextRequest, NextResponse } from 'next/server';

import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { generateCheckInCredential, resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';

import { getAuthorizedEvent } from '../../../_lib/access';

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const event = eventOrResponse;
      const body = await req.json();
      const { overwrite, participants } = body as {
        overwrite: boolean;
        participants: Array<{
          name: string;
          email?: string | null;
          document?: string | null;
          phone?: string | null;
          jobTitle?: string | null;
          birthDate?: string | null;
          notes?: string | null;
          company?: string | null;
          accessCode?: string | null;
          qrCodeValue?: string | null;
        }>;
      };

      if (!Array.isArray(participants)) {
        return NextResponse.json({ error: 'participants must be an array.' }, { status: 400 });
      }

      const credentialLength = await resolveTotemAccessCodeLength(prisma, event.organizationId);

      const result: {
        created: number;
        updated: number;
        skipped: string[];
        errors: { row: number; message: string }[];
      } = { created: 0, updated: 0, skipped: [], errors: [] };

      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        const rowNum = i + 1;

        try {
          let personId: string;
          const existingPersonByEmail = p.email
            ? await prisma.person.findFirst({
                where: {
                  email: p.email,
                  organizationId: event.organizationId,
                  deletedAt: null,
                },
                select: { id: true },
              })
            : null;

          const existingPersonByDocument = p.document
            ? await prisma.person.findFirst({
                where: {
                  document: p.document,
                  organizationId: event.organizationId,
                  deletedAt: null,
                },
                select: { id: true },
              })
            : null;

          const existingPerson = existingPersonByEmail || existingPersonByDocument;

          if (existingPerson) {
            if (overwrite) {
              await prisma.person.update({
                where: { id: existingPerson.id },
                data: {
                  name: p.name,
                  ...(p.email ? { email: p.email } : {}),
                  ...(p.document ? { document: p.document } : {}),
                  ...(p.phone ? { phone: p.phone } : {}),
                  ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}),
                  ...(p.birthDate ? { birthDate: new Date(p.birthDate) } : {}),
                  ...(p.notes ? { notes: p.notes } : {}),
                },
              });
            }
            personId = existingPerson.id;
          } else {
            const person = await prisma.person.create({
              data: {
                name: p.name,
                email: p.email || '',
                organizationId: event.organizationId,
                ...(p.document ? { document: p.document } : {}),
                ...(p.phone ? { phone: p.phone } : {}),
                ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}),
                ...(p.birthDate ? { birthDate: new Date(p.birthDate) } : {}),
                ...(p.notes ? { notes: p.notes } : {}),
              },
            });
            personId = person.id;
          }

          const existingParticipant = await prisma.eventParticipant.findFirst({
            where: { eventId, personId, deletedAt: null },
            select: { id: true },
          });

          if (existingParticipant) {
            if (overwrite) {
              await prisma.eventParticipant.update({
                where: { id: existingParticipant.id },
                data: {
                  ...(p.company ? { company: p.company } : {}),
                  ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}),
                  ...(p.qrCodeValue ? { qrCodeValue: p.qrCodeValue } : {}),
                  ...(p.accessCode ? { accessCode: p.accessCode.toUpperCase() } : {}),
                },
              });
              result.updated++;
            } else {
              result.skipped.push(p.name);
            }
          } else {
            const accessCode = p.accessCode?.trim().toUpperCase() || generateCheckInCredential(credentialLength);
            const qrCodeValue = p.qrCodeValue?.trim() || generateCheckInCredential(credentialLength);

            await prisma.eventParticipant.create({
              data: {
                personId,
                eventId,
                company: p.company || null,
                jobTitle: p.jobTitle || null,
                qrCodeValue,
                accessCode,
              },
            });

            if (existingPerson) {
              result.updated++;
            } else {
              result.created++;
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          result.errors.push({ row: rowNum, message });
        }
      }

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  }),
);

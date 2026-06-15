import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { PrismaPrintJobRepository } from '@/core/infrastructure/repositories/prisma-print-job.repository';
import { PrismaPrintConfigRepository } from '@/core/infrastructure/repositories/prisma-print-config.repository';
import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { PrintJobService } from '@/core/application/services/print-job.service';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

const printRequestSchema = z.object({
  eventParticipantId: z.string().min(1),
  checkInId: z.string().optional(),
});

export const POST = withAuth(
  withTotemAuth(
    withTotemRoutingGuard(async (req: NextRequest) => {
      try {
        const auth = getTotemAuth(req);
        const totemId = auth.totemId;

        const context = await resolveActiveTotemEventContextByTotemId(totemId);
        if (!context) {
          return NextResponse.json(
            { error: 'No active event assigned to this totem.', code: 'TOTEM_NO_ACTIVE_EVENT' },
            { status: 403 },
          );
        }

        const body = await req.json();
        const data = printRequestSchema.parse(body);

        const eventParticipant = await prisma.eventParticipant.findUnique({
          where: { id: data.eventParticipantId },
          select: {
            id: true,
            company: true,
            jobTitle: true,
            accessCode: true,
            qrCodeValue: true,
            eventId: true,
            event: {
              select: {
                name: true,
                printConfigId: true,
              },
            },
            person: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!eventParticipant) {
          return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });
        }

        if (eventParticipant.eventId !== context.event.id) {
          return NextResponse.json({ error: 'Participant does not belong to this event.' }, { status: 403 });
        }

        if (!eventParticipant.event.printConfigId) {
          return NextResponse.json({ error: 'No print configuration for this event.' }, { status: 404 });
        }

        const printJobRepo = new PrismaPrintJobRepository(prisma);
        const printConfigRepo = new PrismaPrintConfigRepository(prisma);
        const printJobService = new PrintJobService(printJobRepo);

        const printConfig = await printConfigRepo.findById(eventParticipant.event.printConfigId);
        if (!printConfig) {
          return NextResponse.json({ error: 'Print configuration not found.' }, { status: 404 });
        }

        const result = await printJobService.executePrint(
          {
            eventId: context.event.id,
            eventParticipantId: data.eventParticipantId,
            checkInId: data.checkInId ?? null,
            totemId,
            printConfigId: printConfig.id,
            copies: printConfig.copies,
          },
          {
            id: eventParticipant.id,
            name: eventParticipant.person.name,
            company: eventParticipant.company,
            jobTitle: eventParticipant.jobTitle,
            accessCode: eventParticipant.accessCode,
            qrCodeValue: eventParticipant.qrCodeValue,
          },
          { name: context.event.name },
          printConfig,
        );

        return NextResponse.json(
          {
            jobId: result.job.id,
            token: result.token,
            html: result.html,
            paperWidth: printConfig.paperWidth,
            paperHeight: printConfig.paperHeight,
            printerDpi: printConfig.printerDpi,
            copies: printConfig.copies,
          },
          { status: 201 },
        );
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
        }

        const message = error instanceof Error ? error.message : 'Internal server error.';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }),
  ),
);

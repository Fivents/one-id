import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { PrintJobService } from '@/core/application/services/print-job.service';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { PrismaPrintConfigRepository } from '@/core/infrastructure/repositories/prisma-print-config.repository';
import { PrismaPrintJobRepository } from '@/core/infrastructure/repositories/prisma-print-job.repository';

import { getAuthorizedEvent } from '../../_lib/access';

const batchPrintSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1).max(100),
});

export const POST = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, name: true, printConfigId: true, organizationId: true },
      });

      if (!event) {
        return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
      }

      if (!event.printConfigId) {
        return NextResponse.json({ error: 'No print configuration for this event.' }, { status: 404 });
      }

      const body = await req.json();
      const data = batchPrintSchema.parse(body);

      const printConfigRepo = new PrismaPrintConfigRepository(prisma);
      const printJobRepo = new PrismaPrintJobRepository(prisma);
      const printJobService = new PrintJobService(printJobRepo);

      const printConfig = await printConfigRepo.findById(event.printConfigId);
      if (!printConfig) {
        return NextResponse.json({ error: 'Print configuration not found.' }, { status: 404 });
      }

      const participants = await prisma.eventParticipant.findMany({
        where: {
          id: { in: data.participantIds },
          eventId,
          deletedAt: null,
        },
        select: {
          id: true,
          company: true,
          jobTitle: true,
          accessCode: true,
          qrCodeValue: true,
          person: { select: { name: true } },
        },
      });

      if (participants.length === 0) {
        return NextResponse.json({ error: 'No participants found.' }, { status: 404 });
      }

      const results = await Promise.allSettled(
        participants.map(async (participant) => {
          const result = await printJobService.executePrint(
            {
              eventId,
              eventParticipantId: participant.id,
              printConfigId: printConfig.id,
              copies: printConfig.copies,
            },
            {
              id: participant.id,
              name: participant.person.name,
              company: participant.company,
              jobTitle: participant.jobTitle,
              accessCode: participant.accessCode,
              qrCodeValue: participant.qrCodeValue,
            },
            { name: event.name },
            printConfig,
          );

          return {
            participantId: participant.id,
            jobId: result.job.id,
            token: result.token,
            html: result.html,
            copies: printConfig.copies,
            printerDpi: printConfig.printerDpi,
            paperWidth: printConfig.paperWidth,
            paperHeight: printConfig.paperHeight,
            success: true,
          };
        }),
      );

      const jobs = results.map((r) =>
        r.status === 'fulfilled'
          ? r.value
          : {
              participantId: '',
              jobId: '',
              token: '',
              html: '',
              copies: printConfig.copies,
              printerDpi: printConfig.printerDpi,
              paperWidth: printConfig.paperWidth,
              paperHeight: printConfig.paperHeight,
              success: false,
              error: r.reason?.message ?? 'Unknown error',
            },
      );

      return NextResponse.json({ jobs }, { status: 201 });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);

import { NextRequest, NextResponse } from 'next/server';

import { PrintConfigEntity, type QrCodeContentType } from '@/core/domain/entities/print-config.entity';
import { PrintJobService } from '@/core/application/services/print-job.service';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { PrismaPrintJobRepository } from '@/core/infrastructure/repositories/prisma-print-job.repository';

import { getAuthorizedEvent } from '../../../_lib/access';

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
        select: {
          id: true,
          name: true,
          printConfigId: true,
          printConfig: {
            select: {
              id: true,
              paperWidth: true,
              paperHeight: true,
              orientation: true,
              printerDpi: true,
              copies: true,
              qrCodeContent: true,
              showQrCode: true,
              showAccessCode: true,
              fontSizeName: true,
              fontSizeMeta: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!event) {
        return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
      }

      if (!event.printConfig || !event.printConfigId) {
        return NextResponse.json({ error: 'No print configuration for this event.' }, { status: 404 });
      }

      const printJobRepo = new PrismaPrintJobRepository(prisma);
      const printJobService = new PrintJobService(printJobRepo);

      const printConfig = PrintConfigEntity.create({
        ...event.printConfig,
        qrCodeContent: event.printConfig.qrCodeContent as QrCodeContentType,
        createdAt: new Date(event.printConfig.createdAt),
        updatedAt: new Date(event.printConfig.updatedAt),
      });

      const html = await printJobService.generateBadgeHtml(
        {
          name: 'Teste',
          company: null,
          jobTitle: null,
          accessCode: 'TEST-123',
          qrCodeValue: 'TEST-QR-456',
        },
        { name: event.name },
        printConfig,
      );

      return NextResponse.json({
        html,
        copies: printConfig.copies,
        printerDpi: printConfig.printerDpi,
        paperWidth: printConfig.paperWidth,
        paperHeight: printConfig.paperHeight,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);

import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { type PrintConfigResponse,updatePrintConfigRequestSchema } from '@/core/communication/requests/print-config';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { Prisma } from '@/generated/prisma/client';

import { getAuthorizedEvent } from '../../_lib/access';

function mapPrintConfigToResponse(config: Prisma.PrintConfigGetPayload<Record<string, never>>): PrintConfigResponse {
  return {
    id: config.id,
    paperWidth: config.paperWidth,
    paperHeight: config.paperHeight,
    orientation: config.orientation,
    marginTop: config.marginTop,
    marginRight: config.marginRight,
    marginBottom: config.marginBottom,
    marginLeft: config.marginLeft,
    showFiventsLogo: config.showFiventsLogo,
    fiventsLogoPosition: config.fiventsLogoPosition,
    fiventsLogoSize: config.fiventsLogoSize,
    showOrgLogo: config.showOrgLogo,
    orgLogoPosition: config.orgLogoPosition,
    orgLogoSize: config.orgLogoSize,
    showQrCode: config.showQrCode,
    qrCodePosition: config.qrCodePosition,
    qrCodeSize: config.qrCodeSize,
    qrCodeContent: config.qrCodeContent,
    showName: config.showName,
    namePosition: config.namePosition,
    nameFontSize: config.nameFontSize,
    nameBold: config.nameBold,
    showCompany: config.showCompany,
    companyPosition: config.companyPosition,
    companyFontSize: config.companyFontSize,
    showJobTitle: config.showJobTitle,
    jobTitlePosition: config.jobTitlePosition,
    jobTitleFontSize: config.jobTitleFontSize,
    itemsOrder: typeof config.itemsOrder === 'string' ? JSON.parse(config.itemsOrder || '[]') : config.itemsOrder || [],
    printerDpi: config.printerDpi,
    printerType: config.printerType,
    printSpeed: config.printSpeed,
    copies: config.copies,
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
    fontFamily: config.fontFamily,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { printConfigId: true },
      });

      if (!event || !event.printConfigId) {
        return NextResponse.json(
          { error: 'Print configuration not found for this event.' },
          { status: 404 },
        );
      }

      const config = await prisma.printConfig.findUnique({
        where: { id: event.printConfigId },
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Print configuration not found.' },
          { status: 404 },
        );
      }

      return NextResponse.json(mapPrintConfigToResponse(config), { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);

export const PATCH = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = updatePrintConfigRequestSchema.parse(body);

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { printConfigId: true },
      });

      if (!event) {
        return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
      }

      let printConfigId = event.printConfigId;

      // If no print config exists, create one with defaults
      if (!printConfigId) {
        const newConfig = await prisma.printConfig.create({
          data: {
            paperWidth: data.paperWidth ?? 62,
            paperHeight: data.paperHeight ?? 100,
            orientation: data.orientation ?? 'PORTRAIT',
            marginTop: data.marginTop ?? 5,
            marginRight: data.marginRight ?? 5,
            marginBottom: data.marginBottom ?? 5,
            marginLeft: data.marginLeft ?? 5,
            showFiventsLogo: data.showFiventsLogo ?? true,
            fiventsLogoPosition: data.fiventsLogoPosition ?? 'top',
            fiventsLogoSize: data.fiventsLogoSize ?? 20,
            showOrgLogo: data.showOrgLogo ?? true,
            orgLogoPosition: data.orgLogoPosition ?? 'top',
            orgLogoSize: data.orgLogoSize ?? 25,
            showQrCode: data.showQrCode ?? true,
            qrCodePosition: data.qrCodePosition ?? 'center',
            qrCodeSize: data.qrCodeSize ?? 30,
            qrCodeContent: data.qrCodeContent ?? 'participant_id',
            showName: data.showName ?? true,
            namePosition: data.namePosition ?? 'center',
            nameFontSize: data.nameFontSize ?? 16,
            nameBold: data.nameBold ?? true,
            showCompany: data.showCompany ?? true,
            companyPosition: data.companyPosition ?? 'center',
            companyFontSize: data.companyFontSize ?? 12,
            showJobTitle: data.showJobTitle ?? true,
            jobTitlePosition: data.jobTitlePosition ?? 'center',
            jobTitleFontSize: data.jobTitleFontSize ?? 10,
            itemsOrder: JSON.stringify(
              data.itemsOrder ?? ['fiventsLogo', 'orgLogo', 'name', 'company', 'jobTitle', 'qrCode'],
            ),
            printerDpi: data.printerDpi ?? 203,
            printerType: data.printerType ?? 'thermal',
            printSpeed: data.printSpeed ?? 3,
            copies: data.copies ?? 1,
            backgroundColor: data.backgroundColor ?? '#ffffff',
            textColor: data.textColor ?? '#000000',
            fontFamily: data.fontFamily ?? 'Arial',
          },
        });

        printConfigId = newConfig.id;

        // Link to event
        await prisma.event.update({
          where: { id: eventId },
          data: { printConfigId },
        });
      }

      // Update existing print config
      const updateData: Prisma.PrintConfigUpdateInput = {};
      if (data.paperWidth !== undefined) updateData.paperWidth = data.paperWidth;
      if (data.paperHeight !== undefined) updateData.paperHeight = data.paperHeight;
      if (data.orientation !== undefined) updateData.orientation = data.orientation;
      if (data.marginTop !== undefined) updateData.marginTop = data.marginTop;
      if (data.marginRight !== undefined) updateData.marginRight = data.marginRight;
      if (data.marginBottom !== undefined) updateData.marginBottom = data.marginBottom;
      if (data.marginLeft !== undefined) updateData.marginLeft = data.marginLeft;
      if (data.showFiventsLogo !== undefined) updateData.showFiventsLogo = data.showFiventsLogo;
      if (data.fiventsLogoPosition !== undefined) updateData.fiventsLogoPosition = data.fiventsLogoPosition;
      if (data.fiventsLogoSize !== undefined) updateData.fiventsLogoSize = data.fiventsLogoSize;
      if (data.showOrgLogo !== undefined) updateData.showOrgLogo = data.showOrgLogo;
      if (data.orgLogoPosition !== undefined) updateData.orgLogoPosition = data.orgLogoPosition;
      if (data.orgLogoSize !== undefined) updateData.orgLogoSize = data.orgLogoSize;
      if (data.showQrCode !== undefined) updateData.showQrCode = data.showQrCode;
      if (data.qrCodePosition !== undefined) updateData.qrCodePosition = data.qrCodePosition;
      if (data.qrCodeSize !== undefined) updateData.qrCodeSize = data.qrCodeSize;
      if (data.qrCodeContent !== undefined) updateData.qrCodeContent = data.qrCodeContent;
      if (data.showName !== undefined) updateData.showName = data.showName;
      if (data.namePosition !== undefined) updateData.namePosition = data.namePosition;
      if (data.nameFontSize !== undefined) updateData.nameFontSize = data.nameFontSize;
      if (data.nameBold !== undefined) updateData.nameBold = data.nameBold;
      if (data.showCompany !== undefined) updateData.showCompany = data.showCompany;
      if (data.companyPosition !== undefined) updateData.companyPosition = data.companyPosition;
      if (data.companyFontSize !== undefined) updateData.companyFontSize = data.companyFontSize;
      if (data.showJobTitle !== undefined) updateData.showJobTitle = data.showJobTitle;
      if (data.jobTitlePosition !== undefined) updateData.jobTitlePosition = data.jobTitlePosition;
      if (data.jobTitleFontSize !== undefined) updateData.jobTitleFontSize = data.jobTitleFontSize;
      if (data.itemsOrder !== undefined) updateData.itemsOrder = JSON.stringify(data.itemsOrder);
      if (data.printerDpi !== undefined) updateData.printerDpi = data.printerDpi;
      if (data.printerType !== undefined) updateData.printerType = data.printerType;
      if (data.printSpeed !== undefined) updateData.printSpeed = data.printSpeed;
      if (data.copies !== undefined) updateData.copies = data.copies;
      if (data.backgroundColor !== undefined) updateData.backgroundColor = data.backgroundColor;
      if (data.textColor !== undefined) updateData.textColor = data.textColor;
      if (data.fontFamily !== undefined) updateData.fontFamily = data.fontFamily;

      const config = await prisma.printConfig.update({
        where: { id: printConfigId },
        data: updateData,
      });

      return NextResponse.json(mapPrintConfigToResponse(config), { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);

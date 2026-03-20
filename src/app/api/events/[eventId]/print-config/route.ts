import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { updatePrintConfigRequestSchema, type PrintConfigResponse } from '@/core/communication/requests/print-config';

import { getAuthorizedEvent } from '../../_lib/access';

function mapPrintConfigToResponse(config: any): PrintConfigResponse {
  return {
    id: config.id,
    paperWidth: config.paper_width,
    paperHeight: config.paper_height,
    orientation: config.orientation,
    marginTop: config.margin_top,
    marginRight: config.margin_right,
    marginBottom: config.margin_bottom,
    marginLeft: config.margin_left,
    showFiventsLogo: config.show_fivents_logo,
    fiventsLogoPosition: config.fivents_logo_position,
    fiventsLogoSize: config.fivents_logo_size,
    showOrgLogo: config.show_org_logo,
    orgLogoPosition: config.org_logo_position,
    orgLogoSize: config.org_logo_size,
    showQrCode: config.show_qr_code,
    qrCodePosition: config.qr_code_position,
    qrCodeSize: config.qr_code_size,
    qrCodeContent: config.qr_code_content,
    showName: config.show_name,
    namePosition: config.name_position,
    nameFontSize: config.name_font_size,
    nameBold: config.name_bold,
    showCompany: config.show_company,
    companyPosition: config.company_position,
    companyFontSize: config.company_font_size,
    showJobTitle: config.show_job_title,
    jobTitlePosition: config.job_title_position,
    jobTitleFontSize: config.job_title_font_size,
    itemsOrder: JSON.parse(config.items_order || '[]'),
    printerDpi: config.printer_dpi,
    printerType: config.printer_type,
    printSpeed: config.print_speed,
    copies: config.copies,
    backgroundColor: config.background_color,
    textColor: config.text_color,
    fontFamily: config.font_family,
    createdAt: config.created_at.toISOString(),
    updatedAt: config.updated_at.toISOString(),
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
      const updateData: any = {};
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

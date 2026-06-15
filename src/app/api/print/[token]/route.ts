import { NextRequest, NextResponse } from 'next/server';

import * as jose from 'jose';

import { LabelGeneratorService } from '@/core/application/services/label-generator.service';
import { env } from '@/core/infrastructure/environment/env';
import { prisma } from '@/core/infrastructure/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const secret = new TextEncoder().encode(env.JWT_SECRET);
  let payload: { jobId: string; eventParticipantId: string } | null = null;

  try {
    const { payload: verified } = await jose.jwtVerify(token, secret, {
      issuer: 'oneid',
      audience: 'print-label',
    });
    payload = verified as unknown as { jobId: string; eventParticipantId: string };
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
  }

  if (!payload) {
    return NextResponse.json({ error: 'Invalid token payload.' }, { status: 401 });
  }

  const eventParticipant = await prisma.eventParticipant.findUnique({
    where: { id: payload.eventParticipantId },
    select: {
      id: true,
      company: true,
      jobTitle: true,
      accessCode: true,
      qrCodeValue: true,
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

  if (!eventParticipant || !eventParticipant.event.printConfigId) {
    return NextResponse.json({ error: 'Participant or print config not found.' }, { status: 404 });
  }

  const config = await prisma.printConfig.findUnique({
    where: { id: eventParticipant.event.printConfigId },
  });

  if (!config) {
    return NextResponse.json({ error: 'Print config not found.' }, { status: 404 });
  }

  const qrContent = resolveQrContent(config.qrCodeContent, eventParticipant);
  const accessCodeDisplay = eventParticipant.accessCode || eventParticipant.qrCodeValue || '—';

  const generator = new LabelGeneratorService();
  const html = await generator.generateBadgeHtml(
    {
      eventName: eventParticipant.event.name,
      participantName: eventParticipant.person.name,
      company: eventParticipant.company,
      jobTitle: eventParticipant.jobTitle,
      qrContent,
      accessCodeDisplay,
      showQrCode: config.showQrCode,
      showAccessCode: config.showAccessCode,
    },
    {
      paperWidth: config.paperWidth,
      paperHeight: config.paperHeight,
      orientation: config.orientation as 'PORTRAIT' | 'LANDSCAPE',
      printerDpi: config.printerDpi,
      fontSizeName: config.fontSizeName,
      fontSizeMeta: config.fontSizeMeta,
    },
  );

  const printHtml = html.replace('</body>', '<script>window.onload=function(){window.print();};</script></body>');

  return new NextResponse(printHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function resolveQrContent(
  qrCodeContent: string,
  participant: { id: string; accessCode: string | null; qrCodeValue: string | null },
): string {
  switch (qrCodeContent) {
    case 'participant_id':
      return participant.id;
    case 'access_code':
      return participant.accessCode || participant.qrCodeValue || 'unknown';
    case 'qr_code_value':
    default:
      return participant.qrCodeValue || participant.accessCode || 'unknown';
  }
}

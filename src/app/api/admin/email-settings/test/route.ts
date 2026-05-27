import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withSuperAdmin } from '@/core/infrastructure/http/middlewares';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { containerService } from '@/core/application/services';
import type { RouteContext } from '@/core/infrastructure/http/types';

// ── POST /api/email-settings/test ─────────────────
// Sends a test email to the currently authenticated user's email address.

export const POST = withAuth(
  withSuperAdmin(async (req: NextRequest, _context: RouteContext) => {
    const auth = getUserAuth(req);

    // Resolve user email
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, name: true },
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User email not found.' }, { status: 400 });
    }

    const emailService = containerService.getEmailService();

    const result = await emailService.sendAccessCode({
      participantId: 'test',
      recipientEmail: user.email,
      participantName: user.name,
      accessCode: 'TEST-1234',
      event: {
        id: 'test',
        name: 'Evento de Teste',
        startsAt: new Date(),
        timezone: 'America/Sao_Paulo',
        address: 'Endereço de Teste, São Paulo - SP',
      },
      organization: {
        id: 'global',
        name: 'Fivents',
      },
    });

    if (result.skipped) {
      return NextResponse.json(
        {
          error: 'Email não enviado: nenhuma chave Resend configurada. Configure RESEND_API_KEY ou adicione uma chave na página de configurações.',
        },
        { status: 400 },
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Falha ao enviar o email de teste.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId, sentTo: user.email });
  }),
);

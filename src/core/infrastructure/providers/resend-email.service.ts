// ── Resend Email Service ─────────────────────────────────────────────
// Implements IEmailService using the Resend SDK.
// - Resolves API key: org-level DB override → global RESEND_API_KEY env var.
// - Persists every send attempt to the EmailLog table (PENDING → SENT / FAILED / SKIPPED).
// - Never throws. Returns a typed result object so callers can handle failures gracefully.

import { render } from 'react-email';
import { Resend } from 'resend';

import type { IEmailService, SendAccessCodePayload, SendEmailResult } from '@/core/domain/contracts';
import { env } from '@/core/infrastructure/environment/env';
import type { PrismaClient } from '@/generated/prisma/client';

import { AccessCodeEmail } from '../../../emails/access-code';
import { Logger } from '../../utils/logger';

const log = Logger.scoped('ResendEmailService');

export class ResendEmailService implements IEmailService {
  constructor(private readonly db: PrismaClient) {}

  // ── Public API ────────────────────────────────────────────────────

  async sendAccessCode(payload: SendAccessCodePayload): Promise<SendEmailResult> {
    const { participantId, recipientEmail, participantName, accessCode, event, organization } = payload;

    // 1. Resolve sender config (org override → global env)
    const settings = await this.resolveSettings();

    if (!settings.apiKey) {
      log.warn('Email sending skipped — no Resend API key configured', { organizationId: organization.id });
      await this.logEmail({
        organizationId: organization.id,
        eventId: event.id,
        participantId,
        recipient: recipientEmail,
        template: 'access-code',
        status: 'SKIPPED',
        error: 'No Resend API key configured (RESEND_API_KEY env var or org-level override).',
      });
      return { success: false, skipped: true };
    }

    // 2. Render HTML
    let html: string;
    try {
      html = await render(
        AccessCodeEmail({
          participantName,
          accessCode,
          eventName: event.name,
          eventDate: event.startsAt,
          eventTimezone: event.timezone,
          eventAddress: event.address,
          organizationName: organization.name,
          organizationLogoUrl: organization.logoUrl,
          fromName: settings.fromName,
        }),
      );
    } catch (renderError) {
      const error = renderError instanceof Error ? renderError.message : String(renderError);
      log.error('Failed to render email template', { error, participantId });
      await this.logEmail({
        organizationId: organization.id,
        eventId: event.id,
        participantId,
        recipient: recipientEmail,
        template: 'access-code',
        status: 'FAILED',
        error: `Template render error: ${error}`,
      });
      return { success: false, error };
    }

    // 3. Send via Resend
    const resend = new Resend(settings.apiKey);
    const fromAddress = `${settings.fromName} <${settings.fromEmail}>`;

    log.info('Sending access code email', { recipient: recipientEmail, eventId: event.id, participantId });

    try {
      const { data, error: resendError } = await resend.emails.send({
        from: fromAddress,
        to: [recipientEmail],
        replyTo: settings.replyTo ?? undefined,
        subject: `Seu código de acesso — ${event.name}`,
        html,
      });

      if (resendError || !data) {
        const errorMsg = resendError?.message ?? 'Unknown Resend error';
        log.error('Resend API returned error', { error: errorMsg, participantId, recipient: recipientEmail });
        await this.logEmail({
          organizationId: organization.id,
          eventId: event.id,
          participantId,
          recipient: recipientEmail,
          template: 'access-code',
          status: 'FAILED',
          error: errorMsg,
        });
        return { success: false, error: errorMsg };
      }

      log.info('Email sent successfully', { messageId: data.id, recipient: recipientEmail });
      await this.logEmail({
        organizationId: organization.id,
        eventId: event.id,
        participantId,
        recipient: recipientEmail,
        template: 'access-code',
        status: 'SENT',
        providerMsgId: data.id,
        sentAt: new Date(),
      });

      return { success: true, messageId: data.id };
    } catch (sendError) {
      const error = sendError instanceof Error ? sendError.message : String(sendError);
      log.error('Unexpected error during email send', { error, participantId });
      await this.logEmail({
        organizationId: organization.id,
        eventId: event.id,
        participantId,
        recipient: recipientEmail,
        template: 'access-code',
        status: 'FAILED',
        error,
      });
      return { success: false, error };
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  private async resolveSettings(): Promise<{
    apiKey: string | null;
    fromName: string;
    fromEmail: string;
    replyTo: string | null;
  }> {
    const orgSettings = await this.db.emailSettings.findFirst({
      select: { apiKey: true, fromName: true, fromEmail: true, replyTo: true },
    });

    const apiKey = orgSettings?.apiKey ?? env.RESEND_API_KEY ?? null;
    const fromName = orgSettings?.fromName ?? env.RESEND_FROM_NAME ?? 'OneID';
    const fromEmail = orgSettings?.fromEmail ?? env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
    const replyTo = orgSettings?.replyTo ?? null;

    return { apiKey, fromName, fromEmail, replyTo };
  }

  private async logEmail(data: {
    organizationId: string;
    eventId?: string;
    participantId?: string;
    recipient: string;
    template: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
    providerMsgId?: string;
    error?: string;
    sentAt?: Date;
  }): Promise<void> {
    try {
      await this.db.emailLog.create({
        data: {
          organizationId: data.organizationId,
          eventId: data.eventId,
          participantId: data.participantId,
          recipient: data.recipient,
          template: data.template,
          status: data.status,
          providerMsgId: data.providerMsgId,
          error: data.error,
          sentAt: data.sentAt,
        },
      });
    } catch (err) {
      // Logging failure should never surface to callers.
      log.error('Failed to persist EmailLog entry', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

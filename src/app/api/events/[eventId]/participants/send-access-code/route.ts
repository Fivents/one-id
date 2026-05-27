import { NextRequest, NextResponse } from 'next/server';

import { containerService } from '@/core/application/services';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { prisma } from '@/core/infrastructure/prisma-client';
import type { RouteContext } from '@/core/infrastructure/http/types';
import type { SendAccessCodePayload } from '@/core/domain/contracts';
import { Logger } from '@/core/utils/logger';

import { getAuthorizedEvent } from '../../../_lib/access';

const log = Logger.scoped('SendAccessCodeRoute');

// ── POST /api/events/[eventId]/participants/send-access-code ─────────
//
// Sends access code emails to one or more participants.
// Body: { participantIds: string[] }
//   - Pass a single ID for individual send.
//   - Pass an empty array to send to ALL participants in the event.
//
// Returns: { sent, failed, skipped, results: [{ participantId, status, error? }] }

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) return eventOrResponse;
    const event = eventOrResponse;

    const body = await req.json();
    const participantIds: string[] | undefined = body?.participantIds;

    // Resolve which participants to send to
    let targetParticipants: {
      id: string;
      accessCode: string | null;
      person: { name: string; email: string };
    }[];

    if (participantIds && participantIds.length > 0) {
      // Single or selected participants
      targetParticipants = await prisma.eventParticipant.findMany({
        where: {
          id: { in: participantIds },
          eventId,
          deletedAt: null,
        },
        select: {
          id: true,
          accessCode: true,
          person: { select: { name: true, email: true } },
        },
      });

      // Validate all requested IDs belong to this event
      const foundIds = new Set(targetParticipants.map((p) => p.id));
      const invalid = participantIds.filter((id) => !foundIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Participant(s) not found in this event: ${invalid.join(', ')}` },
          { status: 404 },
        );
      }
    } else {
      // Bulk: all participants in the event
      targetParticipants = await prisma.eventParticipant.findMany({
        where: { eventId, deletedAt: null },
        select: {
          id: true,
          accessCode: true,
          person: { select: { name: true, email: true } },
        },
      });
    }

    if (targetParticipants.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, skipped: 0, results: [] });
    }

    // Fetch event + org info once
    const eventDetails = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        startsAt: true,
        timezone: true,
        address: true,
        organization: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    if (!eventDetails) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const emailService = containerService.getEmailService();

    log.info('Starting bulk send-access-code', {
      eventId,
      count: targetParticipants.length,
      organizationId: eventDetails.organization.id,
    });

    // Send all in parallel (fire-and-collect — all settled)
    const sendResults = await Promise.allSettled(
      targetParticipants.map(async (participant) => {
        if (!participant.accessCode) {
          return {
            participantId: participant.id,
            status: 'skipped' as const,
            reason: 'No access code assigned',
          };
        }

        const payload: SendAccessCodePayload = {
          participantId: participant.id,
          recipientEmail: participant.person.email,
          participantName: participant.person.name,
          accessCode: participant.accessCode,
          event: {
            id: eventDetails.id,
            name: eventDetails.name,
            startsAt: eventDetails.startsAt,
            timezone: eventDetails.timezone,
            address: eventDetails.address,
          },
          organization: eventDetails.organization,
        };

        const result = await emailService.sendAccessCode(payload);

        return {
          participantId: participant.id,
          status: result.skipped ? ('skipped' as const) : result.success ? ('sent' as const) : ('failed' as const),
          messageId: result.messageId,
          error: result.error,
        };
      }),
    );

    // Tally results
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    const results = sendResults.map((r) => {
      if (r.status === 'fulfilled') {
        const v = r.value;
        if (v.status === 'sent') sent++;
        else if (v.status === 'failed') failed++;
        else skipped++;
        return v;
      } else {
        // Promise itself rejected (shouldn't happen — service never throws)
        failed++;
        return { participantId: 'unknown', status: 'failed' as const, error: String(r.reason) };
      }
    });

    log.info('Bulk send-access-code complete', { eventId, sent, failed, skipped });

    return NextResponse.json({ sent, failed, skipped, results });
  }),
);

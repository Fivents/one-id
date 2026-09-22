/**
 * Ingests Sympla tickets into EventParticipant slots.
 *
 * Takes PrismaClient directly rather than going through repository contracts: the work is
 * transactional multi-table upserting, which the thin repository interfaces do not express.
 * This mirrors TotemCheckInService, the existing precedent for orchestration that needs the
 * database directly.
 */

import type { SymplaSyncError } from '@/core/domain/entities';
import type { SymplaParticipant } from '@/core/infrastructure/http/sympla/sympla.schemas';
import { formatSymplaDateTime, parseSymplaDateTime } from '@/core/infrastructure/http/sympla/sympla-date';
import {
  type ListParticipantsParams,
  type SymplaHttpClient,
} from '@/core/infrastructure/http/sympla/sympla-http.client';
import { generateCheckInCredential, resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';
import { type CodeSourceField, resolveDerivedCodeUnique } from '@/core/utils/derived-code';
import { Logger } from '@/core/utils/logger';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';

import {
  buildFullName,
  extractDocumentFromCustomForm,
  normalizeCustomForm,
} from './sympla-custom-form';
import { makePersonLookup, resolveTicketIdentity } from './sympla-identity-policy';

/** Bounds a single run so one enormous event cannot monopolise the queue forever. */
const MAX_TICKETS_PER_RUN = 20_000;

/**
 * Sympla filters participants by ticket_updated_at, and its clock is not ours. Rewinding the
 * watermark a little makes the incremental pass re-see anything written around the boundary;
 * the upsert makes re-seeing free.
 */
const WATERMARK_OVERLAP_MS = 5 * 60 * 1000;

export interface SyncParticipantsInput {
  eventId: string;
  organizationId: string;
  symplaEventIdHash: string;
  client: SymplaHttpClient;
  /** Incremental watermark; null runs a full sync. */
  from?: Date | null;
  signal?: AbortSignal;
}

export interface SyncParticipantsResult {
  participantsSynced: number;
  created: number;
  updated: number;
  errors: SymplaSyncError[];
  /** Newest ticket_updated_at seen, to persist as the next watermark. */
  latestTicketUpdatedAt: Date | null;
}

interface EventSyncContext {
  eventId: string;
  organizationId: string;
  accessCodeSource: CodeSourceField;
  qrCodeSource: CodeSourceField;
  credentialLength: number;
}

export class SymplaParticipantSyncService {
  constructor(private readonly db: PrismaClient) {}

  async execute(input: SyncParticipantsInput): Promise<SyncParticipantsResult> {
    const context = await this.loadContext(input.eventId, input.organizationId);

    const result: SyncParticipantsResult = {
      participantsSynced: 0,
      created: 0,
      updated: 0,
      errors: [],
      latestTicketUpdatedAt: null,
    };

    const params: ListParticipantsParams = {
      // `include` returns active and cancelled tickets in one pass. Cancellations must land as
      // a ticket_status change, never as a row silently disappearing from the gate list.
      cancelledFilter: 'include',
      ...(input.from ? { from: formatSymplaDateTime(new Date(input.from.getTime() - WATERMARK_OVERLAP_MS)) } : {}),
    };

    const presentationIds = await this.loadPresentationIds(input.eventId);
    const orderIds = await this.loadOrderIds(input.eventId);
    const knownTicketTypes = new Set<string>();

    for await (const participant of input.client.iterateParticipants(
      input.symplaEventIdHash,
      params,
      input.signal,
    )) {
      if (result.participantsSynced >= MAX_TICKETS_PER_RUN) {
        result.errors.push({
          type: 'RUN_LIMIT_REACHED',
          message: `Limite de ${MAX_TICKETS_PER_RUN} ingressos por execução atingido; o restante entra na próxima sincronização.`,
        });
        break;
      }

      try {
        const outcome = await this.upsertTicket(participant, context, {
          presentationIds,
          orderIds,
          knownTicketTypes,
        });

        result.participantsSynced += 1;
        if (outcome === 'CREATED') result.created += 1;
        else result.updated += 1;

        const updatedAt = parseSymplaDateTime(participant.ticket_updated_at);
        if (updatedAt && (!result.latestTicketUpdatedAt || updatedAt > result.latestTicketUpdatedAt)) {
          result.latestTicketUpdatedAt = updatedAt;
        }
      } catch (error) {
        // One malformed or colliding ticket must never abort the other 4 999.
        const message = error instanceof Error ? error.message : String(error);

        result.errors.push({
          type: 'TICKET_UPSERT_FAILED',
          message,
          ref: participant.ticket_number,
        });

        Logger.error('Sympla ticket upsert failed', {
          eventId: input.eventId,
          ticketNumber: participant.ticket_number,
          error: message,
        });
      }
    }

    return result;
  }

  private async loadContext(eventId: string, organizationId: string): Promise<EventSyncContext> {
    const [event, peopleSettings, credentialLength] = await Promise.all([
      this.db.event.findUniqueOrThrow({
        where: { id: eventId },
        select: { accessCodeSource: true, qrCodeSource: true },
      }),
      this.db.organizationPeopleSettings.findUnique({
        where: { organizationId },
        select: { accessCodeSource: true, qrCodeSource: true },
      }),
      resolveTotemAccessCodeLength(this.db, organizationId),
    ]);

    // Same precedence the manual participant route uses: event override, else org default.
    return {
      eventId,
      organizationId,
      accessCodeSource: (event.accessCodeSource ?? peopleSettings?.accessCodeSource ?? 'NONE') as CodeSourceField,
      qrCodeSource: (event.qrCodeSource ?? peopleSettings?.qrCodeSource ?? 'NONE') as CodeSourceField,
      credentialLength,
    };
  }

  private async loadPresentationIds(eventId: string): Promise<Map<number, string>> {
    const rows = await this.db.presentation.findMany({
      where: { eventId },
      select: { id: true, symplaPresentationId: true },
    });

    return new Map(rows.map((row) => [row.symplaPresentationId, row.id]));
  }

  private async loadOrderIds(eventId: string): Promise<Map<string, string>> {
    const rows = await this.db.symplaOrder.findMany({
      where: { eventId },
      select: { id: true, symplaOrderSk: true },
    });

    return new Map(rows.map((row) => [row.symplaOrderSk, row.id]));
  }

  private async upsertTicket(
    participant: SymplaParticipant,
    context: EventSyncContext,
    caches: {
      presentationIds: Map<number, string>;
      orderIds: Map<string, string>;
      knownTicketTypes: Set<string>;
    },
  ): Promise<'CREATED' | 'UPDATED'> {
    const customFields = normalizeCustomForm(participant.custom_form);
    const fullName = buildFullName(participant.first_name, participant.last_name);
    const email = participant.email?.trim() || null;
    const document = extractDocumentFromCustomForm(customFields);

    const presentationId = participant.presentation_id
      ? (caches.presentationIds.get(participant.presentation_id) ?? null)
      : null;
    const orderId = participant.order_id ? (caches.orderIds.get(participant.order_id) ?? null) : null;

    return this.db.$transaction(async (tx) => {
      const existing = await tx.eventParticipant.findUnique({
        where: { eventId_ticketNumber: { eventId: context.eventId, ticketNumber: participant.ticket_number } },
        select: { id: true, personId: true },
      });

      const personId = existing?.personId ?? (await this.resolvePersonId(tx, context, { fullName, email, document }));

      const ticketData = {
        symplaParticipantId: participant.id,
        ticketStatus: participant.ticket_status ?? null,
        ticketName: participant.ticket_name ?? null,
        ticketPrice: participant.ticket_sale_price ?? null,
        ticketNetValue: participant.ticket_net_value ?? null,
        sectorName: participant.sector_name ?? null,
        seatLabel: participant.marked_place_name ?? null,
        symplaCheckedIn: participant.checkin?.check_in ?? null,
        symplaCheckInDate: parseSymplaDateTime(participant.checkin?.check_in_date),
        symplaCheckInId: participant.checkin?.check_in_id ?? null,
        customFields: customFields as unknown as Prisma.InputJsonValue,
        attendeeFullName: fullName,
        attendeeEmail: email,
        attendeeDocument: document,
        presentationId,
        orderId,
        personId,
      };

      if (existing) {
        // Credentials are deliberately absent from the update: they are generated once, at
        // creation. Re-deriving them on every sync would rotate the access code of a ticket
        // whose badge is already printed and whose QR is already in the attendee's wallet.
        await tx.eventParticipant.update({ where: { id: existing.id }, data: ticketData });

        await this.upsertTicketType(tx, context.eventId, participant, caches.knownTicketTypes);

        return 'UPDATED';
      }

      const credentials = await this.resolveCredentials(tx, context, participant, { email, document });

      await tx.eventParticipant.create({
        data: {
          ...ticketData,
          eventId: context.eventId,
          ticketNumber: participant.ticket_number,
          qrCodeValue: credentials.qrCodeValue,
          qrCodeProvenance: credentials.qrCodeProvenance,
          accessCode: credentials.accessCode,
          accessCodeProvenance: credentials.accessCodeProvenance,
        },
      });

      await this.upsertTicketType(tx, context.eventId, participant, caches.knownTicketTypes);

      return 'CREATED';
    });
  }

  private async resolvePersonId(
    tx: Prisma.TransactionClient,
    context: EventSyncContext,
    candidate: { fullName: string | null; email: string | null; document: string | null },
  ): Promise<string | null> {
    // A ticket with no name at all is not an identity — keep it as a bare slot rather than
    // creating an unnamed Person that would pollute the organization's contact base.
    if (!candidate.fullName) return null;

    const resolution = await resolveTicketIdentity(
      { fullName: candidate.fullName, email: candidate.email },
      makePersonLookup(tx, context.organizationId),
    );

    if (resolution.kind === 'LINK_EXISTING') {
      return resolution.personId;
    }

    const person = await tx.person.create({
      data: {
        name: candidate.fullName,
        email: resolution.email,
        document: candidate.document,
        organizationId: context.organizationId,
        // Person-level codes stay null: the credential that matters lives on the ticket slot,
        // and minting an organization-unique code per bulk attendee would collide for nothing.
        accessCodeProvenance: 'RANDOM',
        qrCodeProvenance: 'RANDOM',
      },
      select: { id: true },
    });

    return person.id;
  }

  private async resolveCredentials(
    tx: Prisma.TransactionClient,
    context: EventSyncContext,
    participant: SymplaParticipant,
    identity: { email: string | null; document: string | null },
  ): Promise<{
    qrCodeValue: string;
    qrCodeProvenance: 'MANUAL' | 'RANDOM' | 'DERIVED';
    accessCode: string;
    accessCodeProvenance: 'MANUAL' | 'RANDOM' | 'DERIVED';
  }> {
    const isTaken = (field: 'accessCode' | 'qrCodeValue') => async (value: string) => {
      const found = await tx.eventParticipant.findFirst({
        where: { eventId: context.eventId, deletedAt: null, [field]: value },
        select: { id: true },
      });

      return found !== null;
    };

    // The Sympla QR must survive verbatim so the organizer's own scanners keep working, which
    // means the org/event code policy must NOT be consulted here: resolveDerivedCode gives the
    // policy priority over an explicit value, so an org on qrCodeSource=DOCUMENT would quietly
    // overwrite the ticket's QR. Passing sourceField NONE is what keeps the explicit value.
    const symplaQr = participant.ticket_num_qr_code?.trim() || null;
    const qrCodeValue = symplaQr ?? generateCheckInCredential(context.credentialLength);
    const qrCodeProvenance = symplaQr ? ('MANUAL' as const) : ('RANDOM' as const);

    const accessCodeResolved = await resolveDerivedCodeUnique(
      {
        sourceField: context.accessCodeSource,
        document: identity.document,
        email: identity.email,
        credentialLength: context.credentialLength,
      },
      isTaken('accessCode'),
    );

    // A repeated CPF across a bulk order derives the same code twice; resolveDerivedCodeUnique
    // already falls back to RANDOM on collision, so the batch cannot break on it.
    const qrTaken = await isTaken('qrCodeValue')(qrCodeValue);

    return {
      qrCodeValue: qrTaken ? generateCheckInCredential(context.credentialLength) : qrCodeValue,
      qrCodeProvenance: qrTaken ? 'RANDOM' : qrCodeProvenance,
      accessCode: accessCodeResolved.value,
      accessCodeProvenance: accessCodeResolved.provenance,
    };
  }

  private async upsertTicketType(
    tx: Prisma.TransactionClient,
    eventId: string,
    participant: SymplaParticipant,
    known: Set<string>,
  ): Promise<void> {
    const name = participant.ticket_name?.trim();
    if (!name || known.has(name)) return;

    await tx.ticketType.upsert({
      where: { eventId_name: { eventId, name } },
      create: {
        eventId,
        name,
        groupId: participant.ticket_group_id ?? null,
        groupName: participant.ticket_group_name ?? null,
        subgroupId: participant.ticket_subgroup_id ?? null,
        subgroupName: participant.ticket_subgroup_name ?? null,
        salePrice: participant.ticket_sale_price ?? 0,
        netValue: participant.ticket_net_value ?? null,
      },
      update: {
        groupId: participant.ticket_group_id ?? null,
        groupName: participant.ticket_group_name ?? null,
        subgroupId: participant.ticket_subgroup_id ?? null,
        subgroupName: participant.ticket_subgroup_name ?? null,
        salePrice: participant.ticket_sale_price ?? 0,
        netValue: participant.ticket_net_value ?? null,
      },
    });

    known.add(name);
  }
}

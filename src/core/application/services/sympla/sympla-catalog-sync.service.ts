/**
 * Mirrors the Sympla side of an event into ONE-ID: the event's own metadata, its presentations
 * and sectors, and its orders.
 *
 * Runs before the participant sync, because tickets reference presentations and orders by id
 * and those rows have to exist first.
 */

import type { SymplaSyncError } from '@/core/domain/entities';
import type { SymplaAddress, SymplaEvent } from '@/core/infrastructure/http/sympla/sympla.schemas';
import { parseSymplaDateTime } from '@/core/infrastructure/http/sympla/sympla-date';
import type { SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';
import { Logger } from '@/core/utils/logger';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';

export interface SyncCatalogInput {
  eventId: string;
  symplaEventIdHash: string;
  client: SymplaHttpClient;
  signal?: AbortSignal;
}

export interface SyncCatalogResult {
  eventsSynced: number;
  presentationsSynced: number;
  ordersSynced: number;
  errors: SymplaSyncError[];
}

function formatAddress(address: SymplaAddress | null | undefined): string | null {
  if (!address) return null;

  const street = [address.address, address.address_num].filter(Boolean).join(', ');
  const parts = [street, address.neighborhood, address.city, address.state].filter(Boolean);

  return parts.length ? parts.join(' - ') : (address.name ?? null);
}

export class SymplaCatalogSyncService {
  constructor(private readonly db: PrismaClient) {}

  async execute(input: SyncCatalogInput): Promise<SyncCatalogResult> {
    const result: SyncCatalogResult = {
      eventsSynced: 0,
      presentationsSynced: 0,
      ordersSynced: 0,
      errors: [],
    };

    await this.syncEvent(input, result);
    await this.syncPresentations(input, result);
    await this.syncOrders(input, result);

    return result;
  }

  private async syncEvent(input: SyncCatalogInput, result: SyncCatalogResult): Promise<void> {
    try {
      const symplaEvent = await input.client.getEvent(input.symplaEventIdHash, input.signal);

      await this.db.$transaction(async (tx) => {
        await this.updateEventFromSympla(tx, input.eventId, symplaEvent);

        await tx.symplaEventLink.update({
          where: { eventId: input.eventId },
          data: {
            symplaUrl: symplaEvent.url ?? null,
            imageUrl: symplaEvent.image ?? null,
            referenceId: symplaEvent.reference_id ?? null,
            categoryPrimary: symplaEvent.category_prim?.name ?? null,
            categorySecondary: symplaEvent.category_sec?.name ?? null,
            hostName: symplaEvent.host?.name ?? null,
            publishedOnSympla: symplaEvent.published ?? false,
            cancelledOnSympla: symplaEvent.cancelled ?? false,
          },
        });
      });

      result.eventsSynced = 1;
    } catch (error) {
      this.record(result, 'EVENT_SYNC_FAILED', error, input.symplaEventIdHash);
    }
  }

  private async updateEventFromSympla(
    tx: Prisma.TransactionClient,
    eventId: string,
    symplaEvent: SymplaEvent,
  ): Promise<void> {
    const startsAt = parseSymplaDateTime(symplaEvent.start_date);
    const endsAt = parseSymplaDateTime(symplaEvent.end_date);

    await tx.event.update({
      where: { id: eventId },
      data: {
        name: symplaEvent.name,
        ...(symplaEvent.detail ? { description: symplaEvent.detail } : {}),
        ...(startsAt ? { startsAt } : {}),
        ...(endsAt ? { endsAt } : {}),
        ...(symplaEvent.address
          ? {
              address: formatAddress(symplaEvent.address),
              addressDetails: symplaEvent.address as unknown as Prisma.InputJsonValue,
            }
          : {}),
        // Status is deliberately NOT forced. A cancellation on Sympla is surfaced through
        // SymplaEventLink.cancelledOnSympla and the UI; driving the ONE-ID status machine from
        // here could jump an event straight into a final state and strand its totems.
      },
    });
  }

  private async syncPresentations(input: SyncCatalogInput, result: SyncCatalogResult): Promise<void> {
    try {
      for await (const presentation of input.client.iteratePresentations(
        input.symplaEventIdHash,
        {},
        input.signal,
      )) {
        const startsAt =
          parseSymplaDateTime(presentation.start_date_utc) ?? parseSymplaDateTime(presentation.start_date);

        if (!startsAt) {
          result.errors.push({
            type: 'PRESENTATION_WITHOUT_START',
            message: 'Sessão sem data de início utilizável.',
            ref: String(presentation.id),
          });
          continue;
        }

        const endsAt =
          parseSymplaDateTime(presentation.end_date_utc) ?? parseSymplaDateTime(presentation.end_date);

        const data = {
          startsAt,
          endsAt,
          isClosed: presentation.closed ?? false,
          isEnabled: presentation.enabled ?? true,
          isPublished: presentation.published ?? true,
          isPrivate: presentation.private_presentation ?? false,
          presentationUrl: presentation.presentation_url ?? null,
        };

        const stored = await this.db.presentation.upsert({
          where: {
            eventId_symplaPresentationId: {
              eventId: input.eventId,
              symplaPresentationId: presentation.id,
            },
          },
          create: { ...data, eventId: input.eventId, symplaPresentationId: presentation.id },
          update: data,
          select: { id: true },
        });

        await this.syncSectors(input.eventId, stored.id, presentation.sectors ?? []);

        result.presentationsSynced += 1;
      }
    } catch (error) {
      this.record(result, 'PRESENTATIONS_SYNC_FAILED', error, input.symplaEventIdHash);
    }
  }

  private async syncSectors(
    eventId: string,
    presentationId: string,
    sectors: Array<{ id?: number | null; name: string; has_online_sale_available?: boolean | null }>,
  ): Promise<void> {
    for (const sector of sectors) {
      const name = sector.name?.trim();
      if (!name) continue;

      await this.db.sector.upsert({
        where: { eventId_presentationId_name: { eventId, presentationId, name } },
        create: {
          eventId,
          presentationId,
          name,
          symplaSectorId: sector.id ?? null,
          hasOnlineSale: sector.has_online_sale_available ?? false,
        },
        update: {
          symplaSectorId: sector.id ?? null,
          hasOnlineSale: sector.has_online_sale_available ?? false,
        },
      });
    }
  }

  private async syncOrders(input: SyncCatalogInput, result: SyncCatalogResult): Promise<void> {
    try {
      for await (const order of input.client.iterateOrders(
        input.symplaEventIdHash,
        // Cancelled orders matter: their tickets stay on the gate list marked as cancelled.
        { cancelledFilter: 'include' },
        input.signal,
      )) {
        const data = {
          orderStatus: order.order_status ?? null,
          orderDate: parseSymplaDateTime(order.order_date),
          approvedDate: parseSymplaDateTime(order.approved_date),
          updatedDate: parseSymplaDateTime(order.updated_date),
          buyerFirstName: order.buyer_first_name ?? null,
          buyerLastName: order.buyer_last_name ?? null,
          buyerEmail: order.buyer_email ?? null,
          totalSalePrice: order.order_total_sale_price ?? 0,
          totalNetValue: order.order_total_net_value ?? 0,
          discountCode: order.discount_code ?? null,
          transactionType: order.transaction_type ?? null,
          presentationId: order.presentation_id ?? null,
          invoiceInfo: (order.invoice_info ?? null) as unknown as Prisma.InputJsonValue,
          utmTracking: (order.utm ?? null) as unknown as Prisma.InputJsonValue,
        };

        await this.db.symplaOrder.upsert({
          where: { eventId_symplaOrderSk: { eventId: input.eventId, symplaOrderSk: order.id } },
          create: { ...data, eventId: input.eventId, symplaOrderSk: order.id },
          update: data,
        });

        result.ordersSynced += 1;
      }
    } catch (error) {
      this.record(result, 'ORDERS_SYNC_FAILED', error, input.symplaEventIdHash);
    }
  }

  private record(result: SyncCatalogResult, type: string, error: unknown, ref?: string): void {
    const message = error instanceof Error ? error.message : String(error);

    result.errors.push({ type, message, ref });
    Logger.error('Sympla catalog sync step failed', { type, ref, error: message });
  }
}

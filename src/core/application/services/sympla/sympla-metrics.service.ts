/**
 * Sympla-aware attendance and revenue metrics for one event.
 *
 * Written as raw SQL because every figure here is an aggregate over the same table with slightly
 * different filters; expressing that as a series of Prisma groupBy calls would mean several round
 * trips and a reassembly step in TypeScript for no gain.
 *
 * Check-in presence is an EXISTS, never a join. Joining check_ins would fan out a participant
 * with two check-ins into two rows and quietly double its ticket price in the revenue sum.
 */

import type { PrismaClient } from '@/generated/prisma/client';

/** Sympla ticket_status values that mean the ticket no longer counts as valid. */
const CANCELLED_STATUSES = ['C', 'R', 'CANCELED', 'CANCELLED', 'REFUNDED'];

export interface SymplaBreakdownRow {
  label: string;
  tickets: number;
  valid: number;
  cancelled: number;
  checkedIn: number;
  /** Share of *valid* tickets that checked in, 0-1. Null when there are none to divide by. */
  checkInRate: number | null;
  revenue: number;
}

export interface SymplaUtmRow {
  source: string;
  campaign: string;
  orders: number;
  tickets: number;
  checkedIn: number;
  checkInRate: number | null;
  revenue: number;
}

export interface SymplaEventMetrics {
  totals: {
    tickets: number;
    valid: number;
    cancelled: number;
    checkedIn: number;
    checkInRate: number | null;
    grossRevenue: number;
    netRevenue: number;
    orders: number;
  };
  byTicketType: SymplaBreakdownRow[];
  bySector: SymplaBreakdownRow[];
  byUtmSource: SymplaUtmRow[];
}

interface BreakdownQueryRow {
  label: string;
  tickets: number;
  valid: number;
  checked_in: number;
  revenue: number;
}

interface UtmQueryRow {
  source: string;
  campaign: string;
  orders: number;
  tickets: number;
  checked_in: number;
  revenue: number;
}

function rate(checkedIn: number, valid: number): number | null {
  return valid > 0 ? checkedIn / valid : null;
}

function toBreakdown(rows: BreakdownQueryRow[]): SymplaBreakdownRow[] {
  return rows.map((row) => ({
    label: row.label,
    tickets: Number(row.tickets),
    valid: Number(row.valid),
    cancelled: Number(row.tickets) - Number(row.valid),
    checkedIn: Number(row.checked_in),
    checkInRate: rate(Number(row.checked_in), Number(row.valid)),
    revenue: Number(row.revenue),
  }));
}

export class SymplaMetricsService {
  constructor(private readonly db: PrismaClient) {}

  async forEvent(eventId: string): Promise<SymplaEventMetrics> {
    const [totals, byTicketType, bySector, byUtmSource] = await Promise.all([
      this.loadTotals(eventId),
      this.loadBreakdown(eventId, 'ticket_name'),
      this.loadBreakdown(eventId, 'sector_name'),
      this.loadUtm(eventId),
    ]);

    return { totals, byTicketType, bySector, byUtmSource };
  }

  private async loadTotals(eventId: string): Promise<SymplaEventMetrics['totals']> {
    const [row] = await this.db.$queryRaw<
      Array<{
        tickets: number;
        valid: number;
        checked_in: number;
        gross: number;
        net: number;
      }>
    >`
      SELECT
        count(*)::int AS tickets,
        count(*) FILTER (
          WHERE ep.ticket_status IS NULL OR upper(ep.ticket_status) <> ALL(${CANCELLED_STATUSES}::text[])
        )::int AS valid,
        count(*) FILTER (
          WHERE EXISTS (SELECT 1 FROM check_ins ci WHERE ci.event_participant_id = ep.id)
        )::int AS checked_in,
        COALESCE(sum(ep.ticket_price), 0)::float8 AS gross,
        COALESCE(sum(ep.ticket_net_value), 0)::float8 AS net
      FROM event_participants ep
      WHERE ep.event_id = ${eventId} AND ep.deleted_at IS NULL
    `;

    const [orderRow] = await this.db.$queryRaw<Array<{ orders: number }>>`
      SELECT count(*)::int AS orders FROM sympla_orders WHERE event_id = ${eventId}
    `;

    const valid = Number(row?.valid ?? 0);
    const checkedIn = Number(row?.checked_in ?? 0);

    return {
      tickets: Number(row?.tickets ?? 0),
      valid,
      cancelled: Number(row?.tickets ?? 0) - valid,
      checkedIn,
      checkInRate: rate(checkedIn, valid),
      grossRevenue: Number(row?.gross ?? 0),
      netRevenue: Number(row?.net ?? 0),
      orders: Number(orderRow?.orders ?? 0),
    };
  }

  /**
   * One query shape for both breakdowns. The column is chosen from a closed set rather than
   * interpolated from caller input — a raw query is the one place where a "it's only a column
   * name" shortcut becomes an injection.
   */
  private async loadBreakdown(
    eventId: string,
    column: 'ticket_name' | 'sector_name',
  ): Promise<SymplaBreakdownRow[]> {
    const rows =
      column === 'ticket_name'
        ? await this.db.$queryRaw<BreakdownQueryRow[]>`
            SELECT
              COALESCE(NULLIF(trim(ep.ticket_name), ''), '—') AS label,
              count(*)::int AS tickets,
              count(*) FILTER (
                WHERE ep.ticket_status IS NULL OR upper(ep.ticket_status) <> ALL(${CANCELLED_STATUSES}::text[])
              )::int AS valid,
              count(*) FILTER (
                WHERE EXISTS (SELECT 1 FROM check_ins ci WHERE ci.event_participant_id = ep.id)
              )::int AS checked_in,
              COALESCE(sum(ep.ticket_price), 0)::float8 AS revenue
            FROM event_participants ep
            WHERE ep.event_id = ${eventId} AND ep.deleted_at IS NULL
            GROUP BY 1
            ORDER BY tickets DESC, label ASC
            LIMIT 50
          `
        : await this.db.$queryRaw<BreakdownQueryRow[]>`
            SELECT
              COALESCE(NULLIF(trim(ep.sector_name), ''), '—') AS label,
              count(*)::int AS tickets,
              count(*) FILTER (
                WHERE ep.ticket_status IS NULL OR upper(ep.ticket_status) <> ALL(${CANCELLED_STATUSES}::text[])
              )::int AS valid,
              count(*) FILTER (
                WHERE EXISTS (SELECT 1 FROM check_ins ci WHERE ci.event_participant_id = ep.id)
              )::int AS checked_in,
              COALESCE(sum(ep.ticket_price), 0)::float8 AS revenue
            FROM event_participants ep
            WHERE ep.event_id = ${eventId} AND ep.deleted_at IS NULL
            GROUP BY 1
            ORDER BY tickets DESC, label ASC
            LIMIT 50
          `;

    return toBreakdown(rows);
  }

  private async loadUtm(eventId: string): Promise<SymplaUtmRow[]> {
    const rows = await this.db.$queryRaw<UtmQueryRow[]>`
      SELECT
        COALESCE(NULLIF(trim(o.utm_tracking->>'utm_source'), ''), '(direto)') AS source,
        COALESCE(NULLIF(trim(o.utm_tracking->>'utm_campaign'), ''), '—') AS campaign,
        count(DISTINCT o.id)::int AS orders,
        count(ep.id)::int AS tickets,
        count(ep.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM check_ins ci WHERE ci.event_participant_id = ep.id)
        )::int AS checked_in,
        COALESCE(sum(ep.ticket_price), 0)::float8 AS revenue
      FROM sympla_orders o
      LEFT JOIN event_participants ep ON ep.order_id = o.id AND ep.deleted_at IS NULL
      WHERE o.event_id = ${eventId}
      GROUP BY 1, 2
      ORDER BY tickets DESC, orders DESC, source ASC
      LIMIT 50
    `;

    return rows.map((row) => ({
      source: row.source,
      campaign: row.campaign,
      orders: Number(row.orders),
      tickets: Number(row.tickets),
      checkedIn: Number(row.checked_in),
      checkInRate: rate(Number(row.checked_in), Number(row.tickets)),
      revenue: Number(row.revenue),
    }));
  }
}

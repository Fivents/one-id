/**
 * Zod schemas for the Sympla public API v1.6.0.
 *
 * Two deliberate choices:
 * - Almost everything is nullish. Sympla omits null fields by default, and the `fields` query
 *   param lets a caller narrow the payload further, so treating any given field as guaranteed
 *   is how a sync starts throwing on real data.
 * - Dates stay strings here. Sympla mixes `2026-09-18 14:30:00` and ISO-8601 depending on the
 *   endpoint, and the timezone belongs to the event — parsing is the mapper's job, not the
 *   transport's.
 */

import { z } from 'zod/v4';

/** Sympla is inconsistent about whether these ids arrive as string or number. */
const stringId = z.union([z.string(), z.number()]).transform((value) => String(value));

/** `published` / `cancelled` arrive as booleans on some endpoints and 0/1 on others. */
const flexibleBoolean = z
  .union([z.boolean(), z.number(), z.string()])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return value === 'true' || value === '1';
  });

export const symplaPaginationSchema = z.object({
  has_next: z.boolean().nullish(),
  quantity: z.number().nullish(),
  next_cursor: z.string().nullish(),
});

export const symplaAddressSchema = z.object({
  name: z.string().nullish(),
  address: z.string().nullish(),
  address_alt: z.string().nullish(),
  address_num: z.string().nullish(),
  neighborhood: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  zip_code: z.string().nullish(),
  country: z.string().nullish(),
  lat: z.union([z.number(), z.string()]).nullish(),
  lon: z.union([z.number(), z.string()]).nullish(),
});

export const symplaEventSchema = z.object({
  id: stringId,
  reference_id: z.number().nullish(),
  name: z.string(),
  detail: z.string().nullish(),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
  private_event: flexibleBoolean,
  published: flexibleBoolean,
  cancelled: flexibleBoolean,
  image: z.string().nullish(),
  url: z.string().nullish(),
  address: symplaAddressSchema.nullish(),
  host: z.object({ name: z.string().nullish(), description: z.string().nullish() }).nullish(),
  category_prim: z.object({ name: z.string().nullish() }).nullish(),
  category_sec: z.object({ name: z.string().nullish() }).nullish(),
});

export const symplaSectorSchema = z.object({
  id: z.number().nullish(),
  name: z.string(),
  has_online_sale_available: z.boolean().nullish(),
});

export const symplaPresentationSchema = z.object({
  id: z.number(),
  event_id: stringId.nullish(),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
  start_date_utc: z.string().nullish(),
  end_date_utc: z.string().nullish(),
  published: flexibleBoolean,
  closed: flexibleBoolean,
  enabled: flexibleBoolean,
  private_presentation: flexibleBoolean,
  presentation_url: z.string().nullish(),
  sectors: z.array(symplaSectorSchema).nullish(),
});

export const symplaInvoiceInfoSchema = z.object({
  client_name: z.string().nullish(),
  doc_type: z.string().nullish(),
  doc_number: z.string().nullish(),
  address_street: z.string().nullish(),
  address_street_number: z.string().nullish(),
  address_neighborhood: z.string().nullish(),
  address_city: z.string().nullish(),
  address_state: z.string().nullish(),
  address_zip_code: z.string().nullish(),
});

export const symplaUtmSchema = z.object({
  utm_source: z.string().nullish(),
  utm_medium: z.string().nullish(),
  utm_campaign: z.string().nullish(),
  utm_content: z.string().nullish(),
  utm_term: z.string().nullish(),
  referrer: z.string().nullish(),
  user_agent: z.string().nullish(),
});

export const symplaOrderSchema = z.object({
  id: stringId,
  event_id: stringId.nullish(),
  order_date: z.string().nullish(),
  order_status: z.string().nullish(),
  updated_date: z.string().nullish(),
  approved_date: z.string().nullish(),
  buyer_first_name: z.string().nullish(),
  buyer_last_name: z.string().nullish(),
  buyer_email: z.string().nullish(),
  order_total_sale_price: z.number().nullish(),
  order_total_net_value: z.number().nullish(),
  discount_code: z.string().nullish(),
  transaction_type: z.string().nullish(),
  presentation_id: z.number().nullish(),
  invoice_info: symplaInvoiceInfoSchema.nullish(),
  utm: symplaUtmSchema.nullish(),
});

export const symplaCustomFormFieldSchema = z.object({
  id: z.union([z.number(), z.string()]).nullish(),
  name: z.string(),
  value: z.unknown().nullish(),
});

const symplaCheckInStatusObjectSchema = z.object({
  check_in: z.boolean().nullish(),
  check_in_date: z.string().nullish(),
  check_in_id: z.number().nullish(),
});

/**
 * The same field arrives in two shapes, confirmed against the live API: the participant GET
 * returns an object (`{check_in: false}`) while the check-in POST returns an array
 * (`[{check_in: true, check_in_date: ...}]`). Neither carries check_in_id in practice, despite
 * the documentation.
 *
 * Normalizing to the object form here means no caller has to know, and — more to the point — a
 * mirror cannot mistake an unparsed array for "no confirmation" and then assume success.
 */
export const symplaCheckInStatusSchema = z
  .union([symplaCheckInStatusObjectSchema, z.array(symplaCheckInStatusObjectSchema)])
  .transform((value) => {
    if (!Array.isArray(value)) return value;

    // Several entries would mean several check-ins; the confirmed one is what matters.
    return (
      value.find((entry) => entry.check_in === true) ??
      value[0] ?? { check_in: null, check_in_date: null, check_in_id: null }
    );
  });

export const symplaParticipantSchema = z.object({
  id: stringId,
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  email: z.string().nullish(),
  event_id: stringId.nullish(),
  presentation_id: z.number().nullish(),

  order_id: stringId.nullish(),
  order_status: z.string().nullish(),
  order_date: z.string().nullish(),
  order_approved_date: z.string().nullish(),
  order_updated_at: z.string().nullish(),
  order_discount: z.string().nullish(),

  // The idempotency anchor of the whole ingestion. Required.
  ticket_number: stringId,
  ticket_num_qr_code: stringId.nullish(),
  ticket_status: z.string().nullish(),
  ticket_name: z.string().nullish(),
  ticket_created_at: z.string().nullish(),
  ticket_updated_at: z.string().nullish(),
  ticket_sale_price: z.number().nullish(),
  ticket_net_value: z.number().nullish(),
  ticket_group_id: z.number().nullish(),
  ticket_group_name: z.string().nullish(),
  ticket_subgroup_id: z.number().nullish(),
  ticket_subgroup_name: z.string().nullish(),

  sector_name: z.string().nullish(),
  marked_place_name: z.string().nullish(),
  item_id: stringId.nullish(),
  access_information: z.string().nullish(),

  checkin: symplaCheckInStatusSchema.nullish(),
  custom_form: z.array(symplaCustomFormFieldSchema).nullish(),
});

/** RFC 9457 Problem Details, the Sympla error envelope. */
export const symplaProblemDetailsSchema = z.object({
  type: z.string().nullish(),
  title: z.string().nullish(),
  status: z.number().nullish(),
  detail: z.string().nullish(),
  instance: z.string().nullish(),
  violations: z
    .array(z.object({ field: z.string().nullish(), message: z.string().nullish() }))
    .nullish(),
});

export function symplaPageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item).nullish(),
    pagination: symplaPaginationSchema.nullish(),
  });
}

export type SymplaAddress = z.infer<typeof symplaAddressSchema>;
export type SymplaEvent = z.infer<typeof symplaEventSchema>;
export type SymplaPresentation = z.infer<typeof symplaPresentationSchema>;
export type SymplaSector = z.infer<typeof symplaSectorSchema>;
export type SymplaOrder = z.infer<typeof symplaOrderSchema>;
export type SymplaParticipant = z.infer<typeof symplaParticipantSchema>;
export type SymplaCheckInStatus = z.infer<typeof symplaCheckInStatusSchema>;
export type SymplaCustomFormField = z.infer<typeof symplaCustomFormFieldSchema>;
export type SymplaPagination = z.infer<typeof symplaPaginationSchema>;

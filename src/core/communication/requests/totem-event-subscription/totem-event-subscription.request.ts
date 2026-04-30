import { z } from 'zod/v4';

export const linkTotemToEventRequestSchema = z.object({
  locationName: z.string().min(1, 'Location name is required.'),
  totemOrganizationSubscriptionId: z.string().min(1, 'Totem organization subscription ID is required.'),
  eventId: z.string().min(1, 'Event ID is required.'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export type LinkTotemToEventRequest = z.infer<typeof linkTotemToEventRequestSchema>;

export const setTotemLocationRequestSchema = z.object({
  locationName: z.string().min(1, 'Location name is required.'),
});

export type SetTotemLocationRequest = z.infer<typeof setTotemLocationRequestSchema>;

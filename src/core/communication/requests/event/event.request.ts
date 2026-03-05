import { z } from 'zod/v4';

const eventStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELED']);

export const createEventRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().nullable().optional(),
  timezone: z.string().min(1, 'Timezone is required.'),
  address: z.string().nullable().optional(),
  status: eventStatusSchema.default('DRAFT'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  organizationId: z.string().min(1, 'Organization ID is required.'),
  printConfigId: z.string().nullable().optional(),
});

export type CreateEventRequest = z.infer<typeof createEventRequestSchema>;

export const updateEventRequestSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  timezone: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  status: eventStatusSchema.optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  printConfigId: z.string().nullable().optional(),
});

export type UpdateEventRequest = z.infer<typeof updateEventRequestSchema>;

export const duplicateEventRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export type DuplicateEventRequest = z.infer<typeof duplicateEventRequestSchema>;

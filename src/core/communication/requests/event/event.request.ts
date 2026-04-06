import { z } from 'zod/v4';

const eventStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELED']);

const eventAddressDetailsSchema = z.object({
  formattedAddress: z.string().min(1),
  placeId: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  source: z.enum(['nominatim', 'manual']).optional(),
});

export const createEventRequestSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    slug: z.string().min(1, 'Slug is required.'),
    description: z.string().nullable().optional(),
    timezone: z.string().min(1, 'Timezone is required.'),
    address: z.string().nullable().optional(),
    addressDetails: eventAddressDetailsSchema.nullable().optional(),
    status: eventStatusSchema.default('DRAFT'),
    faceEnabled: z.boolean().default(true),
    qrEnabled: z.boolean().default(false),
    codeEnabled: z.boolean().default(false),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    organizationId: z.string().min(1, 'Organization ID is required.'),
    printConfigId: z.string().nullable().optional(),
  })
  .refine((data) => data.faceEnabled || data.qrEnabled || data.codeEnabled, {
    message: 'At least one check-in method must be enabled.',
    path: ['faceEnabled'],
  });

export type CreateEventRequest = z.infer<typeof createEventRequestSchema>;

export const updateEventRequestSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    timezone: z.string().min(1).optional(),
    address: z.string().nullable().optional(),
    addressDetails: eventAddressDetailsSchema.nullable().optional(),
    status: eventStatusSchema.optional(),
    faceEnabled: z.boolean().optional(),
    qrEnabled: z.boolean().optional(),
    codeEnabled: z.boolean().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    printConfigId: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const hasAllMethodFields =
        data.faceEnabled !== undefined && data.qrEnabled !== undefined && data.codeEnabled !== undefined;

      if (!hasAllMethodFields) {
        return true;
      }

      return data.faceEnabled || data.qrEnabled || data.codeEnabled;
    },
    {
      message: 'At least one check-in method must be enabled.',
      path: ['faceEnabled'],
    },
  );

export type UpdateEventRequest = z.infer<typeof updateEventRequestSchema>;

export const duplicateEventRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export type DuplicateEventRequest = z.infer<typeof duplicateEventRequestSchema>;

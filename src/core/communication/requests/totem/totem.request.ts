import { z } from 'zod/v4';

const totemStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const createTotemRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  accessCode: z.string().min(1, 'Access code is required.'),
  status: totemStatusSchema.default('INACTIVE'),
  price: z.number().min(0, 'Price must be non-negative.'),
  discount: z.number().min(0).max(100).default(0),
});

export type CreateTotemRequest = z.infer<typeof createTotemRequestSchema>;

export const updateTotemRequestSchema = z.object({
  name: z.string().min(1).optional(),
  accessCode: z.string().min(1).optional(),
  status: totemStatusSchema.optional(),
  price: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
});

export type UpdateTotemRequest = z.infer<typeof updateTotemRequestSchema>;

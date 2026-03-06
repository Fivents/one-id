import { z } from 'zod/v4';

export const createAdminTotemRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  price: z.number().min(0, 'Price must be non-negative.'),
  discount: z.number().min(0).default(0),
});

export type CreateAdminTotemRequest = z.infer<typeof createAdminTotemRequestSchema>;

export const bulkCreateTotemsRequestSchema = z.object({
  prefix: z.string().min(1, 'Name prefix is required.'),
  count: z.number().min(1, 'Count must be at least 1').max(50, 'Maximum 50 totems per batch'),
  price: z.number().min(0, 'Price must be non-negative.'),
  discount: z.number().min(0).default(0),
});

export type BulkCreateTotemsRequest = z.infer<typeof bulkCreateTotemsRequestSchema>;

export const updateAdminTotemRequestSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
});

export type UpdateAdminTotemRequest = z.infer<typeof updateAdminTotemRequestSchema>;

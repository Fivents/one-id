import { z } from 'zod/v4';

export const createFeatureRequestSchema = z.object({
  code: z.string().min(1, 'Code is required.'),
  name: z.string().min(1, 'Name is required.'),
  type: z.enum(['boolean', 'number', 'string']),
  description: z.string().nullable().optional(),
});

export type CreateFeatureRequest = z.infer<typeof createFeatureRequestSchema>;

export const updateFeatureRequestSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['boolean', 'number', 'string']).optional(),
  description: z.string().nullable().optional(),
});

export type UpdateFeatureRequest = z.infer<typeof updateFeatureRequestSchema>;

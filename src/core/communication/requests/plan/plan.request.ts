import { z } from 'zod/v4';

export const createPlanRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().min(1, 'Description is required.'),
  price: z.number().min(0, 'Price must be non-negative.'),
  discount: z.number().min(0).max(100).default(0),
  isCustom: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type CreatePlanRequest = z.infer<typeof createPlanRequestSchema>;

export const updatePlanRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  isCustom: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdatePlanRequest = z.infer<typeof updatePlanRequestSchema>;

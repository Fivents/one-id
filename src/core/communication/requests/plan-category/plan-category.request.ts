import { z } from 'zod/v4';

export const createPlanCategoryRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  color: z.string().min(1).default('#6366f1'),
  sortOrder: z.number().int().default(0),
});

export type CreatePlanCategoryRequest = z.infer<typeof createPlanCategoryRequestSchema>;

export const updatePlanCategoryRequestSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdatePlanCategoryRequest = z.infer<typeof updatePlanCategoryRequestSchema>;

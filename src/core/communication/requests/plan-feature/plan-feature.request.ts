import { z } from 'zod/v4';

export const associateFeatureToPlanRequestSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required.'),
  featureId: z.string().min(1, 'Feature ID is required.'),
  value: z.string().min(1, 'Value is required.'),
});

export type AssociateFeatureToPlanRequest = z.infer<typeof associateFeatureToPlanRequestSchema>;

export const updatePlanFeatureValueRequestSchema = z.object({
  value: z.string().min(1, 'Value is required.'),
});

export type UpdatePlanFeatureValueRequest = z.infer<typeof updatePlanFeatureValueRequestSchema>;

import { z } from 'zod/v4';

export const createSubscriptionRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  planId: z.string().min(1, 'Plan ID is required.'),
  startedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
});

export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionRequestSchema>;

export const updateSubscriptionRequestSchema = z.object({
  planId: z.string().min(1).optional(),
  expiresAt: z.coerce.date().optional(),
});

export type UpdateSubscriptionRequest = z.infer<typeof updateSubscriptionRequestSchema>;

export const changePlanRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  newPlanId: z.string().min(1, 'New plan ID is required.'),
});

export type ChangePlanRequest = z.infer<typeof changePlanRequestSchema>;

export const renewSubscriptionRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  newExpiresAt: z.coerce.date(),
});

export type RenewSubscriptionRequest = z.infer<typeof renewSubscriptionRequestSchema>;

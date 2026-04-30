import { z } from 'zod/v4';

export const requestPlanChangeRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  requestedPlanId: z.string().min(1, 'Requested plan ID is required.'),
  message: z.string().min(1, 'Message is required.'),
});

export type RequestPlanChangeRequest = z.infer<typeof requestPlanChangeRequestSchema>;

export const resolvePlanChangeRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required.'),
  resolvedById: z.string().min(1, 'Resolver ID is required.'),
  resolvedNote: z.string().nullable().optional(),
});

export type ResolvePlanChangeRequest = z.infer<typeof resolvePlanChangeRequestSchema>;

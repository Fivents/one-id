import { z } from 'zod/v4';

const notificationChannelSchema = z.enum(['EMAIL', 'IN_APP', 'SMS']);
const notificationTypeSchema = z.enum([
  'PLAN_REQUEST',
  'PLAN_APPROVED',
  'PLAN_REJECTED',
  'LIMIT_WARNING',
  'EXPIRATION_WARNING',
  'NEW_MEMBER',
  'EVENT_CREATED',
  'SYSTEM_MESSAGE',
]);

export const createNotificationRequestSchema = z.object({
  channel: notificationChannelSchema,
  type: notificationTypeSchema,
  title: z.string().min(1, 'Title is required.'),
  message: z.string().min(1, 'Message is required.'),
  data: z.record(z.string(), z.unknown()).nullable().optional(),
  userId: z.string().min(1, 'User ID is required.'),
});

export type CreateNotificationRequest = z.infer<typeof createNotificationRequestSchema>;

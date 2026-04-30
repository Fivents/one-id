import { z } from 'zod/v4';

export const emailStepSchema = z.object({
  email: z.email('Invalid email address.'),
});

export type EmailStepData = z.infer<typeof emailStepSchema>;

export const passwordStepSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
});

export type PasswordStepData = z.infer<typeof passwordStepSchema>;

export const totemAccessCodeSchema = z.object({
  accessCode: z.string().min(1, 'Access code is required.'),
});

export type TotemAccessCodeData = z.infer<typeof totemAccessCodeSchema>;

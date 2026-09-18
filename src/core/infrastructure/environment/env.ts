import { z } from 'zod/v4';

import { Logger } from '@/core/utils/logger';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('1h'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  TOTEM_SESSION_TIMEOUT_MS: z.coerce
    .number()
    .positive()
    .default(8 * 60 * 60 * 1000), // Default: 8 hours
  // Optional on purpose: validateEnv() exits the process on failure, so making these required
  // would break every deploy that has not adopted the Sympla integration yet. Absence is
  // surfaced as SymplaNotConfiguredError at the point of use instead.
  SYMPLA_TOKEN_KEY: z.string().min(44).optional(), // base64 of 32 bytes
  CRON_SECRET: z.string().min(16).optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    Logger.fatal('Invalid environment variables', {
      errors: result.error.issues.map((issue) => ({
        name: issue.path.join('.'),
        message: issue.message,
      })),
    });
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

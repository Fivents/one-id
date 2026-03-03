import { z } from 'zod/v4';

import { Logger } from '../logger';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('1h'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
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

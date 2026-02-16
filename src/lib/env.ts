import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Variáveis de ambiente inválidas:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error("Variáveis de ambiente inválidas. Verifique o arquivo .env");
  }

  return result.data;
}

export const env = validateEnv();

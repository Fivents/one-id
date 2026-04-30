import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'prisma/config';

try {
  loadEnvFile(path.resolve(__dirname, '.env'));
} catch (error) {
  const isMissingEnvFile =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT';

  if (!isMissingEnvFile) {
    throw error;
  }
}

const fallbackDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? fallbackDatabaseUrl,
  },
});

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Live checks hit the real Sympla API and need credentials; they are opt-in via
    // `pnpm test:live`, never part of the default suite.
    exclude: ['tests/live/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      reporter: ['text', 'html'],
    },
  },
});

import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Opt-in config for checks that talk to the real Sympla API.
 *
 * Kept separate from vitest.config.ts so a network outage or an expired token can never fail
 * the ordinary suite, and so CI never needs credentials.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/live/**/*.test.ts'],
    // A real API round-trip is slower than a unit test, and these run sequentially on purpose
    // to stay inside Sympla's rate limit.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});

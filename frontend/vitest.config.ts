import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    testTimeout: 10000,
    environment: 'node',
    setupFiles: './tests/setup.ts',
    env: {
      ...config().parsed,
    },
  },
});

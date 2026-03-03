import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: './test/setupTests.mjs',
    coverage: {
      provider: 'v8',
    },
  },
});

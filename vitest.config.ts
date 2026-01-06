import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'web/dist/',
      ]
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'web/src/**/*.test.ts', 'web/src/**/*.test.tsx']
  }
});

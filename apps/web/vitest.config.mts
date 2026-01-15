import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
    target: 'es2022',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    testTimeout: 60000,
    pool: 'threads',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e', 'node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover', 'json'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules',
        '.next',
        'src/workers/ml-worker.ts',
        'src/entities/forecast/model/types.ts',
        'src/features/market-adapter/providers/types.ts',
        'src/app/forecast/**',
        'src/entities/history/model.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});

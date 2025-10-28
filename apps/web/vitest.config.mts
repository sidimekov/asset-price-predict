import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
    target: 'es2022',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    testTimeout: 60_000, // ← 60 СЕКУНД
    pool: 'threads',     // ← УСКОРЯЕТ userEvent
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e', 'node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover', 'json'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules', '.next'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
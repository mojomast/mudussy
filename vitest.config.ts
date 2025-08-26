import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
  testTimeout: 310000, // Allow long-running load test (~5 minutes + buffer)
    testMatch: [
      '**/__tests__/**/*.test.ts',
      '**/?(*.)+(spec|test).ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    coverage: {
      provider: 'v8',
  reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        'coverage/',
        '**/*.config.ts',
        'scripts/',
      ],
  all: true,
  // Minimum coverage thresholds
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
    },
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, './engine'),
      '@core': path.resolve(__dirname, './engine/core'),
      '@modules': path.resolve(__dirname, './engine/modules'),
      '@server': path.resolve(__dirname, './server'),
      '@clients': path.resolve(__dirname, './clients'),
      '@tools': path.resolve(__dirname, './tools'),
      '@scripts': path.resolve(__dirname, './scripts'),
    },
  },
});
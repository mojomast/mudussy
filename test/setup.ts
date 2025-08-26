import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'inversify';
import { EventEmitter } from 'events';

// Global test setup
beforeAll(async () => {
  // Setup global test environment
  console.log('🔧 Setting up test environment...');
});

afterAll(async () => {
  // Cleanup global test environment
  console.log('🧹 Cleaning up test environment...');
});

// Setup for each test
beforeEach(() => {
  // Reset any global state if needed
});

afterEach(() => {
  // Clean up after each test
});

// Mock implementations for common dependencies
export const createMockContainer = (): Container => {
  const container = new Container();
  // Add mock services as needed
  return container;
};

export const createMockLogger = () => ({
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
});

// Global test utilities
export const waitForEvent = (emitter: EventEmitter, event: string, timeout = 1000): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    const handler = (...args: any[]) => {
      clearTimeout(timer);
      emitter.removeListener(event, handler);
      resolve(args);
    };

    emitter.on(event, handler);
  });
};

export const createTestEntity = (overrides = {}) => ({
  id: 'test-entity-id',
  name: 'Test Entity',
  type: 'test',
  created: new Date(),
  updated: new Date(),
  metadata: new Map(),
  ...overrides,
});

export const createTestEvent = (overrides = {}) => ({
  eventType: 'test.event',
  source: 'test-source',
  target: 'test-target',
  data: { test: true },
  timestamp: new Date(),
  ...overrides,
});
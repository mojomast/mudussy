import { vi } from 'vitest';
import { EventEmitter } from 'events';
import { Container } from 'inversify';
import { BaseEntity } from '../../engine/core/entity';
import { GameEvent, EventSystem } from '../../engine/core/event';

// Test helper for creating mock event emitters
export const createMockEventEmitter = () => {
  const emitter = new EventEmitter();
  return {
    emitter,
    emit: vi.fn(emitter.emit.bind(emitter)),
    on: vi.fn(emitter.on.bind(emitter)),
    off: vi.fn(emitter.off.bind(emitter)),
    once: vi.fn(emitter.once.bind(emitter)),
  };
};

// Test helper for creating mock containers
export const createMockContainer = () => {
  const container = new Container();
  return {
    container,
    bind: vi.fn(container.bind.bind(container)),
    get: vi.fn(container.get.bind(container)),
    isBound: vi.fn(container.isBound.bind(container)),
    unbind: vi.fn(container.unbind.bind(container)),
  };
};

// Test helper for creating mock event systems
export const createMockEventSystem = () => {
  const mockSystem = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    getRegisteredEventTypes: vi.fn().mockReturnValue([]),
    getHandlerCount: vi.fn().mockReturnValue(0),
    getRecentEvents: vi.fn().mockReturnValue([]),
    getEventsByType: vi.fn().mockReturnValue([]),
    clearHistory: vi.fn(),
    getStatistics: vi.fn().mockReturnValue({}),
    waitForEvent: vi.fn(),
  };
  return mockSystem;
};

// Test helper for creating mock loggers
export const createMockLogger = () => ({
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
});

// Concrete entity class for testing
class TestEntity extends BaseEntity {
  constructor(name: string, type: string) {
    super(name, type);
  }
}

// Test helper for creating test entities
export const createTestEntity = (overrides: Partial<TestEntity> = {}): TestEntity => {
  const entity = new TestEntity('Test Entity', 'test');
  Object.assign(entity, overrides);
  return entity;
};

// Test helper for creating test events
export const createTestEvent = (overrides: Partial<GameEvent> = {}): GameEvent => {
  return new GameEvent(
    overrides.eventType || 'test.event',
    overrides.source || 'test-source',
    overrides.target || 'test-target',
    overrides.data || { test: true }
  );
};

// Test helper for waiting for async operations
export const waitForNextTick = (): Promise<void> => {
  return new Promise(resolve => setImmediate(resolve));
};

export const waitForTimeout = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Test helper for creating temporary files
export const createTempFile = (content: string, extension = 'json'): string => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tempDir = os.tmpdir();
  const filename = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
  const filepath = path.join(tempDir, filename);

  fs.writeFileSync(filepath, content, 'utf8');
  return filepath;
};

// Test helper for cleaning up temporary files
export const cleanupTempFile = (filepath: string): void => {
  const fs = require('fs');
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

// Test helper for asserting event emissions
export const assertEventEmitted = async (
  eventSystem: EventSystem,
  eventType: string,
  triggerFn: () => Promise<void> | void,
  expectedData?: any
): Promise<GameEvent> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Event ${eventType} was not emitted within timeout`));
    }, 1000);

    eventSystem.once(eventType, (event: GameEvent) => {
      clearTimeout(timeout);
      if (expectedData && JSON.stringify(event.data) !== JSON.stringify(expectedData)) {
        reject(new Error(`Event data mismatch. Expected: ${JSON.stringify(expectedData)}, Got: ${JSON.stringify(event.data)}`));
      } else {
        resolve(event);
      }
    });

    // Trigger the function that should emit the event
    const result = triggerFn();
    if (result instanceof Promise) {
      result.catch(reject);
    }
  });
};

// Test helper for mocking network connections
export const createMockSocket = () => {
  const mockSocket = {
    write: vi.fn(),
    end: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
    remoteAddress: '127.0.0.1',
    remotePort: 12345,
    localAddress: '127.0.0.1',
    localPort: 4000,
  };
  return mockSocket;
};

// Test helper for creating mock command handlers
export const createMockCommandHandler = (command: string, response?: string) => ({
  command,
  aliases: [],
  description: `Mock ${command} command`,
  usage: `${command}`,
  handler: vi.fn().mockResolvedValue(response || `Mock response for ${command}`),
  requiresAuth: false,
  adminOnly: false,
});
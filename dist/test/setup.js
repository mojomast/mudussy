"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestEvent = exports.createTestEntity = exports.waitForEvent = exports.createMockLogger = exports.createMockContainer = void 0;
const vitest_1 = require("vitest");
const inversify_1 = require("inversify");
(0, vitest_1.beforeAll)(async () => {
    console.log('🔧 Setting up test environment...');
});
(0, vitest_1.afterAll)(async () => {
    console.log('🧹 Cleaning up test environment...');
});
(0, vitest_1.beforeEach)(() => {
});
(0, vitest_1.afterEach)(() => {
});
const createMockContainer = () => {
    const container = new inversify_1.Container();
    return container;
};
exports.createMockContainer = createMockContainer;
const createMockLogger = () => ({
    log: vitest_1.vi.fn(),
    error: vitest_1.vi.fn(),
    warn: vitest_1.vi.fn(),
    info: vitest_1.vi.fn(),
    debug: vitest_1.vi.fn(),
});
exports.createMockLogger = createMockLogger;
const waitForEvent = (emitter, event, timeout = 1000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeout);
        const handler = (...args) => {
            clearTimeout(timer);
            emitter.removeListener(event, handler);
            resolve(args);
        };
        emitter.on(event, handler);
    });
};
exports.waitForEvent = waitForEvent;
const createTestEntity = (overrides = {}) => ({
    id: 'test-entity-id',
    name: 'Test Entity',
    type: 'test',
    created: new Date(),
    updated: new Date(),
    metadata: new Map(),
    ...overrides,
});
exports.createTestEntity = createTestEntity;
const createTestEvent = (overrides = {}) => ({
    eventType: 'test.event',
    source: 'test-source',
    target: 'test-target',
    data: { test: true },
    timestamp: new Date(),
    ...overrides,
});
exports.createTestEvent = createTestEvent;
//# sourceMappingURL=setup.js.map
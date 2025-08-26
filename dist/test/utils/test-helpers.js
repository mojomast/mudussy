"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockCommandHandler = exports.createMockSocket = exports.assertEventEmitted = exports.cleanupTempFile = exports.createTempFile = exports.waitForTimeout = exports.waitForNextTick = exports.createTestEvent = exports.createTestEntity = exports.createMockLogger = exports.createMockEventSystem = exports.createMockContainer = exports.createMockEventEmitter = void 0;
const vitest_1 = require("vitest");
const events_1 = require("events");
const inversify_1 = require("inversify");
const entity_1 = require("../../engine/core/entity");
const event_1 = require("../../engine/core/event");
const createMockEventEmitter = () => {
    const emitter = new events_1.EventEmitter();
    return {
        emitter,
        emit: vitest_1.vi.fn(emitter.emit.bind(emitter)),
        on: vitest_1.vi.fn(emitter.on.bind(emitter)),
        off: vitest_1.vi.fn(emitter.off.bind(emitter)),
        once: vitest_1.vi.fn(emitter.once.bind(emitter)),
    };
};
exports.createMockEventEmitter = createMockEventEmitter;
const createMockContainer = () => {
    const container = new inversify_1.Container();
    return {
        container,
        bind: vitest_1.vi.fn(container.bind.bind(container)),
        get: vitest_1.vi.fn(container.get.bind(container)),
        isBound: vitest_1.vi.fn(container.isBound.bind(container)),
        unbind: vitest_1.vi.fn(container.unbind.bind(container)),
    };
};
exports.createMockContainer = createMockContainer;
const createMockEventSystem = () => {
    const mockSystem = {
        emit: vitest_1.vi.fn(),
        on: vitest_1.vi.fn(),
        off: vitest_1.vi.fn(),
        once: vitest_1.vi.fn(),
        getRegisteredEventTypes: vitest_1.vi.fn().mockReturnValue([]),
        getHandlerCount: vitest_1.vi.fn().mockReturnValue(0),
        getRecentEvents: vitest_1.vi.fn().mockReturnValue([]),
        getEventsByType: vitest_1.vi.fn().mockReturnValue([]),
        clearHistory: vitest_1.vi.fn(),
        getStatistics: vitest_1.vi.fn().mockReturnValue({}),
        waitForEvent: vitest_1.vi.fn(),
    };
    return mockSystem;
};
exports.createMockEventSystem = createMockEventSystem;
const createMockLogger = () => ({
    log: vitest_1.vi.fn(),
    error: vitest_1.vi.fn(),
    warn: vitest_1.vi.fn(),
    info: vitest_1.vi.fn(),
    debug: vitest_1.vi.fn(),
});
exports.createMockLogger = createMockLogger;
class TestEntity extends entity_1.BaseEntity {
    constructor(name, type) {
        super(name, type);
    }
}
const createTestEntity = (overrides = {}) => {
    const entity = new TestEntity('Test Entity', 'test');
    Object.assign(entity, overrides);
    return entity;
};
exports.createTestEntity = createTestEntity;
const createTestEvent = (overrides = {}) => {
    return new event_1.GameEvent(overrides.eventType || 'test.event', overrides.source || 'test-source', overrides.target || 'test-target', overrides.data || { test: true });
};
exports.createTestEvent = createTestEvent;
const waitForNextTick = () => {
    return new Promise(resolve => setImmediate(resolve));
};
exports.waitForNextTick = waitForNextTick;
const waitForTimeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.waitForTimeout = waitForTimeout;
const createTempFile = (content, extension = 'json') => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tempDir = os.tmpdir();
    const filename = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, content, 'utf8');
    return filepath;
};
exports.createTempFile = createTempFile;
const cleanupTempFile = (filepath) => {
    const fs = require('fs');
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
};
exports.cleanupTempFile = cleanupTempFile;
const assertEventEmitted = async (eventSystem, eventType, triggerFn, expectedData) => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Event ${eventType} was not emitted within timeout`));
        }, 1000);
        eventSystem.once(eventType, (event) => {
            clearTimeout(timeout);
            if (expectedData && JSON.stringify(event.data) !== JSON.stringify(expectedData)) {
                reject(new Error(`Event data mismatch. Expected: ${JSON.stringify(expectedData)}, Got: ${JSON.stringify(event.data)}`));
            }
            else {
                resolve(event);
            }
        });
        const result = triggerFn();
        if (result instanceof Promise) {
            result.catch(reject);
        }
    });
};
exports.assertEventEmitted = assertEventEmitted;
const createMockSocket = () => {
    const mockSocket = {
        write: vitest_1.vi.fn(),
        end: vitest_1.vi.fn(),
        destroy: vitest_1.vi.fn(),
        on: vitest_1.vi.fn(),
        emit: vitest_1.vi.fn(),
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
        localAddress: '127.0.0.1',
        localPort: 4000,
    };
    return mockSocket;
};
exports.createMockSocket = createMockSocket;
const createMockCommandHandler = (command, response) => ({
    command,
    aliases: [],
    description: `Mock ${command} command`,
    usage: `${command}`,
    handler: vitest_1.vi.fn().mockResolvedValue(response || `Mock response for ${command}`),
    requiresAuth: false,
    adminOnly: false,
});
exports.createMockCommandHandler = createMockCommandHandler;
//# sourceMappingURL=test-helpers.js.map
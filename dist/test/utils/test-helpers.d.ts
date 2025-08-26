import { EventEmitter } from 'events';
import { Container } from 'inversify';
import { BaseEntity } from '../../engine/core/entity';
import { GameEvent, EventSystem } from '../../engine/core/event';
export declare const createMockEventEmitter: () => {
    emitter: EventEmitter<[never]>;
    emit: import("vitest").Mock<any[], any>;
    on: import("vitest").Mock<any[], any>;
    off: import("vitest").Mock<any[], any>;
    once: import("vitest").Mock<any[], any>;
};
export declare const createMockContainer: () => {
    container: Container;
    bind: import("vitest").Mock<any[], any>;
    get: import("vitest").Mock<any[], any>;
    isBound: import("vitest").Mock<any[], any>;
    unbind: import("vitest").Mock<any[], any>;
};
export declare const createMockEventSystem: () => {
    emit: import("vitest").Mock<any, any>;
    on: import("vitest").Mock<any, any>;
    off: import("vitest").Mock<any, any>;
    once: import("vitest").Mock<any, any>;
    getRegisteredEventTypes: import("vitest").Mock<any, any>;
    getHandlerCount: import("vitest").Mock<any, any>;
    getRecentEvents: import("vitest").Mock<any, any>;
    getEventsByType: import("vitest").Mock<any, any>;
    clearHistory: import("vitest").Mock<any, any>;
    getStatistics: import("vitest").Mock<any, any>;
    waitForEvent: import("vitest").Mock<any, any>;
};
export declare const createMockLogger: () => {
    log: import("vitest").Mock<any, any>;
    error: import("vitest").Mock<any, any>;
    warn: import("vitest").Mock<any, any>;
    info: import("vitest").Mock<any, any>;
    debug: import("vitest").Mock<any, any>;
};
declare class TestEntity extends BaseEntity {
    constructor(name: string, type: string);
}
export declare const createTestEntity: (overrides?: Partial<TestEntity>) => TestEntity;
export declare const createTestEvent: (overrides?: Partial<GameEvent>) => GameEvent;
export declare const waitForNextTick: () => Promise<void>;
export declare const waitForTimeout: (ms: number) => Promise<void>;
export declare const createTempFile: (content: string, extension?: string) => string;
export declare const cleanupTempFile: (filepath: string) => void;
export declare const assertEventEmitted: (eventSystem: EventSystem, eventType: string, triggerFn: () => Promise<void> | void, expectedData?: any) => Promise<GameEvent>;
export declare const createMockSocket: () => {
    write: import("vitest").Mock<any, any>;
    end: import("vitest").Mock<any, any>;
    destroy: import("vitest").Mock<any, any>;
    on: import("vitest").Mock<any, any>;
    emit: import("vitest").Mock<any, any>;
    remoteAddress: string;
    remotePort: number;
    localAddress: string;
    localPort: number;
};
export declare const createMockCommandHandler: (command: string, response?: string) => {
    command: string;
    aliases: any[];
    description: string;
    usage: string;
    handler: import("vitest").Mock<any, any>;
    requiresAuth: boolean;
    adminOnly: boolean;
};
export {};

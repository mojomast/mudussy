import { Container } from 'inversify';
import { EventEmitter } from 'events';
export declare const createMockContainer: () => Container;
export declare const createMockLogger: () => {
    log: import("vitest").Mock<any, any>;
    error: import("vitest").Mock<any, any>;
    warn: import("vitest").Mock<any, any>;
    info: import("vitest").Mock<any, any>;
    debug: import("vitest").Mock<any, any>;
};
export declare const waitForEvent: (emitter: EventEmitter, event: string, timeout?: number) => Promise<any[]>;
export declare const createTestEntity: (overrides?: {}) => {
    id: string;
    name: string;
    type: string;
    created: Date;
    updated: Date;
    metadata: Map<any, any>;
};
export declare const createTestEvent: (overrides?: {}) => {
    eventType: string;
    source: string;
    target: string;
    data: {
        test: boolean;
    };
    timestamp: Date;
};

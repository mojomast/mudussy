"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const event_1 = require("../../engine/core/event");
const test_helpers_1 = require("../utils/test-helpers");
(0, vitest_1.describe)('Event System', () => {
    (0, vitest_1.describe)('GameEvent', () => {
        let event;
        (0, vitest_1.beforeEach)(() => {
            event = new event_1.GameEvent('test.event', 'source-id', 'target-id', { key: 'value', number: 42 });
        });
        (0, vitest_1.it)('should create event with correct properties', () => {
            (0, vitest_1.expect)(event.eventType).toBe('test.event');
            (0, vitest_1.expect)(event.source).toBe('source-id');
            (0, vitest_1.expect)(event.target).toBe('target-id');
            (0, vitest_1.expect)(event.data).toEqual({ key: 'value', number: 42 });
            (0, vitest_1.expect)(event.timestamp).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should create event without target', () => {
            const eventWithoutTarget = new event_1.GameEvent('test.event', 'source-id', undefined, { test: true });
            (0, vitest_1.expect)(eventWithoutTarget.target).toBeUndefined();
        });
        (0, vitest_1.it)('should create event without data', () => {
            const eventWithoutData = new event_1.GameEvent('test.event', 'source-id', 'target-id');
            (0, vitest_1.expect)(eventWithoutData.data).toBeUndefined();
        });
        (0, vitest_1.it)('should convert to JSON correctly', () => {
            const json = event.toJSON();
            (0, vitest_1.expect)(json).toEqual({
                eventType: 'test.event',
                source: 'source-id',
                target: 'target-id',
                data: { key: 'value', number: 42 },
                timestamp: event.timestamp.toISOString()
            });
        });
        (0, vitest_1.it)('should handle complex data in JSON', () => {
            const complexEvent = new event_1.GameEvent('complex.event', 'source', 'target', {
                nested: { object: true },
                array: [1, 2, 3],
                nullValue: null,
                date: new Date('2023-01-01')
            });
            const json = complexEvent.toJSON();
            (0, vitest_1.expect)(json.data).toEqual({
                nested: { object: true },
                array: [1, 2, 3],
                nullValue: null,
                date: new Date('2023-01-01')
            });
        });
    });
    (0, vitest_1.describe)('EventSystem', () => {
        let eventSystem;
        let mockLogger;
        (0, vitest_1.beforeEach)(() => {
            mockLogger = (0, test_helpers_1.createMockLogger)();
            eventSystem = new event_1.EventSystem(undefined, 1000);
        });
        (0, vitest_1.it)('should initialize with default max history size', () => {
            const defaultSystem = new event_1.EventSystem();
            (0, vitest_1.expect)(defaultSystem).toBeDefined();
        });
        (0, vitest_1.it)('should initialize with custom max history size', () => {
            (0, vitest_1.expect)(eventSystem).toBeDefined();
        });
        (0, vitest_1.it)('should register and call event handlers', async () => {
            const handler = vitest_1.vi.fn();
            eventSystem.on('test.event', handler);
            const event = new event_1.GameEvent('test.event', 'source');
            await eventSystem.emit(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledWith(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should support multiple handlers for same event', async () => {
            const handler1 = vitest_1.vi.fn();
            const handler2 = vitest_1.vi.fn();
            const handler3 = vitest_1.vi.fn();
            eventSystem.on('test.event', handler1);
            eventSystem.on('test.event', handler2);
            eventSystem.on('test.event', handler3);
            const event = new event_1.GameEvent('test.event', 'source');
            await eventSystem.emit(event);
            (0, vitest_1.expect)(handler1).toHaveBeenCalledWith(event);
            (0, vitest_1.expect)(handler2).toHaveBeenCalledWith(event);
            (0, vitest_1.expect)(handler3).toHaveBeenCalledWith(event);
        });
        (0, vitest_1.it)('should support different event types', async () => {
            const handler1 = vitest_1.vi.fn();
            const handler2 = vitest_1.vi.fn();
            eventSystem.on('event.type1', handler1);
            eventSystem.on('event.type2', handler2);
            const event1 = new event_1.GameEvent('event.type1', 'source');
            const event2 = new event_1.GameEvent('event.type2', 'source');
            await eventSystem.emit(event1);
            await eventSystem.emit(event2);
            (0, vitest_1.expect)(handler1).toHaveBeenCalledWith(event1);
            (0, vitest_1.expect)(handler2).toHaveBeenCalledWith(event2);
            (0, vitest_1.expect)(handler1).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(handler2).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle handler errors gracefully', async () => {
            const errorHandler = vitest_1.vi.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });
            const normalHandler = vitest_1.vi.fn();
            eventSystem.on('test.event', errorHandler);
            eventSystem.on('test.event', normalHandler);
            const event = new event_1.GameEvent('test.event', 'source');
            await (0, vitest_1.expect)(eventSystem.emit(event)).resolves.toBeUndefined();
            (0, vitest_1.expect)(errorHandler).toHaveBeenCalledWith(event);
            (0, vitest_1.expect)(normalHandler).toHaveBeenCalledWith(event);
        });
        (0, vitest_1.it)('should remove event handlers', async () => {
            const handler = vitest_1.vi.fn();
            eventSystem.on('test.event', handler);
            const event = new event_1.GameEvent('test.event', 'source');
            await eventSystem.emit(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledTimes(1);
            eventSystem.off('test.event', handler);
            await eventSystem.emit(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle once handlers', async () => {
            const handler = vitest_1.vi.fn();
            eventSystem.once('test.event', handler);
            const event = new event_1.GameEvent('test.event', 'source');
            await eventSystem.emit(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledTimes(1);
            await eventSystem.emit(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should get registered event types', () => {
            eventSystem.on('event.type1', vitest_1.vi.fn());
            eventSystem.on('event.type2', vitest_1.vi.fn());
            eventSystem.on('event.type1', vitest_1.vi.fn());
            const types = eventSystem.getRegisteredEventTypes();
            (0, vitest_1.expect)(types).toContain('event.type1');
            (0, vitest_1.expect)(types).toContain('event.type2');
            (0, vitest_1.expect)(types).toHaveLength(2);
        });
        (0, vitest_1.it)('should get handler count for event types', () => {
            (0, vitest_1.expect)(eventSystem.getHandlerCount('nonexistent')).toBe(0);
            eventSystem.on('test.event', vitest_1.vi.fn());
            (0, vitest_1.expect)(eventSystem.getHandlerCount('test.event')).toBe(1);
            eventSystem.on('test.event', vitest_1.vi.fn());
            (0, vitest_1.expect)(eventSystem.getHandlerCount('test.event')).toBe(2);
        });
        (0, vitest_1.it)('should maintain event history', async () => {
            const event1 = new event_1.GameEvent('event1', 'source');
            const event2 = new event_1.GameEvent('event2', 'source');
            const event3 = new event_1.GameEvent('event3', 'source');
            await eventSystem.emit(event1);
            await eventSystem.emit(event2);
            await eventSystem.emit(event3);
            const recent = eventSystem.getRecentEvents(5);
            (0, vitest_1.expect)(recent).toHaveLength(3);
            (0, vitest_1.expect)(recent[2]).toBe(event1);
            (0, vitest_1.expect)(recent[1]).toBe(event2);
            (0, vitest_1.expect)(recent[0]).toBe(event3);
        });
        (0, vitest_1.it)('should limit event history size', async () => {
            const smallSystem = new event_1.EventSystem(undefined, 2);
            const event1 = new event_1.GameEvent('event1', 'source');
            const event2 = new event_1.GameEvent('event2', 'source');
            const event3 = new event_1.GameEvent('event3', 'source');
            await smallSystem.emit(event1);
            await smallSystem.emit(event2);
            await smallSystem.emit(event3);
            const recent = smallSystem.getRecentEvents(5);
            (0, vitest_1.expect)(recent).toHaveLength(2);
            (0, vitest_1.expect)(recent[1]).toBe(event2);
            (0, vitest_1.expect)(recent[0]).toBe(event3);
        });
        (0, vitest_1.it)('should get events by type from history', async () => {
            const event1 = new event_1.GameEvent('type1', 'source');
            const event2 = new event_1.GameEvent('type2', 'source');
            const event3 = new event_1.GameEvent('type1', 'source');
            await eventSystem.emit(event1);
            await eventSystem.emit(event2);
            await eventSystem.emit(event3);
            const type1Events = eventSystem.getEventsByType('type1', 5);
            (0, vitest_1.expect)(type1Events).toHaveLength(2);
            (0, vitest_1.expect)(type1Events[1]).toBe(event1);
            (0, vitest_1.expect)(type1Events[0]).toBe(event3);
            const type2Events = eventSystem.getEventsByType('type2', 5);
            (0, vitest_1.expect)(type2Events).toHaveLength(1);
            (0, vitest_1.expect)(type2Events[0]).toBe(event2);
        });
        (0, vitest_1.it)('should clear event history', async () => {
            const event = new event_1.GameEvent('test', 'source');
            await eventSystem.emit(event);
            (0, vitest_1.expect)(eventSystem.getRecentEvents()).toHaveLength(1);
            eventSystem.clearHistory();
            (0, vitest_1.expect)(eventSystem.getRecentEvents()).toHaveLength(0);
        });
        (0, vitest_1.it)('should provide statistics', async () => {
            eventSystem.on('type1', vitest_1.vi.fn());
            eventSystem.on('type2', vitest_1.vi.fn());
            eventSystem.on('type2', vitest_1.vi.fn());
            const event1 = new event_1.GameEvent('type1', 'source1');
            const event2 = new event_1.GameEvent('type2', 'source2');
            await eventSystem.emit(event1);
            await eventSystem.emit(event2);
            const stats = eventSystem.getStatistics();
            (0, vitest_1.expect)(stats.totalEvents).toBe(2);
            (0, vitest_1.expect)(stats.registeredTypes).toContain('type1');
            (0, vitest_1.expect)(stats.registeredTypes).toContain('type2');
            (0, vitest_1.expect)(stats.handlerCounts.type1).toBe(1);
            (0, vitest_1.expect)(stats.handlerCounts.type2).toBe(2);
            (0, vitest_1.expect)(stats.recentActivity).toHaveLength(2);
        });
        (0, vitest_1.it)('should wait for event with timeout', async () => {
            const promise = eventSystem.waitForEvent('test.event', undefined, 100);
            setTimeout(() => {
                const event = new event_1.GameEvent('test.event', 'source');
                eventSystem.emit(event);
            }, 10);
            const result = await promise;
            (0, vitest_1.expect)(result.eventType).toBe('test.event');
            (0, vitest_1.expect)(result.source).toBe('source');
        });
        (0, vitest_1.it)('should timeout waiting for event', async () => {
            const promise = eventSystem.waitForEvent('test.event', undefined, 10);
            await (0, vitest_1.expect)(promise).rejects.toThrow('Timeout waiting for event: test.event');
        });
        (0, vitest_1.it)('should wait for event with predicate', async () => {
            const promise = eventSystem.waitForEvent('test.event', (event) => event.data?.value === 'correct', 100);
            setTimeout(() => {
                const wrongEvent = new event_1.GameEvent('test.event', 'source', undefined, { value: 'wrong' });
                eventSystem.emit(wrongEvent);
            }, 10);
            setTimeout(() => {
                const correctEvent = new event_1.GameEvent('test.event', 'source', undefined, { value: 'correct' });
                eventSystem.emit(correctEvent);
            }, 20);
            const result = await promise;
            (0, vitest_1.expect)(result.data.value).toBe('correct');
        });
    });
    (0, vitest_1.describe)('EventTypes', () => {
        let eventSystem;
        (0, vitest_1.beforeEach)(() => {
            eventSystem = new event_1.EventSystem();
        });
        (0, vitest_1.it)('should define all standard event types', () => {
            (0, vitest_1.expect)(event_1.EventTypes.ENTITY_CREATED).toBe('entity.created');
            (0, vitest_1.expect)(event_1.EventTypes.PLAYER_JOINED).toBe('player.joined');
            (0, vitest_1.expect)(event_1.EventTypes.GAME_STARTED).toBe('game.started');
            (0, vitest_1.expect)(event_1.EventTypes.PLUGIN_LOADED).toBe('plugin.loaded');
            (0, vitest_1.expect)(event_1.EventTypes.ROOM_ENTERED).toBe('room.entered');
            (0, vitest_1.expect)(event_1.EventTypes.COMBAT_STARTED).toBe('combat.started');
        });
        (0, vitest_1.it)('should work with event system', async () => {
            const handler = vitest_1.vi.fn();
            eventSystem.on(event_1.EventTypes.PLAYER_JOINED, handler);
            const event = new event_1.GameEvent(event_1.EventTypes.PLAYER_JOINED, 'player1');
            await eventSystem.emit(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledWith(event);
        });
    });
    (0, vitest_1.describe)('Event System Integration', () => {
        let eventSystem;
        (0, vitest_1.beforeEach)(() => {
            eventSystem = new event_1.EventSystem();
        });
        (0, vitest_1.it)('should handle complex event flow', async () => {
            const events = [];
            eventSystem.on('player.joined', (event) => {
                events.push(`Player ${event.source} joined`);
            });
            eventSystem.on('player.moved', (event) => {
                events.push(`Player ${event.source} moved to ${event.data.room}`);
            });
            eventSystem.on('combat.started', (event) => {
                events.push(`Combat started between ${event.source} and ${event.target}`);
            });
            await eventSystem.emit(new event_1.GameEvent('player.joined', 'player1'));
            await eventSystem.emit(new event_1.GameEvent('player.moved', 'player1', undefined, { room: 'room1' }));
            await eventSystem.emit(new event_1.GameEvent('combat.started', 'player1', 'monster1'));
            (0, vitest_1.expect)(events).toEqual([
                'Player player1 joined',
                'Player player1 moved to room1',
                'Combat started between player1 and monster1'
            ]);
        });
        (0, vitest_1.it)('should handle event chains', async () => {
            let chainCount = 0;
            eventSystem.on('chain.start', async (event) => {
                chainCount++;
                if (chainCount < 3) {
                    await eventSystem.emit(new event_1.GameEvent('chain.continue', event.source));
                }
            });
            eventSystem.on('chain.continue', async (event) => {
                chainCount++;
                if (chainCount < 3) {
                    await eventSystem.emit(new event_1.GameEvent('chain.start', event.source));
                }
            });
            await eventSystem.emit(new event_1.GameEvent('chain.start', 'test'));
            await new Promise(resolve => setTimeout(resolve, 10));
            (0, vitest_1.expect)(chainCount).toBe(3);
        });
    });
});
//# sourceMappingURL=event.test.js.map
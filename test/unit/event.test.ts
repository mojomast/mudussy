import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GameEvent,
  EventSystem,
  IEventData,
  EventTypes
} from '../../engine/core/event';
import {
  createMockEventSystem,
  createMockLogger
} from '../utils/test-helpers';

describe('Event System', () => {
  describe('GameEvent', () => {
    let event: GameEvent;

    beforeEach(() => {
      event = new GameEvent(
        'test.event',
        'source-id',
        'target-id',
        { key: 'value', number: 42 }
      );
    });

    it('should create event with correct properties', () => {
      expect(event.eventType).toBe('test.event');
      expect(event.source).toBe('source-id');
      expect(event.target).toBe('target-id');
      expect(event.data).toEqual({ key: 'value', number: 42 });
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should create event without target', () => {
      const eventWithoutTarget = new GameEvent(
        'test.event',
        'source-id',
        undefined,
        { test: true }
      );

      expect(eventWithoutTarget.target).toBeUndefined();
    });

    it('should create event without data', () => {
      const eventWithoutData = new GameEvent(
        'test.event',
        'source-id',
        'target-id'
      );

      expect(eventWithoutData.data).toBeUndefined();
    });

    it('should convert to JSON correctly', () => {
      const json = event.toJSON();

      expect(json).toEqual({
        eventType: 'test.event',
        source: 'source-id',
        target: 'target-id',
        data: { key: 'value', number: 42 },
        timestamp: event.timestamp.toISOString()
      });
    });

    it('should handle complex data in JSON', () => {
      const complexEvent = new GameEvent(
        'complex.event',
        'source',
        'target',
        {
          nested: { object: true },
          array: [1, 2, 3],
          nullValue: null,
          date: new Date('2023-01-01')
        }
      );

      const json = complexEvent.toJSON() as any;
      expect(json.data).toEqual({
        nested: { object: true },
        array: [1, 2, 3],
        nullValue: null,
        date: new Date('2023-01-01')
      });
    });
  });

  describe('EventSystem', () => {
    let eventSystem: EventSystem;
    let mockLogger: any;

    beforeEach(() => {
      mockLogger = createMockLogger();
      eventSystem = new EventSystem(undefined, 1000);
    });

    it('should initialize with default max history size', () => {
      const defaultSystem = new EventSystem();
      expect(defaultSystem).toBeDefined();
    });

    it('should initialize with custom max history size', () => {
      expect(eventSystem).toBeDefined();
    });

    it('should register and call event handlers', async () => {
      const handler = vi.fn();
      eventSystem.on('test.event', handler);

      const event = new GameEvent('test.event', 'source');
      await eventSystem.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple handlers for same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventSystem.on('test.event', handler1);
      eventSystem.on('test.event', handler2);
      eventSystem.on('test.event', handler3);

      const event = new GameEvent('test.event', 'source');
      await eventSystem.emit(event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
      expect(handler3).toHaveBeenCalledWith(event);
    });

    it('should support different event types', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventSystem.on('event.type1', handler1);
      eventSystem.on('event.type2', handler2);

      const event1 = new GameEvent('event.type1', 'source');
      const event2 = new GameEvent('event.type2', 'source');

      await eventSystem.emit(event1);
      await eventSystem.emit(event2);

      expect(handler1).toHaveBeenCalledWith(event1);
      expect(handler2).toHaveBeenCalledWith(event2);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle handler errors gracefully', async () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      eventSystem.on('test.event', errorHandler);
      eventSystem.on('test.event', normalHandler);

      const event = new GameEvent('test.event', 'source');

      // Should not throw
      await expect(eventSystem.emit(event)).resolves.toBeUndefined();

      expect(errorHandler).toHaveBeenCalledWith(event);
      expect(normalHandler).toHaveBeenCalledWith(event);
    });

    it('should remove event handlers', async () => {
      const handler = vi.fn();
      eventSystem.on('test.event', handler);

      const event = new GameEvent('test.event', 'source');
      await eventSystem.emit(event);
      expect(handler).toHaveBeenCalledTimes(1);

      eventSystem.off('test.event', handler);
      await eventSystem.emit(event);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle once handlers', async () => {
      const handler = vi.fn();
      eventSystem.once('test.event', handler);

      const event = new GameEvent('test.event', 'source');

      await eventSystem.emit(event);
      expect(handler).toHaveBeenCalledTimes(1);

      await eventSystem.emit(event);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should get registered event types', () => {
      eventSystem.on('event.type1', vi.fn());
      eventSystem.on('event.type2', vi.fn());
      eventSystem.on('event.type1', vi.fn()); // Duplicate

      const types = eventSystem.getRegisteredEventTypes();
      expect(types).toContain('event.type1');
      expect(types).toContain('event.type2');
      expect(types).toHaveLength(2);
    });

    it('should get handler count for event types', () => {
      expect(eventSystem.getHandlerCount('nonexistent')).toBe(0);

      eventSystem.on('test.event', vi.fn());
      expect(eventSystem.getHandlerCount('test.event')).toBe(1);

      eventSystem.on('test.event', vi.fn());
      expect(eventSystem.getHandlerCount('test.event')).toBe(2);
    });

    it('should maintain event history', async () => {
      const event1 = new GameEvent('event1', 'source');
      const event2 = new GameEvent('event2', 'source');
      const event3 = new GameEvent('event3', 'source');

      await eventSystem.emit(event1);
      await eventSystem.emit(event2);
      await eventSystem.emit(event3);

      const recent = eventSystem.getRecentEvents(5);
      expect(recent).toHaveLength(3);
      expect(recent[2]).toBe(event1); // Oldest first
      expect(recent[1]).toBe(event2);
      expect(recent[0]).toBe(event3); // Newest last
    });

    it('should limit event history size', async () => {
      const smallSystem = new EventSystem(undefined, 2);

      const event1 = new GameEvent('event1', 'source');
      const event2 = new GameEvent('event2', 'source');
      const event3 = new GameEvent('event3', 'source');

      await smallSystem.emit(event1);
      await smallSystem.emit(event2);
      await smallSystem.emit(event3);

      const recent = smallSystem.getRecentEvents(5);
      expect(recent).toHaveLength(2);
      expect(recent[1]).toBe(event2); // event1 was removed
      expect(recent[0]).toBe(event3);
    });

    it('should get events by type from history', async () => {
      const event1 = new GameEvent('type1', 'source');
      const event2 = new GameEvent('type2', 'source');
      const event3 = new GameEvent('type1', 'source');

      await eventSystem.emit(event1);
      await eventSystem.emit(event2);
      await eventSystem.emit(event3);

      const type1Events = eventSystem.getEventsByType('type1', 5);
      expect(type1Events).toHaveLength(2);
      expect(type1Events[1]).toBe(event1);
      expect(type1Events[0]).toBe(event3);

      const type2Events = eventSystem.getEventsByType('type2', 5);
      expect(type2Events).toHaveLength(1);
      expect(type2Events[0]).toBe(event2);
    });

    it('should clear event history', async () => {
      const event = new GameEvent('test', 'source');
      await eventSystem.emit(event);

      expect(eventSystem.getRecentEvents()).toHaveLength(1);

      eventSystem.clearHistory();
      expect(eventSystem.getRecentEvents()).toHaveLength(0);
    });

    it('should provide statistics', async () => {
      eventSystem.on('type1', vi.fn());
      eventSystem.on('type2', vi.fn());
      eventSystem.on('type2', vi.fn());

      const event1 = new GameEvent('type1', 'source1');
      const event2 = new GameEvent('type2', 'source2');

      await eventSystem.emit(event1);
      await eventSystem.emit(event2);

      const stats = eventSystem.getStatistics() as any;

      expect(stats.totalEvents).toBe(2);
      expect(stats.registeredTypes).toContain('type1');
      expect(stats.registeredTypes).toContain('type2');
      expect(stats.handlerCounts.type1).toBe(1);
      expect(stats.handlerCounts.type2).toBe(2);
      expect(stats.recentActivity).toHaveLength(2);
    });

    it('should wait for event with timeout', async () => {
      const promise = eventSystem.waitForEvent('test.event', undefined, 100);

      // Emit event after delay
      setTimeout(() => {
        const event = new GameEvent('test.event', 'source');
        eventSystem.emit(event);
      }, 10);

      const result = await promise;
      expect(result.eventType).toBe('test.event');
      expect(result.source).toBe('source');
    });

    it('should timeout waiting for event', async () => {
      const promise = eventSystem.waitForEvent('test.event', undefined, 10);

      await expect(promise).rejects.toThrow('Timeout waiting for event: test.event');
    });

    it('should wait for event with predicate', async () => {
      const promise = eventSystem.waitForEvent(
        'test.event',
        (event) => event.data?.value === 'correct',
        100
      );

      // Emit wrong event
      setTimeout(() => {
        const wrongEvent = new GameEvent('test.event', 'source', undefined, { value: 'wrong' });
        eventSystem.emit(wrongEvent);
      }, 10);

      // Emit correct event
      setTimeout(() => {
        const correctEvent = new GameEvent('test.event', 'source', undefined, { value: 'correct' });
        eventSystem.emit(correctEvent);
      }, 20);

      const result = await promise;
      expect(result.data.value).toBe('correct');
    });
  });

  describe('EventTypes', () => {
    let eventSystem: EventSystem;

    beforeEach(() => {
      eventSystem = new EventSystem();
    });

    it('should define all standard event types', () => {
      expect(EventTypes.ENTITY_CREATED).toBe('entity.created');
      expect(EventTypes.PLAYER_JOINED).toBe('player.joined');
      expect(EventTypes.GAME_STARTED).toBe('game.started');
      expect(EventTypes.PLUGIN_LOADED).toBe('plugin.loaded');
      expect(EventTypes.ROOM_ENTERED).toBe('room.entered');
      expect(EventTypes.COMBAT_STARTED).toBe('combat.started');
    });

    it('should work with event system', async () => {
      const handler = vi.fn();
      eventSystem.on(EventTypes.PLAYER_JOINED, handler);

      const event = new GameEvent(EventTypes.PLAYER_JOINED, 'player1');
      await eventSystem.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
    });
  });

  describe('Event System Integration', () => {
    let eventSystem: EventSystem;

    beforeEach(() => {
      eventSystem = new EventSystem();
    });

    it('should handle complex event flow', async () => {
      const events: string[] = [];

      // Register multiple handlers for different events
      eventSystem.on('player.joined', (event) => {
        events.push(`Player ${event.source} joined`);
      });

      eventSystem.on('player.moved', (event) => {
        events.push(`Player ${event.source} moved to ${event.data.room}`);
      });

      eventSystem.on('combat.started', (event) => {
        events.push(`Combat started between ${event.source} and ${event.target}`);
      });

      // Emit events
      await eventSystem.emit(new GameEvent('player.joined', 'player1'));
      await eventSystem.emit(new GameEvent('player.moved', 'player1', undefined, { room: 'room1' }));
      await eventSystem.emit(new GameEvent('combat.started', 'player1', 'monster1'));

      expect(events).toEqual([
        'Player player1 joined',
        'Player player1 moved to room1',
        'Combat started between player1 and monster1'
      ]);
    });

    it('should handle event chains', async () => {
      let chainCount = 0;

      // Handler that emits another event
      eventSystem.on('chain.start', async (event) => {
        chainCount++;
        if (chainCount < 3) {
          await eventSystem.emit(new GameEvent('chain.continue', event.source));
        }
      });

      eventSystem.on('chain.continue', async (event) => {
        chainCount++;
        if (chainCount < 3) {
          await eventSystem.emit(new GameEvent('chain.start', event.source));
        }
      });

      await eventSystem.emit(new GameEvent('chain.start', 'test'));

      // Give time for all async events to process
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(chainCount).toBe(3);
    });
  });
});
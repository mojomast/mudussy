import { EventEmitter } from 'events';
import { ILogger } from './logger';

/**
 * Event data interface
 */
export interface IEventData {
  eventType: string;
  source: string;
  target?: string;
  data?: any;
  timestamp: Date;
}

/**
 * Base event class
 */
export class GameEvent implements IEventData {
  public eventType: string;
  public source: string;
  public target?: string;
  public data?: any;
  public timestamp: Date;

  constructor(
    eventType: string,
    source: string,
    target?: string,
    data?: any
  ) {
    this.eventType = eventType;
    this.source = source;
    this.target = target;
    this.data = data;
    this.timestamp = new Date();
  }

  /**
   * Convert event to JSON
   */
  toJSON(): object {
    return {
      eventType: this.eventType,
      source: this.source,
      target: this.target,
      data: this.data,
      timestamp: this.timestamp.toISOString()
    };
  }
}

/**
 * Event handler function type
 */
export type EventHandler = (event: GameEvent) => void | Promise<void>;

/**
 * Event system for managing game events
 */
export class EventSystem {
  private emitter: EventEmitter;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventHistory: GameEvent[] = [];
  private maxHistorySize: number;
  private logger?: ILogger;

  constructor(logger?: ILogger, maxHistorySize: number = 1000) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Increase limit for game events
    this.maxHistorySize = maxHistorySize;
    this.logger = logger;
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(event: GameEvent): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift(); // Remove oldest event
    }

  // Emit to Node.js EventEmitter (fire-and-forget for external listeners)
  this.emitter.emit(event.eventType, event);

    // Call registered handlers
    const handlers = this.handlers.get(event.eventType);
    if (handlers) {
  // Execute handlers sequentially and await any returned promises to allow nested emit chains
  for (const handler of Array.from(handlers)) {
        try {
          await handler(event);
        } catch (error) {
          this.logger?.error(`Error in event handler for ${event.eventType}:`, error);
        }
      }
    }
  }

  /**
   * Register an event handler
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  /**
   * Remove an event handler
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Register a one-time event handler
   */
  once(eventType: string, handler: EventHandler): void {
    const onceHandler = async (event: GameEvent) => {
      await handler(event);
      this.off(eventType, onceHandler);
    };
    this.on(eventType, onceHandler);
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler count for an event type
   */
  getHandlerCount(eventType: string): number {
    const handlers = this.handlers.get(eventType);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get recent events from history
   */
  getRecentEvents(count: number = 10): GameEvent[] {
  // Return newest-first ordering as many UIs expect most recent events first
  return this.eventHistory.slice(-count).reverse();
  }

  /**
   * Get events by type from history
   */
  getEventsByType(eventType: string, count: number = 10): GameEvent[] {
    return this.eventHistory
      .filter(event => event.eventType === eventType)
      .slice(-count)
      .reverse();
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get event statistics
   */
  getStatistics(): object {
    const stats = {
      totalEvents: this.eventHistory.length,
      registeredTypes: this.getRegisteredEventTypes(),
      handlerCounts: {} as Record<string, number>,
      recentActivity: this.getRecentEvents(5).map(event => ({
        type: event.eventType,
        source: event.source,
        timestamp: event.timestamp.toISOString()
      }))
    };

    for (const eventType of stats.registeredTypes) {
      stats.handlerCounts[eventType] = this.getHandlerCount(eventType);
    }

    return stats;
  }

  /**
   * Wait for a specific event with timeout
   */
  waitForEvent(
    eventType: string,
    predicate?: (event: GameEvent) => boolean,
    timeout: number = 5000
  ): Promise<GameEvent> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off(eventType, handler);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const handler = (event: GameEvent) => {
        if (!predicate || predicate(event)) {
          clearTimeout(timeoutId);
          this.off(eventType, handler);
          resolve(event);
        }
      };

      this.on(eventType, handler);
    });
  }
}

/**
 * Predefined event types
 */
export const EventTypes = {
  // Entity events
  ENTITY_CREATED: 'entity.created',
  ENTITY_UPDATED: 'entity.updated',
  ENTITY_DESTROYED: 'entity.destroyed',

  // Player events
  PLAYER_JOINED: 'player.joined',
  PLAYER_LEFT: 'player.left',
  PLAYER_MOVED: 'player.moved',
  PLAYER_MESSAGE: 'player.message',

  // Game events
  GAME_STARTED: 'game.started',
  GAME_ENDED: 'game.ended',
  GAME_TICK: 'game.tick',

  // Plugin events
  PLUGIN_LOADED: 'plugin.loaded',
  PLUGIN_UNLOADED: 'plugin.unloaded',
  PLUGIN_ERROR: 'plugin.error',

  // World events
  ROOM_ENTERED: 'room.entered',
  ROOM_LEFT: 'room.left',
  WORLD_UPDATED: 'world.updated',

  // Combat events
  COMBAT_STARTED: 'combat.started',
  COMBAT_ENDED: 'combat.ended',
  DAMAGE_DEALT: 'damage.dealt',
  HEALING_RECEIVED: 'healing.received'
} as const;
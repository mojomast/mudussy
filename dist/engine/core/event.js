"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypes = exports.EventSystem = exports.GameEvent = void 0;
const events_1 = require("events");
class GameEvent {
    constructor(eventType, source, target, data) {
        this.eventType = eventType;
        this.source = source;
        this.target = target;
        this.data = data;
        this.timestamp = new Date();
    }
    toJSON() {
        return {
            eventType: this.eventType,
            source: this.source,
            target: this.target,
            data: this.data,
            timestamp: this.timestamp.toISOString()
        };
    }
}
exports.GameEvent = GameEvent;
class EventSystem {
    constructor(logger, maxHistorySize = 1000) {
        this.handlers = new Map();
        this.eventHistory = [];
        this.emitter = new events_1.EventEmitter();
        this.emitter.setMaxListeners(100);
        this.maxHistorySize = maxHistorySize;
        this.logger = logger;
    }
    async emit(event) {
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
        this.emitter.emit(event.eventType, event);
        const handlers = this.handlers.get(event.eventType);
        if (handlers) {
            for (const handler of Array.from(handlers)) {
                try {
                    await handler(event);
                }
                catch (error) {
                    this.logger?.error(`Error in event handler for ${event.eventType}:`, error);
                }
            }
        }
    }
    on(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType).add(handler);
    }
    off(eventType, handler) {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlers.delete(eventType);
            }
        }
    }
    once(eventType, handler) {
        const onceHandler = async (event) => {
            await handler(event);
            this.off(eventType, onceHandler);
        };
        this.on(eventType, onceHandler);
    }
    getRegisteredEventTypes() {
        return Array.from(this.handlers.keys());
    }
    getHandlerCount(eventType) {
        const handlers = this.handlers.get(eventType);
        return handlers ? handlers.size : 0;
    }
    getRecentEvents(count = 10) {
        return this.eventHistory.slice(-count).reverse();
    }
    getEventsByType(eventType, count = 10) {
        return this.eventHistory
            .filter(event => event.eventType === eventType)
            .slice(-count)
            .reverse();
    }
    clearHistory() {
        this.eventHistory = [];
    }
    getStatistics() {
        const stats = {
            totalEvents: this.eventHistory.length,
            registeredTypes: this.getRegisteredEventTypes(),
            handlerCounts: {},
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
    waitForEvent(eventType, predicate, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.off(eventType, handler);
                reject(new Error(`Timeout waiting for event: ${eventType}`));
            }, timeout);
            const handler = (event) => {
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
exports.EventSystem = EventSystem;
exports.EventTypes = {
    ENTITY_CREATED: 'entity.created',
    ENTITY_UPDATED: 'entity.updated',
    ENTITY_DESTROYED: 'entity.destroyed',
    PLAYER_JOINED: 'player.joined',
    PLAYER_LEFT: 'player.left',
    PLAYER_MOVED: 'player.moved',
    PLAYER_MESSAGE: 'player.message',
    GAME_STARTED: 'game.started',
    GAME_ENDED: 'game.ended',
    GAME_TICK: 'game.tick',
    PLUGIN_LOADED: 'plugin.loaded',
    PLUGIN_UNLOADED: 'plugin.unloaded',
    PLUGIN_ERROR: 'plugin.error',
    ROOM_ENTERED: 'room.entered',
    ROOM_LEFT: 'room.left',
    WORLD_UPDATED: 'world.updated',
    COMBAT_STARTED: 'combat.started',
    COMBAT_ENDED: 'combat.ended',
    DAMAGE_DEALT: 'damage.dealt',
    HEALING_RECEIVED: 'healing.received'
};
//# sourceMappingURL=event.js.map
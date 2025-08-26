import { ILogger } from './logger';
export interface IEventData {
    eventType: string;
    source: string;
    target?: string;
    data?: any;
    timestamp: Date;
}
export declare class GameEvent implements IEventData {
    eventType: string;
    source: string;
    target?: string;
    data?: any;
    timestamp: Date;
    constructor(eventType: string, source: string, target?: string, data?: any);
    toJSON(): object;
}
export type EventHandler = (event: GameEvent) => void | Promise<void>;
export declare class EventSystem {
    private emitter;
    private handlers;
    private eventHistory;
    private maxHistorySize;
    private logger?;
    constructor(logger?: ILogger, maxHistorySize?: number);
    emit(event: GameEvent): Promise<void>;
    on(eventType: string, handler: EventHandler): void;
    off(eventType: string, handler: EventHandler): void;
    once(eventType: string, handler: EventHandler): void;
    getRegisteredEventTypes(): string[];
    getHandlerCount(eventType: string): number;
    getRecentEvents(count?: number): GameEvent[];
    getEventsByType(eventType: string, count?: number): GameEvent[];
    clearHistory(): void;
    getStatistics(): object;
    waitForEvent(eventType: string, predicate?: (event: GameEvent) => boolean, timeout?: number): Promise<GameEvent>;
}
export declare const EventTypes: {
    readonly ENTITY_CREATED: "entity.created";
    readonly ENTITY_UPDATED: "entity.updated";
    readonly ENTITY_DESTROYED: "entity.destroyed";
    readonly PLAYER_JOINED: "player.joined";
    readonly PLAYER_LEFT: "player.left";
    readonly PLAYER_MOVED: "player.moved";
    readonly PLAYER_MESSAGE: "player.message";
    readonly GAME_STARTED: "game.started";
    readonly GAME_ENDED: "game.ended";
    readonly GAME_TICK: "game.tick";
    readonly PLUGIN_LOADED: "plugin.loaded";
    readonly PLUGIN_UNLOADED: "plugin.unloaded";
    readonly PLUGIN_ERROR: "plugin.error";
    readonly ROOM_ENTERED: "room.entered";
    readonly ROOM_LEFT: "room.left";
    readonly WORLD_UPDATED: "world.updated";
    readonly COMBAT_STARTED: "combat.started";
    readonly COMBAT_ENDED: "combat.ended";
    readonly DAMAGE_DEALT: "damage.dealt";
    readonly HEALING_RECEIVED: "healing.received";
};

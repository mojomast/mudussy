import { EventEmitter } from 'events';
import { EventSystem } from '../../core/event';
import { Player } from './player';
export declare class PlayerManager extends EventEmitter {
    private eventSystem;
    private logger;
    private activePlayers;
    constructor(eventSystem: EventSystem, logger?: any);
    private setupEventHandlers;
    addPlayer(sessionId: string, player: Player): void;
    getPlayerBySessionId(sessionId: string): Player | undefined;
    getPlayerByUsername(username: string): Player | undefined;
    removePlayerBySessionId(sessionId: string): boolean;
    getAllActivePlayers(): Player[];
    getAllActiveSessionIds(): string[];
    hasActivePlayer(sessionId: string): boolean;
    getPlayerCount(): number;
    createPlayer(sessionId: string, username: string, initialRoomId?: string): Player;
    loadPlayer(sessionId: string, playerData: any): Player;
    getStatistics(): any;
    cleanup(): void;
}

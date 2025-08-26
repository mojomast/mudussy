import { WorldManager } from '../../engine/modules/world/world-manager';
import { PlayerManager } from '../../engine/modules/persistence/player-manager';
export interface WorldData {
    name: string;
    description: string;
    rooms: RoomData[];
    players: PlayerData[];
}
export interface RoomData {
    id: string;
    name: string;
    description: string;
    exits: string[];
    players: string[];
}
export interface PlayerData {
    id: string;
    name: string;
    location: string;
    status: 'online' | 'offline';
}
export declare class WorldController {
    private readonly worldManager;
    private readonly playerManager;
    constructor(worldManager: WorldManager, playerManager: PlayerManager);
    getWorldData(): Promise<WorldData>;
    getRooms(): Promise<RoomData[]>;
    getRoom(roomId: string): Promise<RoomData | {
        error: string;
    }>;
    getPlayers(): Promise<PlayerData[]>;
    getPlayer(playerId: string): Promise<PlayerData | {
        error: string;
    }>;
    getWorldStats(): Promise<{
        totalPlayers: number;
        activePlayers: number;
        totalRooms: number;
        uptime: string;
    }>;
}

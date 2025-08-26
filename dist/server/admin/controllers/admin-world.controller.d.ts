export interface Room {
    id: string;
    name: string;
    description: string;
    exits: {
        [direction: string]: string;
    };
    npcs: string[];
    items: string[];
    players: string[];
    coordinates?: {
        x: number;
        y: number;
        z: number;
    };
}
export interface NPC {
    id: string;
    name: string;
    description: string;
    location: string;
    template: string;
    dialogueTree?: string;
    stats: {
        health: number;
        level: number;
        aggression: 'friendly' | 'neutral' | 'hostile';
    };
}
export interface WorldSector {
    id: string;
    name: string;
    description: string;
    rooms: Room[];
    npcs: NPC[];
    items: any[];
}
export declare class AdminWorldController {
    constructor();
    getWorldOverview(): Promise<{
        totalRooms: number;
        totalNPCs: number;
        totalItems: number;
        activePlayers: number;
        sectors: WorldSector[];
    }>;
    getAllRooms(): Promise<Room[]>;
    getRoom(roomId: string): Promise<Room | {
        error: string;
    }>;
    createRoom(roomData: Omit<Room, 'id'>): Promise<{
        success: boolean;
        room?: Room;
        message: string;
    }>;
    updateRoom(roomId: string, roomData: Partial<Room>): Promise<{
        success: boolean;
        room?: Room;
        message: string;
    }>;
    deleteRoom(roomId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllNPCs(): Promise<NPC[]>;
    moveNPC(moveData: {
        npcId: string;
        newLocation: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getWorldSectors(): Promise<WorldSector[]>;
    getAllItems(): Promise<any[]>;
    createItem(itemData: any): Promise<{
        success: boolean;
        item?: any;
        message: string;
    }>;
    moveItem(moveData: {
        itemId: string;
        fromRoomId: string;
        toRoomId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteItem(itemId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

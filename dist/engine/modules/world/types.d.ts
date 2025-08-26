export interface IWorldConfig {
    defaultRoomId: string;
    maxItemsPerRoom: number;
    maxPlayersPerRoom: number;
    allowRoomCreation: boolean;
    contentPath: string;
}
export interface IRoom {
    id: string;
    name: string;
    description: string;
    area: string;
    exits: IExit[];
    items: string[];
    npcs: string[];
    players: string[];
    flags: string[];
    created: Date;
    updated: Date;
}
export interface IExit {
    id: string;
    direction: string;
    toRoomId: string;
    description?: string;
    verbs: string[];
    requirements?: IRequirement[];
    flags: string[];
}
export interface IRequirement {
    type: 'level' | 'item' | 'flag' | 'quest' | 'skill';
    target: string;
    value?: any;
    message?: string;
}
export interface IItem {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    type: 'weapon' | 'armor' | 'consumable' | 'key' | 'misc';
    portable: boolean;
    container: boolean;
    maxItems?: number;
    containedItems?: string[];
    stats: Record<string, any>;
    flags: string[];
    created: Date;
    updated: Date;
}
export interface INPC {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    roomId: string;
    dialogueProvider: string;
    behaviors: string[];
    stats: Record<string, any>;
    flags: string[];
    created: Date;
    updated: Date;
}
export interface INPCSpawnData {
    npcId: string;
    filePath?: string;
    spawnRoomId: string;
    sectorId: string;
    spawnConditions?: INPCSpawnCondition[];
    despawnConditions?: INPCDespawnCondition[];
}
export interface INPCSpawnCondition {
    type: 'player_enter' | 'player_leave' | 'time' | 'event';
    value?: any;
    operator?: 'equals' | 'greater_than' | 'less_than' | 'contains';
}
export interface INPCDespawnCondition {
    type: 'no_players' | 'time' | 'event' | 'room_empty';
    value?: any;
    delay?: number;
}
export interface INPCData {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    dialogueProvider: string;
    behaviors: string[];
    stats: Record<string, any>;
    flags: string[];
    spawnData: INPCSpawnData;
    metadata: {
        version: string;
        created: Date;
        updated: Date;
        author?: string;
    };
}
export interface IArea {
    id: string;
    name: string;
    description: string;
    rooms: string[];
    flags: string[];
    created: Date;
    updated: Date;
}
export interface IWorldData {
    sectors?: string[];
    areas: IArea[];
    rooms: IRoom[];
    items: IItem[];
    npcs: INPC[];
    npcFiles?: string[];
    metadata: {
        version: string;
        created: Date;
        updated: Date;
        author?: string;
        description?: string;
    };
}
export declare enum WorldEventTypes {
    ROOM_ENTERED = "world.room.entered",
    ROOM_LEFT = "world.room.left",
    ITEM_TAKEN = "world.item.taken",
    ITEM_DROPPED = "world.item.dropped",
    NPC_SPAWNED = "world.npc.spawned",
    NPC_DESPAWNED = "world.npc.despawned",
    WORLD_LOADED = "world.loaded",
    WORLD_SAVED = "world.saved"
}
export declare const DirectionMap: {
    readonly north: "south";
    readonly south: "north";
    readonly east: "west";
    readonly west: "east";
    readonly up: "down";
    readonly down: "up";
    readonly northeast: "southwest";
    readonly northwest: "southeast";
    readonly southeast: "northwest";
    readonly southwest: "northeast";
    readonly in: "out";
    readonly out: "in";
};
export declare const DirectionAliases: {
    readonly n: "north";
    readonly s: "south";
    readonly e: "east";
    readonly w: "west";
    readonly u: "up";
    readonly d: "down";
    readonly ne: "northeast";
    readonly nw: "northwest";
    readonly se: "southeast";
    readonly sw: "southwest";
};

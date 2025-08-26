/**
 * World module types and interfaces
 */

import { BaseEntity } from '../../core/entity';

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
  items: string[]; // Item IDs
  npcs: string[]; // NPC IDs
  players: string[]; // Player IDs (session IDs)
  flags: string[];
  created: Date;
  updated: Date;
}

export interface IExit {
  id: string;
  direction: string;
  toRoomId: string;
  description?: string;
  verbs: string[]; // Alternative command words
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
  dialogueProvider: string; // Reference to dialogue provider
  behaviors: string[];
  stats: Record<string, any>;
  flags: string[];
  created: Date;
  updated: Date;
}

export interface INPCSpawnData {
  npcId: string;
  filePath?: string; // Path to individual NPC file
  spawnRoomId: string;
  sectorId: string; // Reference to the sector this NPC belongs to
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
  delay?: number; // Delay in milliseconds before despawning
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
  rooms: string[]; // Room IDs
  flags: string[];
  created: Date;
  updated: Date;
}

export interface IWorldData {
  sectors?: string[]; // Optional sector file paths
  areas: IArea[];
  rooms: IRoom[];
  items: IItem[];
  npcs: INPC[];
  npcFiles?: string[]; // Optional individual NPC file paths
  metadata: {
    version: string;
    created: Date;
    updated: Date;
    author?: string;
    description?: string;
  };
}

export enum WorldEventTypes {
  ROOM_ENTERED = 'world.room.entered',
  ROOM_LEFT = 'world.room.left',
  ITEM_TAKEN = 'world.item.taken',
  ITEM_DROPPED = 'world.item.dropped',
  NPC_SPAWNED = 'world.npc.spawned',
  NPC_DESPAWNED = 'world.npc.despawned',
  WORLD_LOADED = 'world.loaded',
  WORLD_SAVED = 'world.saved'
}

export const DirectionMap = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
  up: 'down',
  down: 'up',
  northeast: 'southwest',
  northwest: 'southeast',
  southeast: 'northwest',
  southwest: 'northeast',
  in: 'out',
  out: 'in'
} as const;

export const DirectionAliases = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  u: 'up',
  d: 'down',
  ne: 'northeast',
  nw: 'northwest',
  se: 'southeast',
  sw: 'southwest'
} as const;
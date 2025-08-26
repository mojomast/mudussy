/**
 * World Manager - handles world data, rooms, items, and NPCs
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { GameEvent, EventSystem } from '../../core/event';
import {
  IWorldData,
  IRoom,
  IExit,
  IItem,
  INPC,
  IArea,
  IWorldConfig,
  WorldEventTypes,
  DirectionMap,
  DirectionAliases
} from './types';
import { NPCManager } from './npc-manager';
import { PlayerManager } from '../persistence/player-manager';

export class WorldManager extends EventEmitter {
  private eventSystem: EventSystem;
  private config: IWorldConfig;
  private worldData: IWorldData;
  private logger: any;
  private npcManager: NPCManager;
  private playerManager?: PlayerManager;

  // Fast lookup maps
  private rooms: Map<string, IRoom> = new Map();
  private items: Map<string, IItem> = new Map();
  private npcs: Map<string, INPC> = new Map();
  private areas: Map<string, IArea> = new Map();

  constructor(eventSystem: EventSystem, config: IWorldConfig, logger?: any, playerManager?: PlayerManager) {
    super();
    this.eventSystem = eventSystem;
    this.config = config;
    this.logger = logger || console;
    this.worldData = this.createEmptyWorld();
    this.npcManager = new NPCManager(eventSystem, logger);
    this.playerManager = playerManager;

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Provide or update the PlayerManager reference (used for mapping session IDs to usernames)
   */
  setPlayerManager(playerManager: PlayerManager): void {
    this.playerManager = playerManager;
  }

  /**
   * Create an empty world structure
   */
  private createEmptyWorld(): IWorldData {
    return {
      sectors: [],
      areas: [],
      rooms: [],
      items: [],
      npcs: [],
      metadata: {
        version: '1.0.0',
        created: new Date(),
        updated: new Date()
      }
    };
  }

  /**
   * Merge sector data into the main world data
   */
  private mergeSectorData(sectorData: Partial<IWorldData>): void {
    if (sectorData.areas) {
      this.worldData.areas.push(...sectorData.areas);
    }
    if (sectorData.rooms) {
      this.worldData.rooms.push(...sectorData.rooms);
    }
    if (sectorData.items) {
      this.worldData.items.push(...sectorData.items);
    }
    if (sectorData.npcs) {
      this.worldData.npcs.push(...sectorData.npcs);
    }
    if (sectorData.npcFiles) {
      if (!this.worldData.npcFiles) {
        this.worldData.npcFiles = [];
      }
      this.worldData.npcFiles.push(...sectorData.npcFiles);
    }
  }

  /**
   * Load world data from YAML or JSON files
   */
  async loadWorld(worldPath?: string): Promise<void> {
    const contentPath = worldPath || this.config.contentPath;

    try {
      this.logger.log(`Loading world from: ${contentPath}`);

      // Load world data (try JSON first, then YAML)
      const worldFile = path.join(contentPath, 'world.json');
      const worldYamlFile = path.join(contentPath, 'world.yaml');

      let data: IWorldData;

      if (fs.existsSync(worldFile)) {
        const content = fs.readFileSync(worldFile, 'utf8');
        data = JSON.parse(content);
      } else if (fs.existsSync(worldYamlFile)) {
        // TODO: Add YAML support with js-yaml
        throw new Error('YAML support not implemented yet');
      } else {
        throw new Error(`No world file found at ${contentPath}`);
      }

      // Initialize base world data first so sector merges append correctly
      // Ensure required arrays exist to avoid undefined pushes
      this.worldData = {
        ...data,
        areas: data.areas || [],
        rooms: data.rooms || [],
        items: data.items || [],
        npcs: data.npcs || [],
        npcFiles: data.npcFiles || []
      };

      // Load sector files if specified (append into this.worldData)
      if (data.sectors && data.sectors.length > 0) {
        this.logger.log(`Loading ${data.sectors.length} sectors...`);
        for (const sectorPath of data.sectors) {
          const fullSectorPath = path.join(contentPath, sectorPath);
          if (fs.existsSync(fullSectorPath)) {
            const sectorContent = fs.readFileSync(fullSectorPath, 'utf8');
            const sectorData = JSON.parse(sectorContent);
            this.mergeSectorData(sectorData);
            this.logger.log(`Loaded sector: ${sectorPath}`);
          } else {
            this.logger.warn(`Sector file not found: ${fullSectorPath}`);
          }
        }
      }

      // Load NPC files if specified
      if (data.npcFiles && data.npcFiles.length > 0) {
        this.logger.log(`Loading ${data.npcFiles.length} NPC files...`);
        for (const npcPath of data.npcFiles) {
          const fullNPCPath = path.join(contentPath, npcPath);
          if (fs.existsSync(fullNPCPath)) {
            await this.npcManager.loadNPC(fullNPCPath);
          } else {
            this.logger.warn(`NPC file not found: ${fullNPCPath}`);
          }
        }
      }

  // Build lookup maps from the combined world data
  this.buildLookupMaps();

      // Emit world loaded event
      const npcStats = this.npcManager.getStatistics();
      this.eventSystem.emit(new GameEvent(
        WorldEventTypes.WORLD_LOADED,
        'world',
        undefined,
        {
          roomCount: this.rooms.size,
          itemCount: this.items.size,
          legacyNpcCount: this.npcs.size,
          npcDefinitionCount: npcStats.totalDefinitions,
          areaCount: this.areas.size
        }
      ));

      this.logger.log(`World loaded: ${this.rooms.size} rooms, ${this.items.size} items, ${this.npcs.size} legacy NPCs, ${npcStats.totalDefinitions} NPC definitions`);
    } catch (error) {
      this.logger.error('Failed to load world:', error);
      throw error;
    }
  }

  /**
   * Save world data to file
   */
  async saveWorld(worldPath?: string): Promise<void> {
    const contentPath = worldPath || this.config.contentPath;

    try {
      // Update metadata
      this.worldData.metadata.updated = new Date();

      // Convert maps back to arrays
      this.worldData.rooms = Array.from(this.rooms.values());
      this.worldData.items = Array.from(this.items.values());
      this.worldData.npcs = Array.from(this.npcs.values());
      this.worldData.areas = Array.from(this.areas.values());

      // Ensure directory exists
      if (!fs.existsSync(contentPath)) {
        fs.mkdirSync(contentPath, { recursive: true });
      }

      // Save as JSON
      const worldFile = path.join(contentPath, 'world.json');
      fs.writeFileSync(worldFile, JSON.stringify(this.worldData, null, 2), 'utf8');

      // Emit world saved event
      this.eventSystem.emit(new GameEvent(
        WorldEventTypes.WORLD_SAVED,
        'world',
        undefined,
        { path: worldFile }
      ));

      this.logger.log(`World saved to: ${worldFile}`);
    } catch (error) {
      this.logger.error('Failed to save world:', error);
      throw error;
    }
  }

  /**
   * Build fast lookup maps from world data
   */
  private buildLookupMaps(): void {
    this.rooms.clear();
    this.items.clear();
    this.npcs.clear();
    this.areas.clear();

    // Build room map
    for (const room of this.worldData.rooms) {
      // Normalize optional arrays for safety when loading external JSON
      (room as any).exits = room.exits || [];
      (room as any).items = room.items || [];
      (room as any).npcs = room.npcs || [];
      (room as any).players = room.players || [];
      this.rooms.set(room.id, room);
    }

    // Build item map
    for (const item of this.worldData.items) {
      this.items.set(item.id, item);
    }

    // Build NPC map
    for (const npc of this.worldData.npcs) {
      this.npcs.set(npc.id, npc);
    }

    // Build area map
    for (const area of this.worldData.areas) {
      this.areas.set(area.id, area);
    }
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): IRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get all rooms
   */
  getAllRooms(): IRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): IItem | undefined {
    return this.items.get(itemId);
  }

  /**
   * Get all items
   */
  getAllItems(): IItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get items in a specific room
   */
  getItemsInRoom(roomId: string): IItem[] {
    const room = this.getRoom(roomId);
    if (!room) return [];

    return room.items
      .map(itemId => this.getItem(itemId))
      .filter((item): item is IItem => item !== undefined);
  }

  /**
   * Get NPC by ID
   */
  getNPC(npcId: string): INPC | undefined {
    return this.npcs.get(npcId);
  }

  /**
   * Get all NPCs
   */
  getAllNPCs(): INPC[] {
    return Array.from(this.npcs.values());
  }

  /**
   * Get NPCs in a specific room
   */
  getNPCsInRoom(roomId: string): INPC[] {
    const room = this.getRoom(roomId);
    if (!room) return [];

    // Get legacy NPCs from the room
    const legacyNPCs = room.npcs
      .map(npcId => this.getNPC(npcId))
      .filter((npc): npc is INPC => npc !== undefined);

    // Get active NPCs from the NPCManager
    const activeNPCs = this.npcManager.getNPCsInRoom(roomId);

    // Combine both sources
    return [...legacyNPCs, ...activeNPCs];
  }

  /**
   * Get players in a specific room
   */
  getPlayersInRoom(roomId: string): string[] {
    const room = this.getRoom(roomId);
    return room ? room.players : [];
  }

  /**
   * Move player to a different room
   */
  movePlayer(playerId: string, fromRoomId: string, toRoomId: string): boolean {
    const fromRoom = this.getRoom(fromRoomId);
    const toRoom = this.getRoom(toRoomId);

    if (!fromRoom || !toRoom) return false;

    // Remove from old room
    fromRoom.players = fromRoom.players.filter(id => id !== playerId);

    // Add to new room
    if (!toRoom.players.includes(playerId)) {
      toRoom.players.push(playerId);
    }

    // Emit events
    this.eventSystem.emit(new GameEvent(
      WorldEventTypes.ROOM_LEFT,
      'world',
      playerId,
      { fromRoomId, toRoomId }
    ));

    this.eventSystem.emit(new GameEvent(
      WorldEventTypes.ROOM_ENTERED,
      'world',
      playerId,
      { fromRoomId, toRoomId }
    ));

    return true;
  }

  /**
   * Add item to room
   */
  addItemToRoom(itemId: string, roomId: string): boolean {
    const room = this.getRoom(roomId);
    let item = this.getItem(itemId);

    if (!room) return false;

    // If the item does not yet exist in world data, create a minimal stub so it can be placed
    if (!item) {
      item = {
        id: itemId,
        name: itemId,
        description: '',
        type: 'generic',
        flags: [],
        created: new Date(),
        updated: new Date()
      } as any;
      this.items.set(itemId, item);
      this.worldData.items.push(item);
    }

    if (!room.items.includes(itemId)) {
      room.items.push(itemId);
      return true;
    }

    return false;
  }

  /**
   * Remove item from room
   */
  removeItemFromRoom(itemId: string, roomId: string): boolean {
    const room = this.getRoom(roomId);

    if (!room) return false;

    const index = room.items.indexOf(itemId);
    if (index !== -1) {
      room.items.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Create a new room
   */
  createRoom(name: string, description: string, areaId: string = 'default'): IRoom {
    const roomId = uuidv4();
    const room: IRoom = {
      id: roomId,
      name,
      description,
      area: areaId,
      exits: [],
      items: [],
      npcs: [],
      players: [],
      flags: [],
      created: new Date(),
      updated: new Date()
    };

    this.rooms.set(roomId, room);
    this.worldData.rooms.push(room);

    return room;
  }

  /**
   * Create exit between rooms
   */
  createExit(fromRoomId: string, toRoomId: string, direction: string, description?: string): IExit | null {
    const fromRoom = this.getRoom(fromRoomId);
    const toRoom = this.getRoom(toRoomId);

    if (!fromRoom || !toRoom) return null;

    // Check if exit already exists
    const existingExit = fromRoom.exits.find(exit => exit.direction === direction);
    if (existingExit) return null;

    const exitId = uuidv4();
    const exit: IExit = {
      id: exitId,
      direction,
      toRoomId,
      description,
      verbs: [direction],
      flags: []
    };

    fromRoom.exits.push(exit);

    // Create reverse exit if it doesn't exist
    const reverseDirection = DirectionMap[direction as keyof typeof DirectionMap];
    if (reverseDirection) {
      const reverseExit: IExit = {
        id: uuidv4(),
        direction: reverseDirection,
        toRoomId: fromRoomId,
        description,
        verbs: [reverseDirection],
        flags: []
      };
      toRoom.exits.push(reverseExit);
    }

    return exit;
  }

  /**
   * Find exit by direction or verb
   */
  findExit(roomId: string, directionOrVerb: string): IExit | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    // Normalize direction (handle aliases)
    const normalized = DirectionAliases[directionOrVerb as keyof typeof DirectionAliases] || directionOrVerb;

    return room.exits.find(exit =>
      exit.direction === normalized ||
      exit.verbs.includes(normalized)
    ) || null;
  }

  /**
   * Get room description with exits
   */
  getRoomDescription(roomId: string, viewerSessionId?: string): string {
    const room = this.getRoom(roomId);
    if (!room) return 'Room not found.';

    let description = `${room.name}\n\n${room.description}\n\n`;

    // Add exits
    if (room.exits.length > 0) {
      const exitList = room.exits.map(exit => exit.direction).join(', ');
      description += `Exits: ${exitList}\n`;
    } else {
      description += 'There are no obvious exits.\n';
    }

    // Add items
    const items = this.getItemsInRoom(roomId);
    if (items.length > 0) {
      description += '\nItems here:\n';
      items.forEach(item => {
        description += `  ${item.name}\n`;
      });
    }

    // Add NPCs
    const npcs = this.getNPCsInRoom(roomId);
    if (npcs.length > 0) {
      description += '\nYou see:\n';
      npcs.forEach(npc => {
        description += `  ${npc.name}\n`;
      });
    }

    // Add players (excluding the viewer)
    const players = this.getPlayersInRoom(roomId);
    const others = viewerSessionId ? players.filter(p => p !== viewerSessionId) : players;
    if (others.length > 0) {
      description += '\nAlso here:\n';
      others.forEach(sessionId => {
        const name = this.playerManager?.getPlayerBySessionId(sessionId)?.username || `Player ${sessionId}`;
        description += `  ${name}\n`;
      });
    }

    return description;
  }

  /**
   * Validate world data integrity
   */
  validateWorld(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for orphaned rooms (no area)
    for (const room of this.rooms.values()) {
      if (!this.areas.has(room.area)) {
        errors.push(`Room ${room.id} references non-existent area ${room.area}`);
      }
    }

    // Check for broken exits
    for (const room of this.rooms.values()) {
      for (const exit of room.exits) {
        if (!this.rooms.has(exit.toRoomId)) {
          errors.push(`Room ${room.id} has exit to non-existent room ${exit.toRoomId}`);
        }
      }
    }

    // Check for orphaned items
    for (const item of this.items.values()) {
      let found = false;
      for (const room of this.rooms.values()) {
        if (room.items.includes(item.id)) {
          found = true;
          break;
        }
      }
      if (!found) {
        errors.push(`Item ${item.id} is not in any room`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get world statistics
   */
  getStatistics(): any {
    const npcStats = this.npcManager.getStatistics();
    return {
      rooms: this.rooms.size,
      items: this.items.size,
      legacyNpcs: this.npcs.size,
      npcDefinitions: npcStats.totalDefinitions,
      activeNpcs: npcStats.activeNPCs,
      areas: this.areas.size,
      metadata: this.worldData.metadata
    };
  }

  /**
   * Resolve a valid starting room ID using config preference then fallback to first room
   */
  getStartingRoomId(): string | null {
    const preferred = this.config?.defaultRoomId;
    if (preferred && this.rooms.has(preferred)) {
      return preferred;
    }
    const first = this.getAllRooms()[0]?.id;
    return first || null;
  }

  /**
   * Get the NPC manager instance
   */
  getNPCManager(): NPCManager {
    return this.npcManager;
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // Handle room entered events to add players to rooms
    this.eventSystem.on(WorldEventTypes.ROOM_ENTERED, (event) => {
      this.handleRoomEntered(event);
    });

    // Handle room left events to remove players from rooms
    this.eventSystem.on(WorldEventTypes.ROOM_LEFT, (event) => {
      this.handleRoomLeft(event);
    });

    // Admin operations (lightweight handlers for tests)
    this.eventSystem.on('admin.create.room', (event) => {
      const { roomId, name, description } = event.data || {};
      if (!roomId) return;
      if (this.getRoom(roomId)) return; // already exists
      const room = {
        id: roomId,
        name: name ?? roomId,
        description: description ?? '',
        area: 'default',
        exits: [],
        items: [],
        npcs: [],
        players: [],
        flags: [],
        created: new Date(),
        updated: new Date()
      } as any;
      this.rooms.set(roomId, room);
      this.worldData.rooms.push(room);
      this.logger.log(`Admin created room ${roomId}`);
    });

    this.eventSystem.on('admin.set.description', (event) => {
      const { roomId, description } = event.data || {};
      if (!roomId) return;
      const room = this.getRoom(roomId);
      if (room) {
        room.description = description ?? room.description;
        room.updated = new Date();
        this.logger.log(`Admin updated description for ${roomId}`);
      }
    });
  }

  /**
   * Handle room entered events
   */
  private handleRoomEntered(event: GameEvent): void {
    if (!event.data) return;

    const { fromRoomId, toRoomId } = event.data;
  // Player identifier is carried in the event target for world room events
  const playerId = event.target as string;

    // Add player to the new room
    const room = this.getRoom(toRoomId);
    if (room && !room.players.includes(playerId)) {
      room.players.push(playerId);
      this.logger.log(`Player ${playerId} entered room ${toRoomId}`);
    }
  }

  /**
   * Handle room left events
   */
  private handleRoomLeft(event: GameEvent): void {
    if (!event.data) return;

    const { fromRoomId, toRoomId } = event.data;
  // Player identifier is carried in the event target for world room events
  const playerId = event.target as string;

    // Remove player from the old room
    const room = this.getRoom(fromRoomId);
    if (room) {
      room.players = room.players.filter(id => id !== playerId);
      this.logger.log(`Player ${playerId} left room ${fromRoomId}`);
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.npcManager.cleanup();
    this.rooms.clear();
    this.items.clear();
    this.npcs.clear();
    this.areas.clear();
  }
}
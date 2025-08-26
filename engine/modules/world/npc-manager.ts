/**
 * NPC Manager - handles NPC lifecycle, loading, spawning, and despawning
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { GameEvent, EventSystem } from '../../core/event';
import {
  INPC,
  INPCData,
  INPCSpawnData,
  INPCSpawnCondition,
  INPCDespawnCondition,
  WorldEventTypes
} from './types';
import NPCTemplateFactory, { INPCTemplate } from './npc-templates';
import SampleNPCs from './sample-npcs';

export class NPCManager extends EventEmitter {
  private eventSystem: EventSystem;
  private logger: any;

  // NPC data and instances
  private npcDefinitions: Map<string, INPCData> = new Map();
  private activeNPCs: Map<string, INPC> = new Map();
  private roomNPCs: Map<string, Set<string>> = new Map(); // roomId -> Set of NPC IDs

  // Template system
  private npcTemplates: Map<string, INPCTemplate> = new Map();

  // Spawn/despawn timers
  private despawnTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(eventSystem: EventSystem, logger?: any) {
    super();
    this.eventSystem = eventSystem;
    this.logger = logger || console;

    // Listen for room events to handle NPC spawning/despawning
    this.eventSystem.on(WorldEventTypes.ROOM_ENTERED, this.handleRoomEnter.bind(this));
    this.eventSystem.on(WorldEventTypes.ROOM_LEFT, this.handleRoomLeave.bind(this));
  }

  /**
   * Load NPC data from a file
   */
  async loadNPC(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const npcData: INPCData = JSON.parse(content);

      // Parse dates
      npcData.metadata.created = new Date(npcData.metadata.created);
      npcData.metadata.updated = new Date(npcData.metadata.updated);

      this.npcDefinitions.set(npcData.id, npcData);
      this.logger.log(`Loaded NPC: ${npcData.name} (${npcData.id})`);
    } catch (error) {
      this.logger.error(`Failed to load NPC from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Load multiple NPCs from a directory
   */
  async loadNPCsFromDirectory(directoryPath: string): Promise<void> {
    try {
      const files = fs.readdirSync(directoryPath);
      const npcFiles = files.filter(file => file.endsWith('.json'));

      this.logger.log(`Loading ${npcFiles.length} NPCs from ${directoryPath}...`);

      for (const file of npcFiles) {
        const filePath = path.join(directoryPath, file);
        await this.loadNPC(filePath);
      }

      this.logger.log(`Successfully loaded ${npcFiles.length} NPCs`);
    } catch (error) {
      this.logger.error(`Failed to load NPCs from directory ${directoryPath}:`, error);
      throw error;
    }
  }

  /**
   * Spawn an NPC in a specific room
   */
  spawnNPC(npcId: string, roomId: string): INPC | null {
    const npcData = this.npcDefinitions.get(npcId);
    if (!npcData) {
      this.logger.warn(`Cannot spawn NPC ${npcId}: definition not found`);
      return null;
    }

    // Check if NPC is already active
    if (this.activeNPCs.has(npcId)) {
      this.logger.warn(`NPC ${npcId} is already active`);
      return this.activeNPCs.get(npcId)!;
    }

    // Create NPC instance
    const npc: INPC = {
      id: npcId,
      name: npcData.name,
      description: npcData.description,
      shortDescription: npcData.shortDescription,
      roomId: roomId,
      dialogueProvider: npcData.dialogueProvider,
      behaviors: [...npcData.behaviors],
      stats: { ...npcData.stats },
      flags: [...npcData.flags],
      created: new Date(),
      updated: new Date()
    };

    // Add to active NPCs
    this.activeNPCs.set(npcId, npc);

    // Add to room tracking
    if (!this.roomNPCs.has(roomId)) {
      this.roomNPCs.set(roomId, new Set());
    }
    this.roomNPCs.get(roomId)!.add(npcId);

    // Emit spawn event
    this.eventSystem.emit(new GameEvent(
      WorldEventTypes.NPC_SPAWNED,
      'npc',
      npcId,
      {
        npcId,
        roomId,
        npcData: npc
      }
    ));

    this.logger.log(`Spawned NPC: ${npc.name} in room ${roomId}`);
    return npc;
  }

  /**
   * Despawn an NPC from a room
   */
  despawnNPC(npcId: string, delay: number = 0): boolean {
    const npc = this.activeNPCs.get(npcId);
    if (!npc) {
      return false;
    }

    const doDespawn = () => {
      const roomId = npc.roomId;

      // Remove from active NPCs
      this.activeNPCs.delete(npcId);

      // Remove from room tracking
      const roomSet = this.roomNPCs.get(roomId);
      if (roomSet) {
        roomSet.delete(npcId);
        if (roomSet.size === 0) {
          this.roomNPCs.delete(roomId);
        }
      }

      // Clear any existing despawn timer
      const existingTimer = this.despawnTimers.get(npcId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.despawnTimers.delete(npcId);
      }

      // Emit despawn event
      this.eventSystem.emit(new GameEvent(
        WorldEventTypes.NPC_DESPAWNED,
        'npc',
        npcId,
        {
          npcId,
          roomId,
          npcData: npc
        }
      ));

      this.logger.log(`Despawned NPC: ${npc.name} from room ${roomId}`);
    };

    if (delay > 0) {
      // Schedule delayed despawn
      const timer = setTimeout(doDespawn, delay);
      this.despawnTimers.set(npcId, timer);
      return true;
    } else {
      // Despawn immediately
      doDespawn();
      return true;
    }
  }

  /**
   * Handle player entering a room - spawn NPCs
   */
  private handleRoomEnter(event: GameEvent): void {
    const { fromRoomId, toRoomId } = event.data;
    const playerId = event.target;

    // Get NPCs that should spawn in the target room
    const npcsToSpawn = this.getNPCsForRoom(toRoomId);

    for (const npcId of npcsToSpawn) {
      const npcData = this.npcDefinitions.get(npcId);
      if (!npcData) continue;

      // Check spawn conditions
      if (this.checkSpawnConditions(npcData.spawnData, toRoomId, playerId)) {
        this.spawnNPC(npcId, toRoomId);
      }
    }
  }

  /**
   * Handle player leaving a room - potentially despawn NPCs
   */
  private handleRoomLeave(event: GameEvent): void {
    const { fromRoomId, toRoomId } = event.data;

    // Get NPCs in the room the player left
    const roomNPCs = this.roomNPCs.get(fromRoomId);
    if (!roomNPCs || roomNPCs.size === 0) return;

    // Check each NPC's despawn conditions
    for (const npcId of roomNPCs) {
      const npcData = this.npcDefinitions.get(npcId);
      if (!npcData) continue;

      if (this.checkDespawnConditions(npcData.spawnData, fromRoomId)) {
        const delay = npcData.spawnData.despawnConditions?.find(c => c.delay)?.delay || 0;
        this.despawnNPC(npcId, delay);
      }
    }
  }

  /**
   * Get NPCs that should be present in a room
   */
  private getNPCsForRoom(roomId: string): string[] {
    const npcs: string[] = [];

    for (const [npcId, npcData] of this.npcDefinitions) {
      if (npcData.spawnData.spawnRoomId === roomId) {
        npcs.push(npcId);
      }
    }

    return npcs;
  }

  /**
   * Check if spawn conditions are met
   */
  private checkSpawnConditions(spawnData: INPCSpawnData, roomId: string, playerId?: string): boolean {
    if (!spawnData.spawnConditions || spawnData.spawnConditions.length === 0) {
      return true; // No conditions means always spawn
    }

    for (const condition of spawnData.spawnConditions) {
      switch (condition.type) {
        case 'player_enter':
          return true; // Default behavior - spawn when player enters
        case 'time':
          // Could implement time-based conditions
          return true;
        case 'event':
          // Could implement event-based conditions
          return true;
        default:
          return true;
      }
    }

    return true;
  }

  /**
   * Check if despawn conditions are met
   */
  private checkDespawnConditions(spawnData: INPCSpawnData, roomId: string): boolean {
    if (!spawnData.despawnConditions || spawnData.despawnConditions.length === 0) {
      return false; // No conditions means don't despawn
    }

    for (const condition of spawnData.despawnConditions) {
      switch (condition.type) {
        case 'no_players':
          // Check if room has no players (would need world manager integration)
          // For now, assume we want to despawn after a delay
          return true;
        case 'time':
          return true;
        case 'room_empty':
          return true;
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Get active NPC by ID
   */
  getActiveNPC(npcId: string): INPC | undefined {
    return this.activeNPCs.get(npcId);
  }

  /**
   * Get all active NPCs
   */
  getAllActiveNPCs(): INPC[] {
    return Array.from(this.activeNPCs.values());
  }

  /**
   * Get NPCs in a specific room
   */
  getNPCsInRoom(roomId: string): INPC[] {
    const npcIds = this.roomNPCs.get(roomId);
    if (!npcIds) return [];

    return Array.from(npcIds)
      .map(npcId => this.activeNPCs.get(npcId))
      .filter((npc): npc is INPC => npc !== undefined);
  }

  /**
   * Get NPC definition by ID
   */
  getNPCDefinition(npcId: string): INPCData | undefined {
    return this.npcDefinitions.get(npcId);
  }

  /**
   * Get all NPC definitions
   */
  getAllNPCDefinitions(): INPCData[] {
    return Array.from(this.npcDefinitions.values());
  }

  /**
   * Check if an NPC is currently active
   */
  isNPCActive(npcId: string): boolean {
    return this.activeNPCs.has(npcId);
  }

  /**
   * Get NPC statistics
   */
  getStatistics(): any {
    return {
      totalDefinitions: this.npcDefinitions.size,
      activeNPCs: this.activeNPCs.size,
      roomsWithNPCs: this.roomNPCs.size,
      despawnTimers: this.despawnTimers.size
    };
  }

  /**
   * Register an NPC template
   */
  registerTemplate(templateId: string, template: INPCTemplate): void {
    this.npcTemplates.set(templateId, template);
    this.logger.log(`Registered NPC template: ${templateId} (${template.metadata.type})`);
  }

  /**
   * Register multiple templates
   */
  registerTemplates(templates: Record<string, INPCTemplate>): void {
    for (const [templateId, template] of Object.entries(templates)) {
      this.registerTemplate(templateId, template);
    }
  }

  /**
   * Get a registered template
   */
  getTemplate(templateId: string): INPCTemplate | undefined {
    return this.npcTemplates.get(templateId);
  }

  /**
   * Get all registered templates
   */
  getAllTemplates(): INPCTemplate[] {
    return Array.from(this.npcTemplates.values());
  }

  /**
   * Create an NPC from a template
   */
  createNPCFromTemplate(
    templateId: string,
    spawnRoomId: string,
    sectorId: string = 'default',
    customizations?: Partial<INPCData>
  ): INPC | null {
    const template = this.npcTemplates.get(templateId);
    if (!template) {
      this.logger.warn(`Cannot create NPC from template ${templateId}: template not found`);
      return null;
    }

    // Convert template to NPC data
    const npcData = NPCTemplateFactory.templateToNPCData(template, spawnRoomId, sectorId);

    // Apply customizations
    if (customizations) {
      Object.assign(npcData, customizations);
    }

    // Register the NPC data
    this.npcDefinitions.set(npcData.id, npcData);

    // Spawn the NPC
    return this.spawnNPC(npcData.id, spawnRoomId);
  }

  /**
   * Load sample NPCs from templates
   */
  loadSampleNPCs(): void {
    const sampleNPCs = SampleNPCs.getAllSampleNPCs();

    for (const npcData of sampleNPCs) {
      this.npcDefinitions.set(npcData.id, npcData);
      this.logger.log(`Loaded sample NPC: ${npcData.name} (${npcData.id})`);
    }

    this.logger.log(`Loaded ${sampleNPCs.length} sample NPCs`);
  }

  /**
   * Load sample NPCs by type
   */
  loadSampleNPCsByType(type: string): void {
    const sampleNPCs = SampleNPCs.getSampleNPCsByType(type);

    for (const npcData of sampleNPCs) {
      this.npcDefinitions.set(npcData.id, npcData);
      this.logger.log(`Loaded sample ${type} NPC: ${npcData.name} (${npcData.id})`);
    }

    this.logger.log(`Loaded ${sampleNPCs.length} sample ${type} NPCs`);
  }

  /**
   * Create and spawn multiple NPCs from templates
   */
  spawnNPCsFromTemplates(
    templateConfigs: Array<{
      templateId: string;
      spawnRoomId: string;
      sectorId?: string;
      customizations?: Partial<INPCData>;
    }>
  ): INPC[] {
    const spawnedNPCs: INPC[] = [];

    for (const config of templateConfigs) {
      const npc = this.createNPCFromTemplate(
        config.templateId,
        config.spawnRoomId,
        config.sectorId,
        config.customizations
      );

      if (npc) {
        spawnedNPCs.push(npc);
      }
    }

    this.logger.log(`Spawned ${spawnedNPCs.length} NPCs from templates`);
    return spawnedNPCs;
  }

  /**
   * Get template statistics
   */
  getTemplateStatistics(): any {
    const templateTypes: Record<string, number> = {};

    for (const template of this.npcTemplates.values()) {
      const type = template.metadata.type;
      templateTypes[type] = (templateTypes[type] || 0) + 1;
    }

    return {
      totalTemplates: this.npcTemplates.size,
      templatesByType: templateTypes
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clear all despawn timers
    for (const timer of this.despawnTimers.values()) {
      clearTimeout(timer);
    }
    this.despawnTimers.clear();

    // Clear all data
    this.npcDefinitions.clear();
    this.activeNPCs.clear();
    this.roomNPCs.clear();
    this.npcTemplates.clear();
  }
}
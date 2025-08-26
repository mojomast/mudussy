/**
 * World Save System - enhanced world persistence with save/load capabilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { GameEvent, EventSystem } from '../../core/event';
import { WorldManager } from '../world/world-manager';
import { IWorldConfig, IWorldData, WorldEventTypes } from '../world/types';
import {
  IPersistenceConfig,
  ISaveMetadata,
  ISaveFile,
  SaveType,
  ISaveInfo,
  IBackupInfo,
  ISaveValidationResult,
  PersistenceEventTypes,
  IWorldSaveData,
  ISaveSystem
} from './types';

export class WorldSaveSystem extends EventEmitter implements ISaveSystem {
  private config: IPersistenceConfig;
  private eventSystem: EventSystem;
  private logger: any;
  private savePath: string;
  private backupPath: string;
  private worldManager: WorldManager;

  constructor(
    config: IPersistenceConfig,
    eventSystem: EventSystem,
    worldManager: WorldManager,
    logger?: any
  ) {
    super();
    this.config = config;
    this.eventSystem = eventSystem;
    this.logger = logger || console;
    this.savePath = path.join(config.savePath, 'world');
    this.backupPath = path.join(config.backupPath, 'world');
    this.worldManager = worldManager;
  }

  /**
   * Save world data
   */
  async save(data: IWorldSaveData, type: SaveType, description?: string): Promise<string> {
    if (type !== SaveType.WORLD && type !== SaveType.FULL) {
      throw new Error('Invalid save type for world save system');
    }

    const saveId = uuidv4();
    const savePath = path.join(this.savePath, `${saveId}.json`);

    this.logger.log(`💾 Saving world: ${saveId}`);

    try {
      // Create backup if file exists
      if (fs.existsSync(savePath)) {
        await this.createBackup(savePath, 'Auto-backup before save');
      }

      // Get current world data from WorldManager
      const worldData: IWorldSaveData = {
        areas: [],
        rooms: [],
        items: [],
        npcs: [],
        modifiedRooms: {},
        modifiedItems: {},
        modifiedNPCs: {},
        metadata: {
          version: '1.0.0',
          created: new Date(),
          updated: new Date()
        }
      };

      // Use WorldManager's existing save functionality
      await this.worldManager.saveWorld(this.savePath);

      // Read the saved file to get the data for our save system
      const worldFilePath = path.join(this.savePath, 'world.json');
      if (fs.existsSync(worldFilePath)) {
        const content = fs.readFileSync(worldFilePath, 'utf8');
        const baseWorldData = JSON.parse(content);

        // Merge with our enhanced structure
        worldData.areas = baseWorldData.areas || [];
        worldData.rooms = baseWorldData.rooms || [];
        worldData.items = baseWorldData.items || [];
        worldData.npcs = baseWorldData.npcs || [];
        worldData.metadata = baseWorldData.metadata || worldData.metadata;
      }

      // Create save file with enhanced metadata
      const saveFile: ISaveFile = {
        metadata: this.createSaveMetadata(saveId, type, description, worldData),
        data: worldData
      };

      // Write our enhanced save file
      const content = JSON.stringify(saveFile, null, 2);
      fs.writeFileSync(savePath, content, 'utf8');

      this.logger.log(`✅ World saved: ${saveId}`);

      // Emit save event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.SAVE_COMPLETED,
        'world-save-system',
        saveId,
        {
          type,
          path: savePath,
          description,
          roomCount: worldData.rooms.length,
          itemCount: worldData.items.length,
          npcCount: worldData.npcs.length
        }
      ));

      return saveId;
    } catch (error) {
      this.logger.error(`❌ Failed to save world:`, error);
      throw error;
    }
  }

  /**
   * Load world data
   */
  async load(saveId: string): Promise<IWorldSaveData> {
    const savePath = path.join(this.savePath, `${saveId}.json`);

    try {
      if (!fs.existsSync(savePath)) {
        throw new Error(`World save file not found: ${saveId}`);
      }

      const content = fs.readFileSync(savePath, 'utf8');
      const saveFile: ISaveFile = JSON.parse(content);

      // Validate save file
      if (this.config.validateOnLoad) {
        const validation = this.validateSaveFile(saveFile);
        if (!validation.valid) {
          throw new Error(`Save validation failed: ${validation.errors.join(', ')}`);
        }
      }

      const worldData = saveFile.data as IWorldSaveData;

      // Use WorldManager's existing load functionality
      const worldFilePath = path.join(this.savePath, 'world.json');
      fs.writeFileSync(worldFilePath, JSON.stringify({
        areas: worldData.areas,
        rooms: worldData.rooms,
        items: worldData.items,
        npcs: worldData.npcs,
        metadata: worldData.metadata
      }, null, 2));

      await this.worldManager.loadWorld(this.savePath);

      this.logger.log(`📂 World loaded: ${saveId} (${worldData.rooms.length} rooms, ${worldData.items.length} items, ${worldData.npcs.length} NPCs)`);

      // Emit load event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.LOAD_COMPLETED,
        'world-save-system',
        saveId,
        {
          type: SaveType.WORLD,
          path: savePath,
          roomCount: worldData.rooms.length,
          itemCount: worldData.items.length,
          npcCount: worldData.npcs.length
        }
      ));

      return worldData;
    } catch (error) {
      this.logger.error(`❌ Failed to load world ${saveId}:`, error);
      throw error;
    }
  }

  /**
   * Save current world state
   */
  async saveWorldState(saveId: string, description?: string): Promise<string> {
    const worldData: IWorldSaveData = {
      areas: [],
      rooms: [],
      items: [],
      npcs: [],
      modifiedRooms: {},
      modifiedItems: {},
      modifiedNPCs: {},
      metadata: {
        version: '1.0.0',
        created: new Date(),
        updated: new Date()
      }
    };

    return this.save(worldData, SaveType.WORLD, description);
  }

  /**
   * Load world state
   */
  async loadWorldState(saveId: string): Promise<void> {
    await this.load(saveId);
  }

  /**
   * List all world saves
   */
  async listSaves(): Promise<ISaveInfo[]> {
    try {
      const saves: ISaveInfo[] = [];

      if (!fs.existsSync(this.savePath)) {
        return saves;
      }

      const files = fs.readdirSync(this.savePath)
        .filter(file => file.endsWith('.json') && file !== 'world.json') // Exclude the active world.json
        .map(file => path.join(this.savePath, file));

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const saveFile: ISaveFile = JSON.parse(content);

          const stat = fs.statSync(filePath);

          saves.push({
            id: path.basename(filePath, '.json'),
            type: saveFile.metadata.saveType,
            timestamp: new Date(saveFile.metadata.timestamp),
            description: saveFile.metadata.description,
            size: stat.size,
            checksum: saveFile.metadata.checksum
          });
        } catch (error) {
          this.logger.warn(`Failed to read save file ${filePath}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      saves.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return saves;
    } catch (error) {
      this.logger.error('Failed to list world saves:', error);
      return [];
    }
  }

  /**
   * Delete a world save
   */
  async delete(saveId: string): Promise<boolean> {
    const savePath = path.join(this.savePath, `${saveId}.json`);

    try {
      if (fs.existsSync(savePath)) {
        // Create backup before deletion
        await this.createBackup(savePath, 'Backup before deletion');

        fs.unlinkSync(savePath);
        this.logger.log(`🗑️  Deleted world save: ${saveId}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete world save ${saveId}:`, error);
      return false;
    }
  }

  /**
   * Validate a world save
   */
  async validate(saveId: string): Promise<ISaveValidationResult> {
    const savePath = path.join(this.savePath, `${saveId}.json`);

    try {
      if (!fs.existsSync(savePath)) {
        return {
          valid: false,
          errors: ['Save file not found'],
          warnings: [],
          checksumValid: false,
          versionCompatible: false
        };
      }

      const content = fs.readFileSync(savePath, 'utf8');
      const saveFile: ISaveFile = JSON.parse(content);

      return this.validateSaveFile(saveFile);
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate save: ${error.message}`],
        warnings: [],
        checksumValid: false,
        versionCompatible: false
      };
    }
  }

  /**
   * Create a backup of a world save
   */
  async backup(saveId: string, reason: string): Promise<string> {
    const savePath = path.join(this.savePath, `${saveId}.json`);
    return this.createBackup(savePath, reason);
  }

  /**
   * Enhanced world modification tracking
   */
  trackRoomModification(roomId: string, modifications: any): void {
    // TODO: Implement room modification tracking
    this.logger.log(`📝 Tracking modifications for room: ${roomId}`);
  }

  trackItemModification(itemId: string, modifications: any): void {
    // TODO: Implement item modification tracking
    this.logger.log(`📝 Tracking modifications for item: ${itemId}`);
  }

  trackNPCModification(npcId: string, modifications: any): void {
    // TODO: Implement NPC modification tracking
    this.logger.log(`📝 Tracking modifications for NPC: ${npcId}`);
  }

  /**
   * Get modified elements since last save
   */
  getModifiedElements(): any {
    return {
      rooms: {},
      items: {},
      npcs: {},
      lastTracked: new Date()
    };
  }

  /**
   * Reset modification tracking
   */
  resetModificationTracking(): void {
    this.logger.log('🔄 Reset modification tracking');
    // TODO: Clear modification tracking data
  }

  /**
   * Get world statistics
   */
  getWorldStatistics(): any {
    const worldStats = this.worldManager.getStatistics();

    return {
      ...worldStats,
      modifiedRooms: Object.keys(this.getModifiedElements().rooms).length,
      modifiedItems: Object.keys(this.getModifiedElements().items).length,
      modifiedNPCs: Object.keys(this.getModifiedElements().npcs).length,
      lastModified: new Date() // TODO: Track actual last modification
    };
  }

  /**
   * Get save system statistics
   */
  getStatistics(): any {
    try {
      const saves = fs.readdirSync(this.savePath)
        .filter(file => file.endsWith('.json') && file !== 'world.json');

      let totalSize = 0;
      for (const file of saves) {
        const stat = fs.statSync(path.join(this.savePath, file));
        totalSize += stat.size;
      }

      return {
        saveCount: saves.length,
        totalSize,
        averageSize: saves.length > 0 ? totalSize / saves.length : 0,
        worldStatistics: this.getWorldStatistics(),
        lastModified: saves.length > 0 ? fs.statSync(path.join(this.savePath, saves[0])).mtime : null
      };
    } catch (error) {
      this.logger.error('Failed to get world save statistics:', error);
      return {
        saveCount: 0,
        totalSize: 0,
        averageSize: 0,
        worldStatistics: {},
        lastModified: null
      };
    }
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      savePath: this.savePath,
      backupPath: this.backupPath,
      config: this.config,
      statistics: this.getStatistics(),
      worldManagerStatus: this.worldManager.getStatistics()
    };
  }

  /**
   * Create save metadata
   */
  private createSaveMetadata(saveId: string, type: SaveType, description: string | undefined, worldData: IWorldSaveData): ISaveMetadata {
    return {
      version: '1.0.0',
      timestamp: new Date(),
      gameVersion: '1.0.0', // TODO: Get from package.json
      checksum: this.calculateChecksum(worldData),
      compressed: false, // TODO: Implement compression
      saveType: type,
      description
    };
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const content = JSON.stringify(data);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Validate save file
   */
  private validateSaveFile(saveFile: ISaveFile): ISaveValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let checksumValid = true;
    let versionCompatible = true;

    // Check metadata
    if (!saveFile.metadata) {
      errors.push('Missing metadata');
      return { valid: false, errors, warnings, checksumValid: false, versionCompatible: false };
    }

    // Check required fields
    const requiredFields = ['areas', 'rooms', 'items', 'npcs', 'metadata'];
    const worldData = saveFile.data as IWorldSaveData;

    for (const field of requiredFields) {
      if (!(field in worldData)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate world data integrity
    if (worldData.rooms) {
      for (const room of worldData.rooms) {
        if (!room.id || !room.name) {
          errors.push(`Invalid room data: missing id or name`);
          break;
        }
      }
    }

    if (worldData.items) {
      for (const item of worldData.items) {
        if (!item.id || !item.name) {
          errors.push(`Invalid item data: missing id or name`);
          break;
        }
      }
    }

    if (worldData.npcs) {
      for (const npc of worldData.npcs) {
        if (!npc.id || !npc.name) {
          errors.push(`Invalid NPC data: missing id or name`);
          break;
        }
      }
    }

    // Validate checksum
    if (saveFile.metadata.checksum) {
      const calculatedChecksum = this.calculateChecksum(saveFile.data);
      if (calculatedChecksum !== saveFile.metadata.checksum) {
        errors.push('Checksum mismatch - file may be corrupted');
        checksumValid = false;
      }
    }

    // Check version compatibility
    const currentVersion = '1.0.0';
    if (saveFile.metadata.version !== currentVersion) {
      warnings.push(`Save version ${saveFile.metadata.version} may not be fully compatible with current version ${currentVersion}`);
      versionCompatible = false;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checksumValid,
      versionCompatible
    };
  }

  /**
   * Create backup of a save file
   */
  private async createBackup(originalPath: string, reason: string): Promise<string> {
    try {
      if (!fs.existsSync(originalPath)) {
        throw new Error('Original file does not exist');
      }

      // Ensure backup directory exists
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${path.basename(originalPath)}.${timestamp}.bak`;
      const backupPath = path.join(this.backupPath, backupFileName);

      // Copy file to backup location
      fs.copyFileSync(originalPath, backupPath);

      const backupInfo: IBackupInfo = {
        originalPath,
        backupPath,
        timestamp: new Date(),
        reason,
        checksum: this.calculateChecksum(fs.readFileSync(originalPath))
      };

      // Save backup metadata
      const metadataPath = `${backupPath}.meta`;
      fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2), 'utf8');

      this.logger.log(`📦 Created backup: ${backupFileName}`);

      // Emit backup event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.BACKUP_CREATED,
        'world-save-system',
        uuidv4(),
        backupInfo
      ));

      return backupFileName;
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
      throw error;
    }
  }
}
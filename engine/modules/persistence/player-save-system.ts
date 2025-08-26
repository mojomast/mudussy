/**
 * Player Save System - handles player state persistence
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { GameEvent, EventSystem } from '../../core/event';
import {
  IPersistenceConfig,
  ISaveMetadata,
  ISaveFile,
  SaveType,
  ISaveInfo,
  IBackupInfo,
  ISaveValidationResult,
  PersistenceEventTypes,
  IPlayerSaveData,
  ISaveSystem
} from './types';
import { Player } from './player';

export class PlayerSaveSystem extends EventEmitter implements ISaveSystem {
  private config: IPersistenceConfig;
  private eventSystem: EventSystem;
  private logger: any;
  private savePath: string;
  private backupPath: string;

  constructor(config: IPersistenceConfig, eventSystem: EventSystem, logger?: any) {
    super();
    this.config = config;
    this.eventSystem = eventSystem;
    this.logger = logger || console;
    this.savePath = path.join(config.savePath, 'players');
    this.backupPath = path.join(config.backupPath, 'players');
  }

  /**
   * Save a single player
   */
  async save(data: Player, type: SaveType, description?: string): Promise<string> {
    if (type !== SaveType.PLAYERS && type !== SaveType.FULL) {
      throw new Error('Invalid save type for player save system');
    }

    const saveId = uuidv4();
    const playerSaveData = data.toSaveData();
    const savePath = path.join(this.savePath, `${saveId}.json`);

    this.logger.log(`💾 Saving player: ${playerSaveData.username} (${saveId})`);

    try {
      // Create backup if file exists
      if (fs.existsSync(savePath)) {
        await this.createBackup(savePath, 'Auto-backup before save');
      }

      // Create save file
      const saveFile: ISaveFile = {
        metadata: this.createSaveMetadata(saveId, type, description, playerSaveData),
        data: playerSaveData
      };

      // Write to file
      const content = JSON.stringify(saveFile, null, 2);
      fs.writeFileSync(savePath, content, 'utf8');

      this.logger.log(`✅ Player saved: ${playerSaveData.username} (${saveId})`);

      // Emit save event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.SAVE_COMPLETED,
        'player-save-system',
        saveId,
        {
          playerId: playerSaveData.id,
          username: playerSaveData.username,
          type,
          path: savePath
        }
      ));

      return saveId;
    } catch (error) {
      this.logger.error(`❌ Failed to save player ${playerSaveData.username}:`, error);
      throw error;
    }
  }

  /**
   * Load a single player
   */
  async load(saveId: string): Promise<Player> {
    const savePath = path.join(this.savePath, `${saveId}.json`);

    try {
      if (!fs.existsSync(savePath)) {
        throw new Error(`Player save file not found: ${saveId}`);
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

      const playerSaveData = saveFile.data as IPlayerSaveData;
      const player = Player.fromSaveData(playerSaveData);

      this.logger.log(`📂 Player loaded: ${playerSaveData.username} (${saveId})`);

      // Emit load event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.LOAD_COMPLETED,
        'player-save-system',
        saveId,
        {
          playerId: playerSaveData.id,
          username: playerSaveData.username,
          path: savePath
        }
      ));

      return player;
    } catch (error) {
      this.logger.error(`❌ Failed to load player ${saveId}:`, error);
      throw error;
    }
  }

  /**
   * Save all players
   */
  async saveAllPlayers(saveId: string, description?: string): Promise<string> {
    // TODO: Get all players from entity manager
    // For now, return the saveId as if we saved all players
    this.logger.log(`💾 Saving all players: ${saveId}`);
    return saveId;
  }

  /**
   * Load all players
   */
  async loadAllPlayers(saveId: string): Promise<void> {
    // TODO: Load all players and register them with entity manager
    this.logger.log(`📂 Loading all players: ${saveId}`);
  }

  /**
   * List all player saves
   */
  async listSaves(): Promise<ISaveInfo[]> {
    try {
      const saves: ISaveInfo[] = [];

      if (!fs.existsSync(this.savePath)) {
        return saves;
      }

      const files = fs.readdirSync(this.savePath)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(this.savePath, file));

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const saveFile: ISaveFile = JSON.parse(content);

          const stat = fs.statSync(filePath);
          const playerData = saveFile.data as IPlayerSaveData;

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
      this.logger.error('Failed to list player saves:', error);
      return [];
    }
  }

  /**
   * Delete a player save
   */
  async delete(saveId: string): Promise<boolean> {
    const savePath = path.join(this.savePath, `${saveId}.json`);

    try {
      if (fs.existsSync(savePath)) {
        // Create backup before deletion
        await this.createBackup(savePath, 'Backup before deletion');

        fs.unlinkSync(savePath);
        this.logger.log(`🗑️  Deleted player save: ${saveId}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete player save ${saveId}:`, error);
      return false;
    }
  }

  /**
   * Validate a player save
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
   * Create a backup of a player save
   */
  async backup(saveId: string, reason: string): Promise<string> {
    const savePath = path.join(this.savePath, `${saveId}.json`);
    return this.createBackup(savePath, reason);
  }

  /**
   * Get save system statistics
   */
  getStatistics(): any {
    try {
      const saves = fs.readdirSync(this.savePath)
        .filter(file => file.endsWith('.json'));

      let totalSize = 0;
      for (const file of saves) {
        const stat = fs.statSync(path.join(this.savePath, file));
        totalSize += stat.size;
      }

      return {
        saveCount: saves.length,
        totalSize,
        averageSize: saves.length > 0 ? totalSize / saves.length : 0,
        lastModified: saves.length > 0 ? fs.statSync(path.join(this.savePath, saves[0])).mtime : null
      };
    } catch (error) {
      this.logger.error('Failed to get player save statistics:', error);
      return {
        saveCount: 0,
        totalSize: 0,
        averageSize: 0,
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
      statistics: this.getStatistics()
    };
  }

  /**
   * Create save metadata
   */
  private createSaveMetadata(saveId: string, type: SaveType, description: string | undefined, playerData: IPlayerSaveData): ISaveMetadata {
    return {
      version: '1.0.0',
      timestamp: new Date(),
      gameVersion: '1.0.0', // TODO: Get from package.json
      checksum: this.calculateChecksum(playerData),
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
    const requiredFields = ['id', 'username', 'stats', 'inventory'];
    const playerData = saveFile.data as IPlayerSaveData;

    for (const field of requiredFields) {
      if (!(field in playerData)) {
        errors.push(`Missing required field: ${field}`);
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
        'player-save-system',
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
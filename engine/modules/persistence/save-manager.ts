/**
 * Save Manager - coordinates all save/load operations
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
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
  IGameStateSaveData,
  IWorldSaveData
} from './types';
import { PlayerSaveSystem } from './player-save-system';
import { GameStateSaveSystem } from './game-state-save-system';
import { WorldSaveSystem } from './world-save-system';

export class SaveManager extends EventEmitter {
  private config: IPersistenceConfig;
  private eventSystem: EventSystem;
  private logger: any;

  private playerSaveSystem: PlayerSaveSystem;
  private gameStateSaveSystem: GameStateSaveSystem;
  private worldSaveSystem: WorldSaveSystem;

  private isInitialized: boolean = false;

  constructor(config: IPersistenceConfig, eventSystem: EventSystem, logger?: any) {
    super();
    this.config = config;
    this.eventSystem = eventSystem;
    this.logger = logger || console;

    this.initializeSaveSystems();
  }

  /**
   * Initialize all save systems
   */
  private async initializeSaveSystems(): Promise<void> {
    try {
      // Ensure save directories exist
      await this.ensureDirectories();

      // Initialize save systems
      this.playerSaveSystem = new PlayerSaveSystem(this.config, this.eventSystem, this.logger);
      this.gameStateSaveSystem = new GameStateSaveSystem(this.config, this.eventSystem, this.logger);
      this.worldSaveSystem = new WorldSaveSystem(this.config, this.eventSystem, this.logger);

      this.isInitialized = true;
      this.logger.log('✅ Save systems initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize save systems:', error);
      throw error;
    }
  }

  /**
   * Ensure all required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const directories = [
      this.config.savePath,
      this.config.backupPath,
      path.join(this.config.savePath, 'players'),
      path.join(this.config.savePath, 'world'),
      path.join(this.config.savePath, 'game-state'),
      path.join(this.config.backupPath, 'players'),
      path.join(this.config.backupPath, 'world'),
      path.join(this.config.backupPath, 'game-state')
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  /**
   * Perform a full game save
   */
  async saveFullGame(description?: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Save systems not initialized');
    }

    const saveId = uuidv4();
    const startTime = Date.now();

    this.logger.log(`💾 Starting full game save: ${saveId}`);

    // Emit save started event
    this.eventSystem.emit(new GameEvent(
      PersistenceEventTypes.SAVE_STARTED,
      'save-manager',
      saveId,
      { type: SaveType.FULL, description }
    ));

    try {
      // Save all components
      const results = await Promise.allSettled([
        this.playerSaveSystem.saveAllPlayers(saveId, description),
        this.gameStateSaveSystem.saveGameState(saveId, description),
        this.worldSaveSystem.saveWorldState(saveId, description)
      ]);

      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        this.logger.warn(`⚠️  Some save operations failed: ${failures.length}`);
        failures.forEach((failure, index) => {
          this.logger.error(`Save system ${index} failed:`, failure.reason);
        });
      }

      // Create save manifest
      const manifest = this.createSaveManifest(saveId, SaveType.FULL, description);

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Full game save completed: ${saveId} (${duration}ms)`);

      // Emit save completed event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.SAVE_COMPLETED,
        'save-manager',
        saveId,
        {
          type: SaveType.FULL,
          duration,
          description,
          manifest
        }
      ));

      return saveId;
    } catch (error) {
      this.logger.error(`❌ Full game save failed: ${saveId}`, error);

      // Emit save failed event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.SAVE_FAILED,
        'save-manager',
        saveId,
        { type: SaveType.FULL, error: error.message }
      ));

      throw error;
    }
  }

  /**
   * Load a full game save
   */
  async loadFullGame(saveId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Save systems not initialized');
    }

    this.logger.log(`📂 Starting full game load: ${saveId}`);

    // Emit load started event
    this.eventSystem.emit(new GameEvent(
      PersistenceEventTypes.LOAD_STARTED,
      'save-manager',
      saveId,
      { type: SaveType.FULL }
    ));

    try {
      // Validate save before loading
      if (this.config.validateOnLoad) {
        const validation = await this.validateSave(saveId);
        if (!validation.valid) {
          throw new Error(`Save validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Load all components
      await Promise.all([
        this.playerSaveSystem.loadAllPlayers(saveId),
        this.gameStateSaveSystem.loadGameState(saveId),
        this.worldSaveSystem.loadWorldState(saveId)
      ]);

      this.logger.log(`✅ Full game load completed: ${saveId}`);

      // Emit load completed event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.LOAD_COMPLETED,
        'save-manager',
        saveId,
        { type: SaveType.FULL }
      ));
    } catch (error) {
      this.logger.error(`❌ Full game load failed: ${saveId}`, error);

      // Emit load failed event
      this.eventSystem.emit(new GameEvent(
        PersistenceEventTypes.LOAD_FAILED,
        'save-manager',
        saveId,
        { type: SaveType.FULL, error: error.message }
      ));

      throw error;
    }
  }

  /**
   * Save player data only
   */
  async savePlayers(description?: string): Promise<string> {
    return this.playerSaveSystem.saveAllPlayers(uuidv4(), description);
  }

  /**
   * Load player data only
   */
  async loadPlayers(saveId: string): Promise<void> {
    return this.playerSaveSystem.loadAllPlayers(saveId);
  }

  /**
   * Save game state only
   */
  async saveGameState(description?: string): Promise<string> {
    return this.gameStateSaveSystem.saveGameState(uuidv4(), description);
  }

  /**
   * Load game state only
   */
  async loadGameState(saveId: string): Promise<void> {
    return this.gameStateSaveSystem.loadGameState(saveId);
  }

  /**
   * Save world state only
   */
  async saveWorldState(description?: string): Promise<string> {
    return this.worldSaveSystem.saveWorldState(uuidv4(), description);
  }

  /**
   * Load world state only
   */
  async loadWorldState(saveId: string): Promise<void> {
    return this.worldSaveSystem.loadWorldState(saveId);
  }

  /**
   * List all saves of a specific type
   */
  async listSaves(type?: SaveType): Promise<ISaveInfo[]> {
    const saves: ISaveInfo[] = [];

    try {
      // Get saves from all systems
      const [playerSaves, gameStateSaves, worldSaves] = await Promise.all([
        this.playerSaveSystem.listSaves(),
        this.gameStateSaveSystem.listSaves(),
        this.worldSaveSystem.listSaves()
      ]);

      if (!type || type === SaveType.PLAYERS) {
        saves.push(...playerSaves);
      }
      if (!type || type === SaveType.GAME_STATE) {
        saves.push(...gameStateSaves);
      }
      if (!type || type === SaveType.WORLD) {
        saves.push(...worldSaves);
      }

      // Sort by timestamp (newest first)
      saves.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return saves;
    } catch (error) {
      this.logger.error('Failed to list saves:', error);
      return [];
    }
  }

  /**
   * Delete a save
   */
  async deleteSave(saveId: string): Promise<boolean> {
    try {
      // Try to delete from all systems (one should succeed)
      const results = await Promise.allSettled([
        this.playerSaveSystem.delete(saveId),
        this.gameStateSaveSystem.delete(saveId),
        this.worldSaveSystem.delete(saveId)
      ]);

      return results.some(result => result.status === 'fulfilled' && result.value);
    } catch (error) {
      this.logger.error(`Failed to delete save ${saveId}:`, error);
      return false;
    }
  }

  /**
   * Validate a save
   */
  async validateSave(saveId: string): Promise<ISaveValidationResult> {
    try {
      // Try to validate from all systems
      const results = await Promise.allSettled([
        this.playerSaveSystem.validate(saveId),
        this.gameStateSaveSystem.validate(saveId),
        this.worldSaveSystem.validate(saveId)
      ]);

      // Combine validation results
      const combined: ISaveValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        checksumValid: true,
        versionCompatible: true
      };

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const validation = result.value;
          combined.valid = combined.valid && validation.valid;
          combined.checksumValid = combined.checksumValid && validation.checksumValid;
          combined.versionCompatible = combined.versionCompatible && validation.versionCompatible;
          combined.errors.push(...validation.errors);
          combined.warnings.push(...validation.warnings);
        }
      });

      return combined;
    } catch (error) {
      this.logger.error(`Failed to validate save ${saveId}:`, error);
      return {
        valid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        checksumValid: false,
        versionCompatible: false
      };
    }
  }

  /**
   * Create a backup of a save
   */
  async backupSave(saveId: string, reason: string): Promise<string> {
    try {
      // Try to backup from all systems
      const results = await Promise.allSettled([
        this.playerSaveSystem.backup(saveId, reason),
        this.gameStateSaveSystem.backup(saveId, reason),
        this.worldSaveSystem.backup(saveId, reason)
      ]);

      // Return the first successful backup ID
      for (const result of results) {
        if (result.status === 'fulfilled') {
          return result.value;
        }
      }

      throw new Error('No backup was created');
    } catch (error) {
      this.logger.error(`Failed to backup save ${saveId}:`, error);
      throw error;
    }
  }

  /**
   * Get save statistics
   */
  async getSaveStatistics(): Promise<any> {
    try {
      const [playerStats, gameStateStats, worldStats] = await Promise.all([
        this.playerSaveSystem.getStatistics(),
        this.gameStateSaveSystem.getStatistics(),
        this.worldSaveSystem.getStatistics()
      ]);

      return {
        players: playerStats,
        gameState: gameStateStats,
        world: worldStats,
        totalSize: playerStats.totalSize + gameStateStats.totalSize + worldStats.totalSize,
        lastFullSave: new Date() // TODO: Track actual last full save
      };
    } catch (error) {
      this.logger.error('Failed to get save statistics:', error);
      return {};
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(): Promise<number> {
    let removedCount = 0;

    try {
      // Get all backup directories
      const backupDirs = [
        path.join(this.config.backupPath, 'players'),
        path.join(this.config.backupPath, 'game-state'),
        path.join(this.config.backupPath, 'world')
      ];

      for (const backupDir of backupDirs) {
        if (!fs.existsSync(backupDir)) continue;

        const files = fs.readdirSync(backupDir);
        if (files.length > this.config.maxBackups) {
          // Sort by modification time (oldest first)
          const fileStats = files.map(file => ({
            name: file,
            path: path.join(backupDir, file),
            mtime: fs.statSync(path.join(backupDir, file)).mtime
          }));

          fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

          // Remove oldest files
          const filesToRemove = fileStats.slice(0, files.length - this.config.maxBackups);
          for (const file of filesToRemove) {
            fs.unlinkSync(file.path);
            removedCount++;
          }
        }
      }

      if (removedCount > 0) {
        this.logger.log(`🧹 Cleaned up ${removedCount} old backups`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
    }

    return removedCount;
  }

  /**
   * Create save manifest
   */
  private createSaveManifest(saveId: string, type: SaveType, description?: string): ISaveMetadata {
    return {
      version: '1.0.0',
      timestamp: new Date(),
      gameVersion: '1.0.0', // TODO: Get from package.json
      checksum: '', // TODO: Calculate actual checksum
      compressed: this.config.compressionEnabled,
      saveType: type,
      description
    };
  }

  /**
   * Get save manager status
   */
  getStatus(): any {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      systems: {
        players: this.playerSaveSystem?.getStatus(),
        gameState: this.gameStateSaveSystem?.getStatus(),
        world: this.worldSaveSystem?.getStatus()
      }
    };
  }
}